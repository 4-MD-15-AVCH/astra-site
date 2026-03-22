import { initMenu } from './menu.js';
import { initMap } from './map.js';
import { initTarot } from './tarot.js';
import { initFeedback } from './feedback.js';
import { initAnimations } from './animations.js';




document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initMap();
    initTarot();
    initFeedback();
    initAnimations();
});