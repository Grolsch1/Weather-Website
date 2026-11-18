import { createNavigation } from "./navigation.js";
import { createFooter } from "./footer.js";
import { initNavigationAnimations } from "./animations.js";
import { initPageTransitions } from "./page-transitions.js";

import "./home.js";
import "./visual-weather.js";

createNavigation();
createFooter();
initNavigationAnimations();
initPageTransitions();
