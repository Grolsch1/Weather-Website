/* GSAP Curve Swipe Page Transitions */
const TRANSITION_KEY = "weather-window-transition";
let isNavigating = false;

/* Check Accessibility Preferences */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Navigate with Curve Swipe */
export function navigateWithTransition(destination) {
  if (isNavigating) return;
  const url = new URL(destination, window.location.href);

  // Normal navigation when animations are unavailable
  if (!window.gsap || prefersReducedMotion()) {
    window.location.assign(url.href);
    return;
  }
  const overlay = document.getElementById("page-transition");
  if (!overlay) {
    window.location.assign(url.href);
    return;
  }
  isNavigating = true;
  document.documentElement.classList.add("transition-active");

  // Animate upward until fully covered
  window.gsap.fromTo(
    overlay,
    {
      yPercent: 100,
    },
    {
      yPercent: 0,
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: () => {
        try {
          sessionStorage.setItem(
            TRANSITION_KEY,
            url.pathname + url.search + url.hash,
          );
        } catch (error) {
          // Continue if storage is unavailable
        }
        window.location.assign(url.href);
      },
    },
  );
}

/* Initialise Page Transitions */
export function initPageTransitions() {
  const overlay = document.getElementById("page-transition");

  if (!overlay) return;

  function resetTransition() {
    document.documentElement.classList.remove(
      "transition-active",
      "transition-arriving",
    );
    if (window.gsap) {
      window.gsap.set(overlay, {
        clearProps: "transform",
      });
    }
    isNavigating = false;
  }

  /* Reveal the arriving page */
  function revealPage() {
    if (!document.documentElement.classList.contains("transition-arriving")) {
      return;
    }
    // Clear the transition marker
    try {
      sessionStorage.removeItem(TRANSITION_KEY);
    } catch (error) {
      // Continue without storage
    }
    if (!window.gsap || prefersReducedMotion()) {
      resetTransition();
      return;
    }
    document.documentElement.classList.add("transition-active");
    window.gsap.set(overlay, {
      yPercent: 0,
    });
    // Move upward to reveal the new page
    window.gsap.to(overlay, {
      yPercent: -100,
      duration: 0.8,
      ease: "power3.inOut",
      onComplete: resetTransition,
    });
  }

  /* Wait for the page to finish loading */
  if (document.readyState === "complete") {
    revealPage();
  } else {
    window.addEventListener("load", revealPage, {
      once: true,
    });
  }

  /* Handle links added dynamically */
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link) return;

    // Preserve downloads and external/new-tab links
    if (
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    ) {
      return;
    }
    const url = new URL(link.href);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== window.location.origin
    ) {
      return;
    }

    // Ignore links to the current page and its anchors
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      return;
    }

    // Prevent the browser's immediate navigation
    event.preventDefault();
    navigateWithTransition(url.href);
  });

  /* Reset if the browser restores a cached page */

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      resetTransition();
    }
  });
}
