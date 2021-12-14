var map = new maplibregl.Map({
    'container': 'map', // container id
    'center': [20, 52], // starting position [lng, lat]
    'maxZoom': 19, // max zoom to allow
    'zoom': 6, // starting zoom
    'hash': 'map',
    'maxPitch': 0,
    'dragRotate': false,
    'style': {
        'version': 8,
        "glyphs": "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
                'attribution': 'dane © <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
            },
            'aed-locations': {
                'type': 'geojson',
                'data': './aed_poland.geojson',
                'cluster': true,
                'clusterRadius': 30,
                'maxzoom': 14
            },
        },
        'layers': [{
            'id': 'background',
            'type': 'raster',
            'source': 'raster-tiles',
            'minZoom': 0,
        }, ]
    },
});
console.log('MapLibre library version: ' + map.version);

map.scrollZoom.setWheelZoomRate(1 / 100);

let control = new maplibregl.NavigationControl();
map.addControl(control, 'bottom-right');
let geolocate = new maplibregl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    }
});
map.addControl(geolocate, 'bottom-right');

function defineColor(access) {
    accessValues = {
        'yes': 'has-background-green',
        'no': 'has-background-grey',
        'private': 'has-background-grey',
        'permissive': 'has-background-link-dark',
        'default': 'has-background-grey'
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function defineAccessDescription(access) {
    accessValues = {
        'yes': 'ogólnodostępny',
        'no': 'prywatny',
        'private': 'prywatny',
        'permissive': 'o ograniczonym dostępie',
        'default': ''
    };

    accessClass = accessValues[access] || accessValues['default'];
    return accessClass;
}

function parseOpeningHours(openingHours) {

    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return 'całodobowo';
        } else {
            let hoursPrettified;

            try {
                let hours = openingHours.toString();
                let oh = new opening_hours(hours, undefined, 2);
                isOpen = oh.getState();
                console.log(isOpen);
                hoursPrettified = oh.prettifyValue({
                    conf: {
                        locale: 'pl'
                    },
                });

            } catch (error) {
                console.log('Error when parsing opening hours');
                return undefined;
            }

            return hoursPrettified;
        }
    } else {
        return undefined;
    }
}

function isCurrentlyOpen(openingHours) {
    if (openingHours) {
        if (openingHours.includes('24/7')) {
            return true;
        } else {
            let hours = openingHours.toString();
            let oh = new opening_hours(hours, undefined, 2);
            isOpen = oh.getState();
            return isOpen;
        }
    }
}

function defineIndoor(indoor) {
    if (indoor == 'yes') {
        return 'tak';
    } else if (indoor == 'no') {
        return 'nie';
    } else {
        return undefined;
    }
}

function showSidebar(properties) {
    // SIDEBAR - UI
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.remove('is-invisible');
        createSidebar(properties);
    } else {
        console.log('sidebar not found');
    }

}

function hideSidebar() {
    let sidebar = document.getElementsByClassName('sidebar')[0];
    if (sidebar) {
        sidebar.classList.add('is-invisible');
    } else {
        console.log('sidebar not found');
    }
}

function getOsmEditLink(id) {
    return `https://www.openstreetmap.org/edit?editor=id&node=${id}`;
}

