function loading(isLoading, parent, content = "") {
	if (isLoading) {
		let loader = document.createElement("div");
		loader.classList.add("loader");
		parent.textContent = "";
		parent.appendChild(loader);
	} else {
		parent.textContent = content;
	}
}

// Map and ISS Scripts

const load = document.getElementById("load");

let issLat = 0;
let issLon = 0;

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
	return issPos;
}

async function updateISSPos(map) {
	let issPos = await getISSPos(map);
	issLat = issPos.iss_position.latitude;
	issLon = issPos.iss_position.longitude;

	// Image credit to https://www.iconfinder.com/icons/2981850/astronomy_international_space_space_craft_space_ship_station_icon
	// https://creativecommons.org/licenses/by/3.0/
	if (issIcon) map.removeLayer(issIcon);
	issIcon = L.imageOverlay("iss.png", [
		[issLat + 7, issLon + 10],
		[issLat - 7, issLon - 10]
	]).addTo(map);
	if (autoPan) map.flyTo([issLat, issLon], 3);
}

async function startMap(map) {
	loading(true, load);
	let issPos = await getISSPos(map);
	loading(false, load);
	issLat = issPos.iss_position.latitude;
	issLon = issPos.iss_position.longitude;
	map.setView([issLat, issLon], 3);

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
	issIcon = L.imageOverlay("iss.png", [
		[issLat + 7, issLon + 10],
		[issLat - 7, issLon - 10]
	]).addTo(map);
}

let mymap = L.map("map", {
	minZoom: 2
});
startMap(mymap);

let update = setInterval(() => {
	updateISSPos(mymap);
}, 10000);

mymap.on("mousedown", () => {
	autoPan = false;
});

// People in space

const peopleList = document.getElementById("people");
async function getPeople() {
	const people = await fetchAsync(
		"https://cors-anywhere.herokuapp.com/http://api.open-notify.org/astros.json"
	);
	people.people.forEach(person => {
		const li = document.createElement("li");
		li.textContent = `${person.name} - ${person.craft}`;
		peopleList.appendChild(li);
	});
}

getPeople();

// Interface Scripts

const follow = document.getElementById("follow");
follow.addEventListener("click", e => {
	autoPan = true;
	mymap.flyTo([issLat, issLon], 3);
});

const addressForm = document.getElementById("addressForm");
const addressField = document.getElementById("addressField");
const submitBtn = document.getElementById("submit");
addressForm.addEventListener("submit", async e => {
	e.preventDefault();
	autoPan = false;

	// Get data and from form and geolocate it
	let address = addressField.value;
	loading(true, submitBtn);
	let data = await fetchAsync(
		`https://cors-anywhere.herokuapp.com/http://www.mapquestapi.com/geocoding/v1/address?key=NBFsYD4ZCez8frZzKXwGsmTOwhBw57NJ&location=${address}`
	);
	loading(false, submitBtn, "Get Flyover Time ");
	let location = data.results[0].locations[0].latLng;
	let marker = L.marker([location.lat, location.lng]).addTo(mymap);

	// Get flyover time
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
