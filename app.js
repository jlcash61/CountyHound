// Initialize the map
const map = L.map('map').setView([37.8, -96], 4);

// Load and display a tile layer on the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// County boundaries GeoJSON (you can replace this with a more detailed one)
const countyBoundariesUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
let countyBoundaries;

fetch(countyBoundariesUrl)
    .then(response => response.json())
    .then(data => {
        countyBoundaries = data;
        L.geoJson(countyBoundaries).addTo(map);
    })
    .catch(error => console.error('Error loading county boundaries:', error));

let currentCounty = null;

function checkCounty() {
    navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const userLocation = [longitude, latitude];

        // Update the map with the user's current location
        const marker = L.marker([latitude, longitude]).addTo(map);
        map.setView([latitude, longitude], 12);

        let newCounty = null;

        countyBoundaries.features.forEach(county => {
            if (turf.booleanPointInPolygon(userLocation, county)) {
                newCounty = county.properties.NAME;
            }
        });

        if (newCounty !== currentCounty) {
            if (newCounty) {
                alert(`You crossed into ${newCounty} county!`);
            } else {
                alert('You have left a county boundary!');
            }
            currentCounty = newCounty;
        }
    }, error => {
        console.error('Error getting location:', error);
    });
}

// Check every 30 seconds (adjust as needed)
setInterval(checkCounty, 30000);
