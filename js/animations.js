/* Prediction Animation */

export function animatePrediction(element, expanded) {
  if (!window.gsap) {
    //CSS transition acts as fallback
    return;
  }

  if (expanded) {
    window.gsap.to(element, {
      scale: 1.025,
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