function createSidebar(properties) {
    let sidebarHeader = document.getElementById('sidebar-header');
    let sidebarCaption = document.getElementById('sidebar-caption');
    let sidebarContent = document.getElementsByClassName('content')[0];
    let sidebarLink = document.getElementsByClassName('card-footer-item')[0];
    var isCurrOpen = '';

    sidebarHeader.classList = [];
    sidebarHeader.classList.add(defineColor(properties.access));
    sidebarCaption.innerHTML = `defibrylator AED ${defineAccessDescription(properties.access)}`;

    if (isCurrentlyOpen(properties.opening_hours)) {
        isCurrOpen = '<sup><span class="tag is-success is-light">Dostępny</span></sup>';
    } else if (isCurrentlyOpen(properties.opening_hours) == false) {
        isCurrOpen = '<sup><span class="tag is-danger is-light">Niedostępny</span></sup>';
    }


    sidebarContent.innerHTML = '';
    sidebarContent.innerHTML = ` 
        <p class="has-text-weight-light">Wewnątrz budynku?: <span class="add-new has-text-weight-medium">${defineIndoor(properties.indoor) || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>`}</span></p>
        <p class="has-text-weight-light">Dokładna lokalizacja: <span class="add-new has-text-weight-medium">${properties['defibrillator:location:pl'] || properties['defibrillator:location'] || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>`}</span></p>
        <p class="has-text-weight-light">Dostępny w godzinach: <span class="add-new has-text-weight-medium">${parseOpeningHours(properties.opening_hours) || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>`} ${isCurrOpen || '' }</span></p>
        <p class="has-text-weight-light">Opis: <span class="add-new has-text-weight-medium">${properties['description:pl'] || properties.description || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>`}</span></p>
        <p class="has-text-weight-light">Numer kontaktowy: <span class="add-new has-text-weight-medium">${properties.phone || `<span class="has-text-grey-light is-italic has-text-weight-light">brak informacji</span>`}</span></p>
    `;

    if (properties.note || properties['note:pl']) {
        sidebarContent.innerHTML += `<p class="has-text-weight-light">Uwagi: <span class="add-new has-text-weight-medium">${properties['note:pl'] || properties.note || 'brak uwag'}</span></p>`;
    }

    sidebarLink.setAttribute("href", getOsmEditLink(properties.osm_id));
}

map.on('load', () => {
    console.log('Loading icon...');

    map.loadImage('./src/img/marker-image_50.png', (error, image) => {
        if (error) throw error;
        map.addImage('aed-icon', image, {
            'sdf': false
        });
        console.log('Adding layers...');
        map.addLayer({
            'id': 'unclustered',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'icon-image': ['image', 'aed-icon'],
                'icon-size': 1,
            },
            'filter': ['!', ['has', 'point_count']],
        });
        map.addLayer({
            'id': 'clustered-circle',
            'type': 'circle',
            'source': 'aed-locations',
            'paint': {
                'circle-color': '#008954', //'rgba(204, 255, 51, 0.72)',
                'circle-radius': 26,
                'circle-stroke-color': '#f5f5f5', //'#fff',
                'circle-stroke-width': 3,
            },
            'filter': ['has', 'point_count'],
        });
        map.addLayer({
            'id': 'clustered-label',
            'type': 'symbol',
            'source': 'aed-locations',
            'layout': {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold'],
                'text-size': 20,
                'text-letter-spacing': 0.05,
            },
            'paint': {
                'text-color': '#f5f5f5',
            },
            'filter': ['has', 'point_count'],
        });
        map.on('click', 'unclustered', function (e) {
            if (e.features[0].properties !== undefined) {
                showSidebar(e.features[0].properties);
            }
        });

        map.on('mouseenter', 'unclustered', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'unclustered', () => {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'clustered-circle', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'clustered-circle', () => {
            map.getCanvas().style.cursor = '';
        });

        // zoom to cluster on click
        map.on('click', 'clustered-circle', function (e) {
            var features = map.queryRenderedFeatures(e.point, {
                layers: ['clustered-circle']
            });
            var clusterId = features[0].properties.cluster_id;
            map.getSource('aed-locations').getClusterExpansionZoom(
                clusterId,
                function (err, zoom) {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });
        console.log('Ready.');
    });
});

// Bulma controls
document.addEventListener('DOMContentLoaded', () => {

    // Get all "navbar-burger" elements
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  
    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {
  
      // Add a click event on each of them
      $navbarBurgers.forEach( el => {
        el.addEventListener('click', () => {
  
          // Get the target from the "data-target" attribute
          const target = el.dataset.target;
          const $target = document.getElementById(target);
  
          // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
          el.classList.toggle('is-active');
          $target.classList.toggle('is-active');
  
        });
      });
    }
  
  });