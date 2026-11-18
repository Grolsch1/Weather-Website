import { getCurrentWeather, getCountryName } from "./api.js";

/* HTML Elements */
const locationName = document.getElementById("location-name");
const weatherWindow = document.getElementById("weather-window");
const weatherInformation = document.getElementById("weather-information");

/* le Visual Weather page */
if (document.body.dataset.page === "visual-weather") {
  /* Get location information from the URL */
  const params = new URLSearchParams(window.location.search);

  const lat = params.get("lat");
  const lon = params.get("lon");
  const name = params.get("name");
  const country = params.get("country");
  const state = params.get("state");

  /* Display location name */
  if (name) {
    const locationDetails = [
      name,
      state,
      country ? getCountryName(country) : "",
    ].filter(Boolean);

    locationName.textContent = locationDetails.join(", ");
  }

  /* Display loading message */
  weatherWindow.textContent = "Loading weather...";
  weatherInformation.innerHTML = "";

  /* Retrieve and display weather */
  async function loadWeather() {
    // Check that the URL contains coords
    if (
      !lat ||
      !lon ||
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lon))
    ) {
      weatherWindow.textContent =
        "No location selected. Please return to the homepage and search for a location.";
      return;
    }

    try {
      const weather = await getCurrentWeather(lat, lon);

      console.log("Retrieved weather data:", weather);

      displayWeather(weather);
    } catch (error) {
      console.error("Weather retrieval failed:", error);

      weatherWindow.textContent =
        "Unable to retrieve weather information. Please try again.";
    }
  }

  /* Calculate the sky colour based on temperature */
  function getSkyColour(temperature) {
    const palette = [
      { temperature: -10, colour: "#086AB3" },
      { temperature: 0, colour: "#19B3B8" },
      { temperature: 10, colour: "#A3C3CE" },
      { temperature: 20, colour: "#F6C157" },
      { temperature: 30, colour: "#F39406" },
      { temperature: 40, colour: "#8f0012" },
    ];

    // Keep temperatures within the palette range
    const temp = Math.max(-10, Math.min(40, temperature));

    // Find the two colours surrounding the temperature
    let lower = palette[0];
    let upper = palette[palette.length - 1];

    for (let i = 0; i < palette.length - 1; i++) {
      if (
        temp >= palette[i].temperature &&
        temp <= palette[i + 1].temperature
      ) {
        lower = palette[i];
        upper = palette[i + 1];
        break;
      }
    }

    // Calculate how far between the two colours we are
    const ratio =
      (temp - lower.temperature) / (upper.temperature - lower.temperature);

    // Convert hexadecimal colours into RGB values
    const hexToRgb = (hex) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    const start = hexToRgb(lower.colour);
    const end = hexToRgb(upper.colour);

    // Blend the two colours
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /* Determine the time of day at the searched location */
  function getTimeOfDay(weather) {
    const now = Date.now() / 1000;
    const sunrise = weather.sys.sunrise;
    const sunset = weather.sys.sunset;

    // Number of seconds in one hour
    const hour = 60 * 60;

    // Sunrise: 1 hour before to 1 hour after sunrise
    if (now >= sunrise - hour && now < sunrise + hour) {
      return "sunrise";
    }

    // Sunset: 1 hour before to 1 hour after sunset
    if (now >= sunset - hour && now < sunset + hour) {
      return "sunset";
    }

    // Daytime
    if (now >= sunrise + hour && now < sunset - hour) {
      return "day";
    }

    // Nighttime
    return "night";
  }

  function getCloudMarkup(cloudCover) {
    let cloudCount = Math.round(20 * Math.pow(cloudCover / 100, 1.5));
    const cloudPositions = [
      { x: -5, y: 12, scale: 1.2 },
      { x: 18, y: 5, scale: 1.1 },
      { x: 43, y: 13, scale: 1.3 },
      { x: 70, y: 7, scale: 1.1 },
      { x: 5, y: 28, scale: 1.3 },
      { x: 30, y: 23, scale: 1.1 },
      { x: 58, y: 27, scale: 1.4 },
      { x: 82, y: 23, scale: 1.2 },
      { x: -8, y: 40, scale: 1.1 },
      { x: 15, y: 37, scale: 1.4 },
      { x: 38, y: 34, scale: 1.2 },
      { x: 63, y: 39, scale: 1.3 },
      { x: 85, y: 36, scale: 1.1 },
      { x: 3, y: 17, scale: 0.9 },
      { x: 25, y: 14, scale: 1.0 },
      { x: 48, y: 8, scale: 0.9 },
      { x: 73, y: 16, scale: 1.0 },
      { x: 12, y: 32, scale: 0.9 },
      { x: 52, y: 31, scale: 1.0 },
      { x: 77, y: 30, scale: 0.9 },
    ];

    // Cloud positions with lower cloud cover = skies more 'spacious'
    const selectedPositions = [];
    const minDistance = cloudCover <= 30 ? 38 : cloudCover <= 60 ? 25 : 12;

    for (const position of cloudPositions) {
      const isFarEnough = selectedPositions.every((selected) => {
        const horizontalDistance = Math.abs(position.x - selected.x);
        const verticalDistance = Math.abs(position.y - selected.y);

        return (
          horizontalDistance > minDistance ||
          verticalDistance > minDistance * 0.6
        );
      });

      if (isFarEnough) {
        selectedPositions.push(position);
      }

      if (selectedPositions.length >= cloudCount) break;
    }

    // Use the actual number of successfully selected positions
    cloudCount = selectedPositions.length;

    // Increase opacity as the cloud cover increases
    const cloudOpacity = 0.8 + (cloudCover / 100) * 0.15;
    weatherWindow.style.setProperty("--cloud-opacity", cloudOpacity);

    let clouds = "";

    for (let i = 0; i < cloudCount; i++) {
      const position = selectedPositions[i];
      clouds += `
      <div
        class="weather-cloud"
        style="
          --cloud-x: ${position.x}%;
          --cloud-y: ${position.y}%;
          --cloud-scale: ${position.scale};
        "
      ></div>
    `;
    }

    return `
      <div class="weather-cloud-layer" aria-hidden="true">
      ${clouds}
      </div>
    `;
  }

  /* Rain Effects */
  function getPrecipitationMarkup(weather) {
    const condition = weather.weather[0].main;
    const description = weather.weather[0].description.toLowerCase();

    //Type of precipitation
    let precipitationType = "";

    if (condition === "Snow" || weather.snow) {
      precipitationType = "snow";
    } else if (condition === "Drizzle") {
      precipitationType = "drizzle";
    } else if (
      condition === "Rain" ||
      condition === "Thunderstorm" ||
      weather.rain
    ) {
      precipitationType = "rain";
    }
    //Without precipitation, let there be an empty layer
    if (!precipitationType) {
      return "";
    }

    //Intensity of the particles
    let intensity = "moderate";
    if (description.includes("light")) {
      intensity = "light";
    } else if (
      description.includes("heavy") ||
      description.includes("extreme")
    ) {
      intensity = "heavy";
    }

    //Particle Counts and Settings
    const settings = {
      drizzle: {
        light: { count: 12, speed: 4 },
        moderate: { count: 22, speed: 3 },
        heavy: { count: 32, speed: 2.5 },
      },
      rain: {
        light: { count: 22, speed: 2.5 },
        moderate: { count: 40, speed: 1.8 },
        heavy: { count: 65, speed: 1.2 },
      },
      snow: {
        light: { count: 18, speed: 7 },
        moderate: { count: 32, speed: 5 },
        heavy: { count: 48, speed: 3.5 },
      },
    };

    const { count, speed } = settings[precipitationType][intensity];

    let particles = "";

    for (let i = 0; i < count; i++) {
      const x = Math.random() * 100;
      const delay = Math.random() * speed;
      const duration = speed + Math.random() * 2;
      const size = 0.7 + Math.random() * 0.8;

      particles += `
      <span
        class="precipitation-particle precipitation-${precipitationType}"
        style="
          --particle-x: ${x}%;
          --particle-delay: -${delay}s;
          --particle-duration: ${duration}s;
          --particle-size: ${size};
        "
      ></span>
    `;
    }
    return `
    <div class="precipitation-layer" aria-hidden="true">
      ${particles}
    </div>
  `;
  }

  /* Thunderstorm lightning effects */
  let lightningTimeout;
  function startLightning(weather) {
    const mainElement = document.querySelector(
      'body[data-page="visual-weather"] main',
    );

    const condition = weather.weather[0].main;

    // Clear any existing lightning timer
    clearTimeout(lightningTimeout);
    mainElement.classList.remove("lightning-flash");

    // Only activate during thunderstorms
    if (condition !== "Thunderstorm") {
      return;
    }

    function triggerLightning() {
      // Restart the flash animation
      mainElement.classList.remove("lightning-flash");

      void mainElement.offsetWidth;

      mainElement.classList.add("lightning-flash");

      // Remove the animation class after it finishes
      setTimeout(() => {
        mainElement.classList.remove("lightning-flash");
      }, 180);

      // Random delay between flashes: 4–12 seconds
      const delay = 4000 + Math.random() * 8000;

      lightningTimeout = setTimeout(triggerLightning, delay);
    }

    // Start after a short random delay
    lightningTimeout = setTimeout(
      triggerLightning,
      2000 + Math.random() * 4000,
    );
  }

  /* Display Weather info */
  function displayWeather(weather) {
    const temperature = Math.round(weather.main.temp);
    const feelsLike = Math.round(weather.main.feels_like);
    const conditions = weather.weather[0].description;
    const clouds = weather.clouds.all;
    const windSpeed = (weather.wind.speed * 3.6).toFixed(1);
    const humidity = weather.main.humidity;
    const timezone = weather.timezone;
    const timeOfDay = getTimeOfDay(weather);

    document.body.dataset.timeOfDay = timeOfDay;
    console.log("Time of day:", timeOfDay);

    /* Update the inner weather window's colours */
    const skyColour = getSkyColour(weather.main.temp);
    weatherWindow.style.setProperty("--sky-colour", skyColour);
    weatherWindow.style.setProperty("--cloud-edge", skyColour);

    const windSpeedMs = weather.wind.speed;
    const windDirection = weather.wind.deg ?? 0;

    // Geography note: wind direction is where the wind comes from,
    // so I reverse it to calculate what direction the clouds should travel to.
    const movementAngle = ((windDirection + 180) * Math.PI) / 180;
    const windX = Math.sin(movementAngle);
    const windY = -Math.cos(movementAngle);

    // Convert wind direction into a movement distance
    const movementDistance = 180;
    weatherWindow.style.setProperty(
      "--wind-x",
      `${windX * movementDistance}px`,
    );
    weatherWindow.style.setProperty(
      "--wind-y",
      `${windY * movementDistance}px`,
    );

    // Stronger winds produce faster cloud movement
    const windDuration = Math.max(5, 100 / Math.max(windSpeedMs, 0.5));
    weatherWindow.style.setProperty("--wind-duration", `${windDuration}s`);

    // Sky darkens with cloud cover
    const cloudDim = (clouds / 100) * 0.38;
    weatherWindow.style.setProperty("--cloud-dim", cloudDim);

    // Atmospheric haze with humidtiy
    const humidityHaze = Math.pow(humidity / 100, 1.5) * 0.22;
    weatherWindow.style.setProperty("--humidity-haze", humidityHaze);

    /* Display basic weather info */
    //Using the icons from OpenWeather as they are already responsive to weather
    weatherWindow.innerHTML = `
    ${getCloudMarkup(clouds)}
    ${getPrecipitationMarkup(weather)}

      <div class="weather-summary">
        <img
          src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png"
          alt="${conditions}"
          class="weather-icon"
        />

        <p class="weather-temperature">${temperature}°C</p>

        <p class="weather-condition">${conditions}</p>
      </div>
    `;

    /* Display weather stats */
    weatherInformation.innerHTML = `
      <div class="weather-stat">
        <h2>Feels Like</h2>
        <p>${feelsLike}°C</p>
      </div>

      <div class="weather-stat">
        <h2>Cloud Cover</h2>
        <p>${clouds}%</p>
      </div>

      <div class="weather-stat">
        <h2>Wind Speed</h2>
        <p>${windSpeed} km/h</p>
      </div>

      <div class="weather-stat">
        <h2>Humidity</h2>
        <p>${humidity}%</p>
      </div>
    `;

    /* Display local time */
    displayLocalTime(timezone);
    startLightning(weather);
  }

  /* Calculate the selected location's local time */
  function displayLocalTime(timezoneOffset) {
    const localTime = document.createElement("p");
    localTime.id = "location-clock";

    weatherInformation.appendChild(localTime);

    function updateClock() {
      const now = new Date(Date.now() + timezoneOffset * 1000);

      const time = now.toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      localTime.textContent = `Local time: ${time}`;
    }

    updateClock();

    setInterval(updateClock, 1000);
  }

  /* Start the weather request */
  loadWeather();
}
