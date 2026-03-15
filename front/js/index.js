import { initMenu } from './menu.js';
import { initMap } from './map.js';
import { initTarot } from './tarot.js';

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initMap();
    initTarot();
});