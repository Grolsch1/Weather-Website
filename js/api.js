const API_KEY = "07c2208bd508641a135d13e435c67a5d";

const BASE_URL = "https://api.openweathermap.org";

/* Location Search */

export async function searchLocations(query) {
  const url = new URL(`${BASE_URL}/geo/1.0/direct`);

  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("appid", API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Geocoding error: ${response.status}`);
  }
  return await response.json();
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
