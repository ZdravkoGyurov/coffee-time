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

async function fetchJson(url) {
  // Use a CORS proxy to bypass Reddit's restrictions
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, {
    headers: {
      'User-Agent': 'CoffeeTime-Bot/1.0 (https://github.com/ZdravkoGyurov/coffee-time)'
    }
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${url} (${res.status})`);
  }
  return res.json();
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
