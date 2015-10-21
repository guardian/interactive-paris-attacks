import L from '../lib/leaflet'

function parseLatLng(latlng) {
    return latlng.split(',').map(l => parseFloat(l));
}

const initialZoom = 12;

export default function Map(el, config) {

    var icon = L.icon({
        iconUrl: config.assetPath + '/assets/imgs/attack.svg',
        iconSize:     [20, 20],
        iconAnchor:   [10, 10]
    });

    function featureToLayer(feature) {
        var latlng = parseLatLng(feature.location);
        var layer, layer2;
        switch (feature.type) {
            case 'point':
                layer = L.marker(latlng, {
                    'className': 'paris-map__point',
                    'icon': icon
                });
                layer2 = L.circleMarker(latlng, {
                    'className': 'paris-map__point',
                    'radius': 8,
                    'text': feature.label,
                    'textAnchor': feature.labelAnchor || 'start'
                });
                break;
            default: console.log(`Unknown feature type: "${feature.type}"`); break;
        }

        return [layer, layer2];
    }
    function adjust(latlng, zoom, mobileZoom) {
        var view = window.getComputedStyle(el, ':after').getPropertyValue('content');
        var overlayWidth = 0;
        if (view === '"desktop"') {
            overlayWidth = 500;
        } else if (view === '"leftCol"' || view === '"wide"') {
            overlayWidth = 640;
        } else if (view !== '"tablet"') {
            zoom = (mobileZoom || zoom) - 1;
        }
        var targetPoint = map.project(latlng, zoom).subtract([overlayWidth / 2, 0]),
            targetLatLng = map.unproject(targetPoint, zoom);

        return {latlng: targetLatLng, zoom};
    }

    var map = L.map(el, {
        'minZoom': 10,
        'maxZoom': 18,
        'zoomControl': false
    });

    setTimeout(() => map.invalidateSize(), 1000);

    var view = adjust([48.886284, 2.349205], initialZoom);
    map.setView(view.latlng, view.zoom);

    // Leaflet's retina test
    var retina =
        (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1 ? '@2x' : '';

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}{retina}.png?access_token={accessToken}', {
        'id': 'guardian.935305a9',
        'accessToken': 'pk.eyJ1IjoiZ3VhcmRpYW4iLCJhIjoiNHk1bnF4OCJ9.25tK75EuDdgq5GxQKyD6Fg',
        'retina': retina,
        'attribution': '<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, © <a href="http://mapbox.com">Mapbox</a>'
    }).addTo(map);

    var features = L.featureGroup([]).addTo(map);

    var currentChapter;
    map.on('zoomend', () => {
        if (currentChapter && currentChapter.features) {
            currentChapter.features.map(featureToLayer).reduce((a,b) => a.concat(b)).forEach(layer => features.addLayer(layer));
        }
    });
    this.go = function (chapter) {
        var latlng = parseLatLng(chapter.center);
        var zoom = parseInt(chapter.zoom);

        features.clearLayers();
        currentChapter = chapter;

        var view = adjust(latlng, zoom, parseInt(chapter.mobileZoom));
        map.flyTo(view.latlng, view.zoom);
    };

    this.invalidate = map.invalidateSize.bind(map);
}
