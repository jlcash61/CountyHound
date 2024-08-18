// Initialize the map
const map = L.map('map').setView([37.8, -96], 4);

// Load and display a tile layer on the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// County boundaries GeoJSON (you can replace this with a more detailed one)
const countyBoundariesUrl = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
let countyBoundaries;
let currentCountyLayer = null;
let currentMarker = null;
let currentCountyLabel = null;

fetch(countyBoundariesUrl)
    .then(response => response.json())
    .then(data => {
        countyBoundaries = data;
        L.geoJson(countyBoundaries).addTo(map);
    })
    .catch(error => console.error('Error loading county boundaries:', error));

let currentCounty = null;

function speakText(message) {
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
}

function checkCounty() {
    navigator.geolocation.getCurrentPosition(position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const userLocation = [longitude, latitude];

        // Update or create the marker
        if (currentMarker) {
            currentMarker.setLatLng([latitude, longitude]);
        } else {
            currentMarker = L.marker([latitude, longitude]).addTo(map);
        }
        map.setView([latitude, longitude], 12);

        let newCounty = null;

        countyBoundaries.features.forEach(county => {
            if (turf.booleanPointInPolygon(userLocation, county)) {
                newCounty = county.properties.NAME;
                // Update the county layer on the map
                if (currentCountyLayer) {
                    map.removeLayer(currentCountyLayer);
                }
                currentCountyLayer = L.geoJson(county, {
                    style: {
                        color: 'red',
                        weight: 3
                    }
                }).addTo(map);
            }
        });

        // Update the county label and voice alert
        if (newCounty !== currentCounty) {
            const message = newCounty ? `You crossed into ${newCounty} county!` : 'You have left a county boundary!';
            speakText(message); // Speak the message
            alert(message);
            currentCounty = newCounty;

            // Update or create the county label
            if (currentCountyLabel) {
                currentCountyLabel.setContent(`Current County: ${currentCounty}`);
            } else {
                currentCountyLabel = L.popup({
                    closeButton: false,
                    autoClose: false,
                    closeOnEscapeKey: false,
                    closeOnClick: false,
                    className: 'county-label'
                })
                .setLatLng([latitude, longitude])
                .setContent(`Current County: ${currentCounty}`)
                .openOn(map);
            }
        } else if (currentCountyLabel) {
            // Update the label position to follow the user
            currentCountyLabel.setLatLng([latitude, longitude]);
        }
    }, error => {
        console.error('Error getting location:', error);
    });
}

// Add event listener to the button to start the county detection and TTS
document.getElementById('startBtn').addEventListener('click', () => {
    checkCounty();
    setInterval(checkCounty, 30000);  // Continue to check every 30 seconds
});
