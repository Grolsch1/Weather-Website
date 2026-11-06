const API_KEY = "07c2208bd508641a135d13e435c67a5d";

const BASE_URL = "https://api.openweathermap.org";

/* Location Search */

export async function searchLocations(query) {
  const url = new URL("https://api.openweathermap.org/geo/1.0/direct");

  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("appid", API_KEY);

  console.log("Searching OpenWeather for:", query);

  const response = await fetch(url);

  // Retrieve the response
  const data = await response.json();

  // Display the actual API response
  console.log("OpenWeather response:", {
    status: response.status,
    data: data,
  });

  // Check for HTTP errors
  if (!response.ok) {
    throw new Error(
      `OpenWeather error ${response.status}: ${
        data.message || "Unknown API error"
      }`,
    );
  }

  // Make sure the API returns an array
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from OpenWeather API.");
  }

  return data;
}

/* Current Weather */

export async function getCurrentWeather(lat, lon) {
  const url = new URL(`${BASE_URL}/data/2.5/weather`);

  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("units", "metric");
  url.searchParams.set("appid", API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather error: ${response.status}`);
  }

  return await response.json();
}

/* Country Loaction Name */
export function getCountryName(countryCode) {
  const countries = new Intl.DisplayNames(["en"], { type: "region" });

  return countries.of(countryCode) || countryCode;
}
