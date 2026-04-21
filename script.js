const CONFIG = {
    subreddits: [
        "worldnews",
        "europe",
        "technology",
        "gamingnews",
        "programming"
    ],
    postsPerSubreddit: 5,
};

const LOCAL_REDDIT_FALLBACK = {
    worldnews: [
        {
            title: "Sample Worldnews Post",
            permalink: "/r/worldnews/comments/sample/sample_post/",
            score: null,
            thumbnail: "",
            url: "https://reddit.com/r/worldnews",
            created_utc: null
        }
    ],
    europe: [
        {
            title: "Sample Europe Post",
            permalink: "/r/europe/comments/sample/sample_post/",
            score: null,
            thumbnail: "",
            url: "https://reddit.com/r/europe",
            created_utc: null
        }
    ],
    technology: [
        {
            title: "Sample Technology Post",
            permalink: "/r/technology/comments/sample/sample_post/",
            score: null,
            thumbnail: "",
            url: "https://reddit.com/r/technology",
            created_utc: null
        }
    ],
    gamingnews: [
        {
            title: "Sample Gaming News Post",
            permalink: "/r/gamingnews/comments/sample/sample_post/",
            score: null,
            thumbnail: "",
            url: "https://reddit.com/r/gamingnews",
            created_utc: null
        }
    ],
    programming: [
        {
            title: "Sample Programming Post",
            permalink: "/r/programming/comments/sample/sample_post/",
            score: null,
            thumbnail: "",
            url: "https://reddit.com/r/programming",
            created_utc: null
        }
    ],
    generated_at: new Date().toISOString()
};

const newsDivId = "news";
const subredditClassName = "subreddit";
const postClassName = "post";
const postTextClassName = "post-text";

function formatDate(dateString) {
    const date = new Date(dateString);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const dayName = days[date.getUTCDay()];
    const monthName = months[date.getUTCMonth()];
    const dayNum = date.getUTCDate();
    
    return `${dayName} ${monthName} ${dayNum}`;
}

async function fetchLocalData() {
    try {
        const redditRes = await fetch("data/reddit.json");
        if (!redditRes.ok) {
            throw new Error("Unable to load Reddit data file");
        }

        const reddit = await redditRes.json();
        return { reddit };
    } catch (err) {
        console.error("Error loading local data:", err);
        return null;
    }
}

function createPostElement(post) {
    const postDiv = document.createElement("div");
    postDiv.className = postClassName;

    const link = post.permalink && post.permalink.startsWith("/")
        ? `https://reddit.com${post.permalink}`
        : (post.permalink || post.url || "#");

    const thumbnail = post.thumbnail && post.thumbnail.startsWith("http")
        ? `<img src="${post.thumbnail}" alt="post thumbnail">`
        : "";

    postDiv.innerHTML = `
        ${thumbnail}
        <span class="${postTextClassName}">
            <a href="${link}" target="_blank">${post.title}</a>
        </span>
    `;
    return postDiv;
}

function renderSubredditPosts(newsContainer, subreddit, posts) {
    const subredditDiv = document.createElement("div");
    subredditDiv.className = subredditClassName;
    subredditDiv.innerHTML = `<h3>r/${subreddit}</h3>`;

    if (!posts || posts.length === 0) {
        subredditDiv.innerHTML += "<p>No posts available.</p>";
        newsContainer.appendChild(subredditDiv);
        return;
    }

    posts.forEach(post => subredditDiv.appendChild(createPostElement(post)));
    newsContainer.appendChild(subredditDiv);
}

function renderDate() {
    const dateEl = document.getElementById("date");
    if (dateEl) {
        dateEl.textContent = formatDate(new Date());
    }
}

function renderWorkout() {
    const workoutContainer = document.getElementById("workout");
    const today = new Date().getDay();
    const workout = CONFIG.workouts[today];

    workoutContainer.innerHTML = "";

    const h2 = document.createElement("h3");
    h2.textContent = "Workout";
    workoutContainer.appendChild(h2);

    if (!workout) {
        const restDay = document.createElement("p");
        restDay.textContent = "Rest day";
        workoutContainer.appendChild(restDay);
        return;
    }

    const h3 = document.createElement("h4");
    h3.textContent = workout.name;
    workoutContainer.appendChild(h3);

    const ul = document.createElement("ul");
    workout.exercises.forEach(exercise => {
        const li = document.createElement("li");
        li.textContent = exercise;
        ul.appendChild(li);
    });

    workoutContainer.appendChild(ul);
}

async function loadSite() {
    const localData = await fetchLocalData();
    const newsContainer = document.getElementById(newsDivId);

    // Use local JSON data (generated by GitHub Actions fetch-data.js)
    // Browser can't fetch Reddit RSS directly due to CORS
    const redditData = localData ? localData.reddit : LOCAL_REDDIT_FALLBACK;

    if (!newsContainer) return;

    newsContainer.innerHTML = "";
    for (const subreddit of CONFIG.subreddits) {
        renderSubredditPosts(newsContainer, subreddit, redditData ? redditData[subreddit] : []);
    }

    
    renderDate();
    
}

loadSite();
