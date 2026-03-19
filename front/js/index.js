import { initMenu } from './menu.js';
import { initMap } from './map.js';
import { initTarot } from './tarot.js';
import { initFeedback } from './feedback.js';

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initMap();
    initTarot();
    initFeedback();
});