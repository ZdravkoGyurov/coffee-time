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
    ],
    workouts: {
        1: {
            name: "Upper 1",
            exercises: [
                "Bench Press 4 x 6-8",
                "Pull Up / Pull Down 4 x 6-10",
                "Incline Bench Press / Dip 3 x 8-12",
                "Cable Row 3 x 8-12",
                "Tricep Pushdown 3 x 10-15",
                "Dumbbell Curl 3 x 10-15"
            ]
        },
        3: {
            name: "Lower 1",
            exercises: [
                "Squat 4 x 6-8",
                "RDL 4 x 6-10",
                "Leg Press / Leg Extension 3 x 8-12",
                "Leg Curl 3 x 10-15",
                "Calf Raises 3 x 10-15"
            ]
        },
        5: {
            name: "Upper 2",
            exercises: [
                "Bench Press 4 x 6-8",
                "Pull Up / Pull Down 4 x 6-10",
                "Overhead Press 3 x 6-10",
                "Lateral Raises 3 x 12-15",
                "Tricep Pushdown 3 x 10-15",
                "Dumbbell Curl 3 x 10-15"
            ]
        },
        6: {
            name: "Lower 2",
            exercises: [
                "Squat 4 x 6-8",
                "RDL 4 x 6-10",
                "Leg Press / Leg Extension 3 x 8-12",
                "Leg Curl 3 x 10-15",
                "Calf Raises 3 x 10-15"
            ]
        },
        0: {
            name: "Lower 2",
            exercises: [
                "1. Squat 4 x 6-8",
                "2. RDL 4 x 6-10",
                "3. Leg Press / Leg Extension 3 x 8-12",
                "4. Leg Curl 3 x 10-15",
                "5. Calf Raises 3 x 10-15"
            ]
        }
    }
};

const newsDivId = "news";
const subredditClassName = "subreddit";
const postClassName = "post";
const postTextClassName = "post-text";
const scoreClassName = "post-score";

// Weather code to description mapping (open-meteo codes)
const WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with hail"
};

function getWeatherDescription(code) {
    return WEATHER_CODES[code] || "Unknown";
}

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
        const [redditRes, weatherRes] = await Promise.all([
            fetch("data/reddit.json"),
            fetch("data/weather.json")
        ]);

        if (!redditRes.ok || !weatherRes.ok) {
            throw new Error("Unable to load local data files");
        }

        const reddit = await redditRes.json();
        const weather = await weatherRes.json();
        return { reddit, weather };
    } catch (err) {
        console.error("Error loading local data:", err);
        return null;
    }
}

function createPostElement(post) {
    const postDiv = document.createElement("div");
    postDiv.className = postClassName;
    postDiv.innerHTML = `
        <img src="${post.thumbnail}" alt="post thumbnail">
        <span class="${postTextClassName}">
            <a href="https://reddit.com${post.permalink}" target="_blank">${post.title}</a>
            <span class="${scoreClassName}">↑ ${post.score}</span>
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

function renderWeather(weatherData) {
    const weatherContainer = document.getElementById("weather");
    weatherContainer.innerHTML = "";

    const h3 = document.createElement("h3");
    h3.textContent = "Weather";
    weatherContainer.appendChild(h3);

    if (!weatherData || !weatherData.cities) {
        weatherContainer.innerHTML += "<p>Weather data is unavailable.</p>";
        return;
    }

    weatherData.cities.forEach(city => {
        const p = document.createElement("p");
        if (city.current_weather) {
            const temp = city.current_weather.temperature;
            const weatherDesc = getWeatherDescription(city.current_weather.weathercode);
            p.innerHTML = `<strong>${city.name}</strong> ${temp}°C, ${weatherDesc}`;
        } else {
            p.innerHTML = `<strong>${city.name}</strong> Weather unavailable`;
        }
        weatherContainer.appendChild(p);
    });
}

function renderDate(generatedAt) {
    const dateEl = document.getElementById("date");
    if (dateEl && generatedAt) {
        dateEl.textContent = formatDate(generatedAt);
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
    const data = await fetchLocalData();
    const newsContainer = document.getElementById(newsDivId);

    if (!data) {
        if (newsContainer) {
            newsContainer.innerHTML = "<p>Unable to load site data.</p>";
        }
        return;
    }

    newsContainer.innerHTML = "";
    for (const subreddit of CONFIG.subreddits) {
        renderSubredditPosts(newsContainer, subreddit, data.reddit[subreddit]);
    }

    renderWeather(data.weather);
    renderDate(data.weather.generated_at);
    renderWorkout();
}

loadSite();
