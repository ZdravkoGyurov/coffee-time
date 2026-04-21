const fs = require("fs").promises;
const path = require("path");
const { DOMParser } = require("xmldom");

const CONFIG = {
  subreddits: [
    "worldnews",
    "europe",
    "technology",
    "gamingnews",
    "programming"
  ],
  postsPerSubreddit: 5
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

function parseRssFeed(xmlText, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  
  // Check for parser errors using xmldom's approach
  if (doc.documentElement.nodeName === 'parsererror') {
    throw new Error(`Invalid RSS XML from ${sourceUrl}`);
  }

  // Support both Atom (<entry>) and RSS (<item>)
  let items = Array.from(doc.getElementsByTagName('entry'));
  if (items.length === 0) {
    items = Array.from(doc.getElementsByTagName('item'));
  }
  
  if (items.length === 0) {
    throw new Error(`No RSS items found in ${sourceUrl}`);
  }

  return items.map(item => {
    const titleEl = item.getElementsByTagName('title')[0];
    
    // For Atom feeds: link is an attribute on <link> element
    let link = '';
    const linkEl = item.getElementsByTagName('link')[0];
    if (linkEl) {
      link = linkEl.getAttribute('href') || linkEl.textContent?.trim() || '';
    }
    
    // Try to get thumbnail from media:thumbnail
    let thumbnail = '';
    const mediaElements = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail');
    if (mediaElements.length > 0) {
      thumbnail = mediaElements[0].getAttribute('url') || '';
    }
    
    const title = titleEl?.textContent?.trim() || '';
    const permalink = link.startsWith('https://www.reddit.com')
      ? link.replace(/^https?:\/\/www\.reddit\.com/, '')
      : link;

    return {
      title,
      permalink,
      score: null,
      thumbnail,
      url: link,
      created_utc: null
    };
  });
}

async function fetchRss(url) {
  const headers = {
    'User-Agent': 'CoffeeTime-Bot/1.0 (https://github.com/ZdravkoGyurov/coffee-time)',
    Accept: 'application/rss+xml, application/xml'
  };

  const res = await fetchWithRetry(url, { headers }, 2);
  const body = await res.text();
  return parseRssFeed(body, url);
}

async function fetchReddit() {
  const result = {};
  for (const subreddit of CONFIG.subreddits) {
    const url = `https://www.reddit.com/r/${subreddit}/top/.rss?limit=${CONFIG.postsPerSubreddit}&t=day`;
    const items = await fetchRss(url);
    result[subreddit] = items;
  }
  result.generated_at = new Date().toISOString();
  return result;
}

async function loadJsonFile(fileName) {
  const filePath = path.join(__dirname, "data", fileName);
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function writeData(fileName, data) {
  const filePath = path.join(__dirname, "data", fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function main() {
  try {
    let redditData;
    try {
      redditData = await fetchReddit();
    } catch (redditError) {
      console.warn("Reddit fetch failed:", redditError.message);
      redditData = await loadJsonFile("reddit.json");
      if (!redditData) {
        console.warn("No existing reddit.json found; using empty reddit data.");
        redditData = {
          worldnews: [],
          europe: [],
          technology: [],
          gamingnews: [],
          programming: [],
          generated_at: new Date().toISOString()
        };
      }
    }

    await writeData("reddit.json", redditData);
    console.log("Static data updated: data/reddit.json");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
