const mapCenter = [59.934997, 30.316418];
const mapZoom = 14;

export function initMap() {
    const mapEl = document.getElementById('geo__map');
    if (!mapEl) return;

    if (typeof ymaps === 'undefined') {
        mapEl.innerHTML = `
            <p style="padding:20px;">
                Не удалось загрузить карту. Проверьте API-ключ и подключение к интернету.
            </p>
        `;
        return;
    }

    ymaps.ready(() => {
        const myMap = new ymaps.Map('geo__map', {
            center: mapCenter,
            zoom: mapZoom,
            controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
        });

        const placemark = new ymaps.Placemark(mapCenter, {
            balloonContent: 'Офис ASTRA'
        });

        myMap.geoObjects.add(placemark);
    });
}