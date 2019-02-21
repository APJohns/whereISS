// Map Scripts

let issIcon = undefined;
let autoPan = true;

async function fetchAsync(url) {
	let response = await fetch(url);
	let data = await response.json();
	return data;
}

async function getISSPos(map) {
	let issPos = await fetchAsync(
		"https://cors-anywhere.herokuapp.com/http://api.open-notify.org/iss-now.json"
	);
	let lat = issPos.iss_position.latitude;
	let lon = issPos.iss_position.longitude;

	// Image credit to https://www.iconfinder.com/icons/2981850/astronomy_international_space_space_craft_space_ship_station_icon
	// https://creativecommons.org/licenses/by/3.0/
	if (issIcon) map.removeLayer(issIcon);
	issIcon = L.imageOverlay("iss.png", [
		[lat + 7, lon + 10],
		[lat - 7, lon - 10]
	]).addTo(map);
	if (autoPan) map.flyTo([lat, lon], 3);
}

async function startMap(map) {
	let issPos = await fetchAsync(
		"https://cors-anywhere.herokuapp.com/http://api.open-notify.org/iss-now.json"
	);
	let lat = issPos.iss_position.latitude;
	let lon = issPos.iss_position.longitude;
	map.setView([lat, lon], 3);

	L.tileLayer(
		"https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
		{
			attribution:
				'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: "mapbox.satellite",
			accessToken:
				"pk.eyJ1IjoiYXBqb2hucyIsImEiOiJjam01dmZqZjMwMjY4M3FueG03cXBoNzhoIn0.YzyXJ02DA4ER162lEqaeOA"
		}
	).addTo(map);
	getISSPos(map);
}

let mymap = L.map("map");
startMap(mymap);

let update = setInterval(() => {
	getISSPos(mymap);
}, 10000);

mymap.on("mousedown", () => {
	autoPan = false;
});

// Interface Scripts

const submitBtn = document.getElementById("submit");
function loading(isLoading) {
	if (isLoading) {
		let loader = document.createElement("div");
		loader.classList.add("loader");
		submitBtn.textContent = "";
		submitBtn.appendChild(loader);
	} else {
		submitBtn.textContent = "Get Flyover Time";
	}
}

const follow = document.getElementById("follow");
follow.addEventListener("click", e => {
	autoPan = true;
	getISSPos(mymap);
});

const addressForm = document.getElementById("addressForm");
const addressField = document.getElementById("addressField");
addressForm.addEventListener("submit", async e => {
	e.preventDefault();
	autoPan = false;
	let address = addressField.value;
	loading(true);
	let data = await fetchAsync(
		`http://www.mapquestapi.com/geocoding/v1/address?key=NBFsYD4ZCez8frZzKXwGsmTOwhBw57NJ&location=${address}`
	);
	loading(false);
	let location = data.results[0].locations[0].latLng;
	let marker = L.marker([location.lat, location.lng]).addTo(mymap);

	let flyover = await fetchAsync(
		`https://cors-anywhere.herokuapp.com/http://api.open-notify.org/iss-pass.json?lat=${
			location.lat
		}&lon=${location.lng}`
	);
	let flyoverTimes = flyover.response;
	marker
		.bindPopup(
			`<h2>Next Flyover</h2><p>${new Date(flyoverTimes[0].risetime * 1000)}</p>`
		)
		.openPopup();
	mymap.flyTo([location.lat, location.lng], 6);
	addressForm.reset();
});

// Bump up address form if browsing on safari mobile to get above action bar
if (
	navigator.userAgent.indexOf("iPhone") !== -1 ||
	navigator.userAgent.indexOf("iPad") !== -1
) {
	addressForm.style.bottom = "50px";
}
