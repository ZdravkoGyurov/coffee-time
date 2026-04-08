const fs = require("fs").promises;
const path = require("path");

const CONFIG = {
  subreddits: [
    "worldnews",
    "europe",
    "technology",
    "programming"
  ],
  postsPerSubreddit: 4,
  cities: [
    { name: "Varna", lat: 43.2141, lon: 27.9147 },
    { name: "Sofia", lat: 42.6977, lon: 23.3219 }
  ]
};

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt === retries) {
        throw new Error(`Fetch failed for ${url} after ${attempt} attempts: ${error.message}`);
      }
    }
  }

  throw lastError;
}

async function fetchJson(url) {
  const headers = {
    'User-Agent': 'CoffeeTime-Bot/1.0 (https://github.com/ZdravkoGyurov/coffee-time)',
    Accept: 'application/json'
  };

  // Try Reddit directly first.
  let res;
  try {
    res = await fetchWithRetry(url, { headers }, 2);
    const body = await res.text();
    return JSON.parse(body);
  } catch (directError) {
    // fallback to proxy if direct access fails
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetchWithRetry(proxyUrl, { headers }, 2);
    const wrapper = await proxyRes.json();
    if (!wrapper || typeof wrapper.contents !== 'string') {
      throw new Error(`Proxy returned unexpected wrapper for ${url}`);
    }
    try {
      return JSON.parse(wrapper.contents);
    } catch (error) {
      const snippet = wrapper.contents.slice(0, 200).replace(/\n/g, ' ');
      throw new Error(`Invalid JSON from proxy for ${url}: ${error.message}. Response snippet: ${snippet}`);
    }
  }
}

async function fetchReddit() {
  const result = {};
  for (const subreddit of CONFIG.subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=${CONFIG.postsPerSubreddit}`;
    const data = await fetchJson(url);
    result[subreddit] = data.data.children.map(post => ({
      title: post.data.title,
      permalink: post.data.permalink,
      score: post.data.score,
      thumbnail: post.data.thumbnail,
      url: post.data.url,
      created_utc: post.data.created_utc
    }));
  }
  result.generated_at = new Date().toISOString();
  return result;
}

async function fetchWeather() {
  const result = { cities: [] };
  for (const city of CONFIG.cities) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&timezone=Europe%2FBerlin`;
    const data = await fetchJson(url);
    result.cities.push({
      name: city.name,
      current_weather: data.current_weather || null
    });
  }
  result.generated_at = new Date().toISOString();
  return result;
}

async function writeData(fileName, data) {
  const filePath = path.join(__dirname, "data", fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function main() {
  try {
    const redditData = await fetchReddit();
    const weatherData = await fetchWeather();
    await writeData("reddit.json", redditData);
    await writeData("weather.json", weatherData);
    console.log("Static data updated: data/reddit.json and data/weather.json");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
