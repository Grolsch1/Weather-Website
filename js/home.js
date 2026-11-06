import { searchLocations, getCurrentWeather, getCountryName } from "./api.js";

import { animatePrediction } from "./animations.js";

/* HTML Elements */
const searchInput = document.getElementById("location-search");
const searchButton = document.getElementById("search-button");
const predictionsContainer = document.getElementById("search-predictions");
const searchMessage = document.getElementById("search-message");

if (searchInput && predictionsContainer) {
  /* search variables */
  let searchTimer;
  let requestNumber = 0;
  let currentLocations = [];

  const isMobile = window.matchMedia("(hover: none), (pointer: coarse)");

  /* Dispaly Messages */
  function showMessage(message) {
    searchMessage.textContent = message;
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

    window.location.href = `visual-weather.html?${params.toString()}`;
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
      //Ignore Outdated Requests
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
      console.error("Location Search failed: ", error);
      showMessage("Unable to retrieve locations. Please try again.");
    }
  }

  /* Debounce Search Input */

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    //Invalidate previous requests immediately
    requestNumber++;

    const query = searchInput.value.trim();
    predictionsContainer.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    currentLocations = [];

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
  searchButton.addEventListener("click", () => {
    clearTimeout(searchTimer);
    const query = searchInput.value.trim();
    performSearch(query);
  });

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

      //Otherwise perform a search first
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

    // Stop if there are no predictions
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
}
