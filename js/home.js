import { searchLocations, getCurrentWeather, getCountryName } from "./api.js";
import { animatePrediction } from "./animations.js";
import { navigateWithTransition } from "./page-transitions.js";

/* HTML Elements */

const searchInput = document.getElementById("location-search");
const searchButton = document.getElementById("search-button");
const predictionsContainer = document.getElementById("search-predictions");
const searchMessage = document.getElementById("search-message");

const extremeCards = document.getElementById("extreme-cards");
const cityCards = document.getElementById("city-cards");

/* Location Search */

if (searchInput && predictionsContainer) {
  /* search variables */
  let searchTimer;
  let requestNumber = 0;
  let currentLocations = [];

  const isMobile = window.matchMedia("(hover: none), (pointer: coarse)");

  /* Dispaly Messages */

  function showMessage(message) {
    if (searchMessage) {
      searchMessage.textContent = message;
    }
  }

  /* Naviagte to Visual Weather Page */

  function selectLocation(location) {
    const params = new URLSearchParams({
      lat: location.lat,
      lon: location.lon,
      name: location.name,
      country: location.country,
      state: location.state || "",
    });

    navigateWithTransition(`visual-weather.html?${params.toString()}`);
  }

  /* Generate location predictions */

  function createPrediction(location) {
    const prediction = document.createElement("button");

    prediction.type = "button";
    prediction.className = "prediction-item";
    prediction.setAttribute("role", "option");
    prediction.setAttribute("aria-expanded", "false");

    const locationName = document.createElement("span");
    locationName.className = "prediction-name";

    locationName.textContent = [
      location.name,
      location.state,
      getCountryName(location.country),
    ]
      .filter(Boolean)
      .join(", ");

    const temperature = document.createElement("span");
    temperature.className = "prediction-temperature";
    temperature.textContent = "Loading...";

    prediction.appendChild(locationName);
    prediction.appendChild(temperature);

    let expanded = false;

    function expandPrediction() {
      if (expanded) return;

      expanded = true;
      prediction.classList.add("expanded");
      prediction.setAttribute("aria-expanded", "true");
      animatePrediction(prediction, true);
    }

    function collapsePrediction() {
      if (!expanded) return;

      expanded = false;
      prediction.classList.remove("expanded");
      prediction.setAttribute("aria-expanded", "false");
      animatePrediction(prediction, false);
    }

    // desktop hover interaction
    prediction.addEventListener("mouseenter", () => {
      if (!isMobile.matches) {
        expandPrediction();
      }
    });

    prediction.addEventListener("mouseleave", () => {
      if (!isMobile.matches) {
        collapsePrediction();
      }
    });

    // Mobile + Desktop click
    prediction.addEventListener("click", () => {
      if (isMobile.matches && !expanded) {
        expandPrediction();
        return;
      }

      selectLocation(location);
    });

    return {
      element: prediction,
      temperature,
      expand: expandPrediction,
    };
  }

  /* Get Weather for Predictions */

  async function loadPredictionWeather(location, prediction) {
    try {
      const weather = await getCurrentWeather(location.lat, location.lon);

      prediction.temperature.textContent = `${Math.round(weather.main.temp)}°C`;
    } catch (error) {
      console.error("Temperature retrieval failed:", error);
      prediction.temperature.textContent = "N/A";
    }
  }

  /* Search Locations */

  async function performSearch(query, selectFirst = false) {
    const thisRequest = ++requestNumber;

    predictionsContainer.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    currentLocations = [];

    if (query.length < 2) {
      showMessage("Please enter at least two characters.");
      return;
    }

    showMessage("Searching locations...");

    try {
      const locations = await searchLocations(query);

      // Ignore Outdated Requests
      if (thisRequest !== requestNumber) return;

      if (!locations.length) {
        showMessage("No matching locations found.");
        return;
      }

      currentLocations = locations;

      if (selectFirst) {
        selectLocation(locations[0]);
        return;
      }

      showMessage("");

      const predictionElements = [];

      locations.forEach((location) => {
        const prediction = createPrediction(location);

        predictionsContainer.appendChild(prediction.element);
        predictionElements.push(prediction);
      });

      searchInput.setAttribute("aria-expanded", "true");

      // Get temperatures for all suggestions
      predictionElements.forEach((prediction, index) => {
        loadPredictionWeather(locations[index], prediction);
      });
    } catch (error) {
      if (thisRequest !== requestNumber) return;

      console.error("Location search failed:", error);
      showMessage("Unable to retrieve locations. Please try again.");
    }
  }

  /* Debounce Search Input */

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    //Invalidate previous requests immediately
    requestNumber++;

    const query = searchInput.value.trim();

    if (query.length < 2) {
      showMessage("");
      return;
    }

    showMessage("Waiting for search...");

    searchTimer = setTimeout(() => {
      performSearch(query);
    }, 450);
  });

  /* Search Button */
  if (searchButton) {
    searchButton.addEventListener("click", () => {
      clearTimeout(searchTimer);
      const query = searchInput.value.trim();
      performSearch(query);
    });
  }

  /* Keyboard interactions */
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimer);

      //Use exsisting results if availble
      if (currentLocations.length) {
        selectLocation(currentLocations[0]);
        return;
      }
      performSearch(searchInput.value.trim(), true);
    }

    if (event.key === "ArrowDown") {
      const firstPrediction =
        predictionsContainer.querySelector(".prediction-item");

      if (firstPrediction) {
        event.preventDefault();
        firstPrediction.focus();
      }
    }
  });

  //Allow Keyboard naviagtion between predictions

  predictionsContainer.addEventListener("keydown", (event) => {
    const predictions = [
      ...predictionsContainer.querySelectorAll(".prediction-item"),
    ];

    if (predictions.length === 0) return;

    const currentIndex = predictions.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      predictions[(currentIndex + 1) % predictions.length].focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex <= 0) {
        searchInput.focus();
      } else {
        predictions[currentIndex - 1].focus();
      }
    }
  });

  /* Featured Cities */
  /*
   * Temperature candidates.
   * The warmest and coldest cards are chosen
   * from these locations, not the entire world.
   */

  const extremeLocations = [
    {
      name: "Death Valley",
      country: "US",
      lat: 36.46,
      lon: -116.87,
    },
    {
      name: "Kuwait City",
      country: "KW",
      lat: 29.38,
      lon: 47.98,
    },
    {
      name: "Jacobabad",
      country: "PK",
      lat: 28.28,
      lon: 68.44,
    },
    {
      name: "Khartoum",
      country: "SD",
      lat: 15.5,
      lon: 32.56,
    },
    {
      name: "Yakutsk",
      country: "RU",
      lat: 62.03,
      lon: 129.73,
    },
    {
      name: "Oymyakon",
      country: "RU",
      lat: 63.46,
      lon: 142.79,
    },
    {
      name: "Yellowknife",
      country: "CA",
      lat: 62.45,
      lon: -114.37,
    },
    {
      name: "Utqiagvik",
      country: "US",
      lat: 71.29,
      lon: -156.79,
    },
  ];

  /* Explore the World Locations */
  const popularCities = [
    {
      name: "Tokyo",
      country: "JP",
      lat: 35.68,
      lon: 139.69,
    },
    {
      name: "London",
      country: "GB",
      lat: 51.51,
      lon: -0.13,
    },
    {
      name: "New York",
      country: "US",
      lat: 40.71,
      lon: -74.01,
    },
    {
      name: "Mumbai",
      country: "IN",
      lat: 19.08,
      lon: 72.88,
    },
    {
      name: "São Paulo",
      country: "BR",
      lat: -23.55,
      lon: -46.63,
    },
    {
      name: "Cairo",
      country: "EG",
      lat: 30.04,
      lon: 31.24,
    },
  ];

  /* Create a Featured City Card */
  function createFeaturedCard(location, type, temperature = null) {
    const card = document.createElement("button");

    card.type = "button";
    card.className = `featured-card ${type}`;

    // Card category
    const label = document.createElement("span");
    label.className = "featured-card-label";

    if (type === "warm") {
      label.textContent = "Warmest Right Now";
    } else if (type === "cold") {
      label.textContent = "Coldest Right Now";
    } else {
      label.textContent = "Explore Weather";
    }

    // City name
    const cityName = document.createElement("span");
    cityName.className = "featured-card-city";
    cityName.textContent = location.name;

    // Country name
    const countryName = document.createElement("span");
    countryName.className = "featured-card-country";
    countryName.textContent = getCountryName(location.country);
    card.appendChild(label);
    card.appendChild(cityName);
    card.appendChild(countryName);

    // Temperature, only for extreme cards
    if (temperature !== null) {
      const tempElement = document.createElement("span");
      tempElement.className = "featured-card-temperature";
      tempElement.textContent = `${Math.round(temperature)}°C`;
      card.appendChild(tempElement);
    }

    // Navigation text
    const linkText = document.createElement("span");
    linkText.className = "featured-card-link";
    linkText.textContent = "View weather ↗";
    card.appendChild(linkText);

    // Navigate when clicked
    card.addEventListener("click", () => {
      selectLocation(location);
    });
    return card;
  }

  /* Retrieve Temperature Extremes */

  async function loadExtremeCities() {
    if (!extremeCards) return;
    try {
      const results = await Promise.allSettled(
        extremeLocations.map(async (location) => {
          const weather = await getCurrentWeather(location.lat, location.lon);
          const temperature = weather.main.temp;
          if (!Number.isFinite(temperature)) {
            throw new Error("Invalid temperature");
          }
          return {
            ...location,
            temperature,
          };
        }),
      );

      // Keep successful API responses
      const cities = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      if (cities.length < 2) {
        extremeCards.textContent =
          "Unable to load featured temperatures right now.";
        return;
      }

      // Sort by temperature
      cities.sort((a, b) => a.temperature - b.temperature);
      const coldest = cities[0];
      const warmest = cities[cities.length - 1];

      // Generate the two extreme cards
      const warmCard = createFeaturedCard(warmest, "warm", warmest.temperature);
      const coldCard = createFeaturedCard(coldest, "cold", coldest.temperature);

      extremeCards.replaceChildren(warmCard, coldCard);
    } catch (error) {
      console.error("Featured weather failed:", error);

      extremeCards.textContent = "Unable to load featured weather right now.";
    }
  }

  /* Generate Explore the World Cards */

  function loadPopularCities() {
    if (!cityCards) return;
    const cards = popularCities.map((location) => {
      return createFeaturedCard(location, "city");
    });

    cityCards.replaceChildren(...cards);
  }

  /* Initialise Featured Content */

  loadExtremeCities();
  loadPopularCities();
}
