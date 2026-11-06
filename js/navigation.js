export function createNavigation() {
  const header = document.getElementById("site-header");

  if (!header) return;

  const currentPage = document.body.dataset.page;

  header.innerHTML = `
        <nav class="navbar">

            <a href="index.html" class="nav-logo">
                WEATHER WINDOW
            </a>

            <div class="nav-links">

                <a
                    href="index.html"
                    class="${currentPage === "home" ? "active" : ""}"
                    ${currentPage === "home" ? 'aria-current="page"' : ""}
                >
                    Home
                </a>

                <a
                    href="about.html"
                    class="${currentPage === "about" ? "active" : ""}"
                    ${currentPage === "about" ? 'aria-current="page"' : ""}
                >
                    About
                </a>

            </div>

        </nav>
    `;
}
