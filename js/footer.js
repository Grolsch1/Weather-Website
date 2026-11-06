export function createFooter() {
  const footer = document.getElementById("site-footer");

  if (!footer) return;

  footer.innerHTML = `
        <div class="footer-content">

            <p>
                WEATHER WINDOW
            </p>

            <div class="footer-links">

                <a href="index.html">Home</a>

                <a href="about.html">About</a>

                <a href="mailto:YOUR_EMAIL@example.com">
                    Contact
                </a>

            </div>

            <p class="footer-credit">
                Weather data provided by
                <a href="https://openweathermap.org/"
                   target="_blank"
                   rel="noopener noreferrer">
                    OpenWeather
                </a>
            </p>

        </div>
    `;
}
