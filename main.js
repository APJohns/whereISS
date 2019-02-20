let circle = undefined;

async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

async function getISSPos(map) {
    let issPos = await fetchAsync('http://api.open-notify.org/iss-now.json');
    let lat = issPos.iss_position.latitude;
    let lon = issPos.iss_position.longitude;
    console.log(lat, lon);

    if (circle) map.removeLayer(circle);
    circle = L.circle([lat, lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 1000
    }).addTo(map);

    map.flyTo([lat, lon], 3);
}

async function startMap(map) {
    let issPos = await fetchAsync('http://api.open-notify.org/iss-now.json');
    let lat = issPos.iss_position.latitude;
    let lon = issPos.iss_position.longitude;
    map.setView([lat, lon], 3);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYXBqb2hucyIsImEiOiJjam01dmZqZjMwMjY4M3FueG03cXBoNzhoIn0.YzyXJ02DA4ER162lEqaeOA'
    }).addTo(map);
    getISSPos(map);
}

let mymap = L.map('map');
startMap(mymap);

let update = setInterval(() => {
    getISSPos(mymap);
}, 10000);