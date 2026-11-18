/* Prediction Animation */
export function animatePrediction(element, expanded) {
  if (!window.gsap) {
    //CSS transition acts as fallback
    return;
  }

  if (expanded) {
    window.gsap.to(element, {
      scale: 1.2,
      duration: 0.35,
      ease: "power2.out",
    });
  } else {
    window.gsap.to(element, {
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
    });
  }
}

/* Navigation Hover Animation */
export function initNavigationAnimations() {
  if (!window.gsap) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  //Header and Footer Links
  const links = document.querySelectorAll(
    ".nav-links a, .footer-links a, .footer-credit a",
  );

  links.forEach((link) => {
    const hoverAnimation = window.gsap.to(link, {
      y: -6,
      scale: 1.1,
      duration: 0.4,
      ease: "black.out(1.5)",
      easeReverse: "power2.in",
      paused: true,
    });

    link.addEventListener("mouseenter", () => {
      hoverAnimation.play();
    });

    link.addEventListener("mouseleave", () => {
      hoverAnimation.reverse();
    });
    link.addEventListener("focus", () => {
      hoverAnimation.play();
    });
    link.addEventListener("blur", () => {
      hoverAnimation.reverse();
    });
  });
}
