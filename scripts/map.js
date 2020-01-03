let route;

const MAX_ZOOM = 12;

class MapComponent {
	constructor(center) {
		this.map = null;
		this.center = center;
		this.markers = [];
		this.tracking = false;
		this.route = null;
		this.position = null; // users location if tracking enabled
		this.distanceMatrix = null;
	}
	showWalking(stopIndex) {
		if (this.position != null) {
			let origin = this.position;
			let destination = timetables.getActiveTimetable().getStopPlace(stopIndex);
			this.displayRoute(origin, destination, travelMode, [], "#0000FF");
		}
	}
	addMarker(marker) {
		let markerCopy = marker;
		this.markers.push(markerCopy);
	}
	setRoute(route) {
		this.route = route;
	}
	getRoute(route) {
		return this.route;
	}
	getClosestStop() {
		console.log(travelMode, map.position);
		this.distanceMatrixService.getDistanceMatrix({
			origins: [map.position],
			destinations: timetables.getActiveTimetable().getStopPlaces(),
			travelMode: travelMode
		}, function(response, status) {
			map.distanceMatrix = response.rows;
			let stopPlaceCount = timetables.getActiveTimetable().getStopPlaceCount();
			let closest = response.rows[0].elements[0].distance.value;
			let closestStop = -1;
			for (let i=1; i<stopPlaceCount; i++) {
				let distance = response.rows[0].elements[i].distance.value;
				if (distance < closest) {
					closest = distance;
					closestStop = i;
				}
			}
			console.log(closestStop, timetables.getActiveTimetable().getStop(closestStop));
			map.markers[closestStop].setIcon("images/bus-marker-selected.png");
		});
	}
	getCurrentLocation(locationControl) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				console.log(position.coords.latitude, position.coords.longitude);
				map.placeMarker(null, -1, markerHandler, {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}, true, true);
				map.position = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				map.getClosestStop();
			});
			locationControl.className = "map-button map-button-GPS";
		} else {
			locationControl.className = "map-button map-button-noGPS";
		}
	}
	initMap() {
		this.map = new google.maps.Map(
			$("map"), {
				zoom: 13,
				center: this.center,
				disableDefaultUI: true,
				clickableIcons: false
			}
		);
		this.service = new google.maps.places.PlacesService(map.map);
		this.geocoder = new google.maps.Geocoder;
		this.directionsService = new google.maps.DirectionsService;
		this.distanceMatrixService = new google.maps.DistanceMatrixService();
		this.initControls();
	}
	displayRoute(origin, destination, travelMode, waypoints=[], color) {
		let directionsRenderer = new google.maps.DirectionsRenderer({
			draggable: false,
			map: this.map,
			preserveViewport: true,
			suppressMarkers: true,
			polylineOptions: {
				strokeColor: color,
				icons:[{repeat:'50px',icon:{path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW}}]
			}
		})
		this.directionsService.route({
			origin: origin,
			destination: destination,
			waypoints: waypoints,
			travelMode: travelMode
		}, function(response, status) {
			if (status == "OK") {
				route = response.routes[0];
				map.setRoute(route);
				directionsRenderer.setDirections(response);
				
				/*
				map.map.setCenter(route.bounds.getCenter());
				*/
				
				map.setRouteCenter(route.bounds.getCenter());
				map.updateRouteCenter();
			} else {
				console.log("CANT DISPLAY ROUTE: ", origin, destination);
			}
		});
	}
	setRouteCenter(routeCenter) {
		this.routeCenter = routeCenter;
	}
	updateRouteCenter() {
		this.map.setCenter(this.routeCenter);
	}
	initControls() {
		let directionsControlDiv = document.createElement("div");
		let directionsControl = new DirectionsControl(directionsControlDiv, this.map);
		directionsControlDiv.index = 1;
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(directionsControlDiv);
		
		let locationControlDiv = document.createElement("div");
		let locationControl = new LocationControl(locationControlDiv, this.map);
		locationControlDiv.index = 1;
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationControlDiv);
		
		// Redundant button?
		let stopsControlDiv = document.createElement("div");
		let stopsControl = new StopsControl(stopsControlDiv, this.map);
		stopsControlDiv.index = 1;
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(stopsControlDiv);
	}
	isUniqueMarker(id) {
		for (let i=0; i<this.markers.length; i++) {
			let marker = this.markers[i];
			if (marker.id == id)
				return false;
		}
		return true;
	}
	placeMarker(requestObject, id, handler, latlng=null, zoom=false, center=false) {
		if (this.isUniqueMarker(id)) {
			if (latlng != null) {
				let marker = new google.maps.Marker({
					map: this.map,
					position: latlng,
					animation: google.maps.Animation.DROP,
					draggable: false,
					icon: {
						url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
					}
				});
				map.map.setCenter(marker.position);
				marker.id = id;
				google.maps.event.addListener(marker, 'click', handler);
				map.markers.push(marker);
			} else {
				this.geocoder.geocode(requestObject, function(results, status) {
					if (status == "OK") {
						if (results[0]) {
							let marker = new google.maps.Marker({
								map: map.map,
								position: results[0].geometry.location,
								animation: google.maps.Animation.DROP,
								draggable: false,
								preserveViewport: true,
								icon: {
									url: "images/bus-marker-base.png"
								}
							})
							if (center) {
								map.map.setCenter(marker.position);
							}
							marker.id = id;
							google.maps.event.addListener(marker, 'click', handler);
							map.markers.push(marker);
						} else {
							console.log("CANT FIND FUCK ALL");
						}
					} else {
						console.log("GEOCODER'S FUCKED ITSELF: " + status, requestObject)
					}
				});
				return map.markers[map.markers.length - 1];
			}
			if (zoom)
				this.map.setZoom(14);
		}
	}
	clearMarkers() {
		for (let i=0; i<this.markers.length; i++)
			this.markers[i].setMap(null);
		this.markers = [];
	}
	getCenter() {
		return this.map.getCenter();
	}
	textSearch(query, func) {
		let request = {
			location: this.map.getCenter(),
			radius: "4000",
			query: query
		}
		this.service.textSearch(request, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				let MAX = Math.min(results.length, MAX_SEARCH_RESULTS);
				func(results.slice(0, MAX));
			}
		});
	}
}

function showStops() {
	let timetable = timetables.getActiveTimetable();
	let stopPlaceCount = timetable.getStopPlaceCount();
	for (let i=0; i<stopPlaceCount; i++) {
		let stopPlace = timetable.getStopPlace(i);
		let marker = map.placeMarker({"address": stopPlace}, i, markerHandler, null, false, false);
	}
	map.updateRouteCenter();
}

class DirectionsControl {
	constructor(controlDiv) {
		let controlUI = document.createElement("div");
		controlUI.className = "map-button map-button-directions";
		controlUI.id = "directions-button";
		controlDiv.appendChild(controlUI);
		controlUI.addEventListener("click", function() {
			showDirections();
		});
	}
}

class StopsControl {
	constructor(controlDiv) {
		let controlUI = document.createElement("div");
		controlUI.className = "map-button map-button-stops";
		controlUI.id = "stops-button";
		controlDiv.appendChild(controlUI);
		controlUI.addEventListener("click", function() {
			showStops();
			$("stops-button").style.display = "none";
		});
	}
}

class LocationControl {
	constructor(controlDiv) {
		let controlUI = document.createElement("div");
		controlUI.className = "map-button map-button-noGPS";
		controlUI.id = "location-button";
		controlUI.style.display = "flex";
		controlDiv.appendChild(controlUI);
		controlUI.addEventListener("click", function() {
			map.getCurrentLocation(this);
		});
	}
}

function markerHandler() {
	if (this.id != -1) {
		infoState = "station";
		infoMinimized = false;
		setArrivalPane(this.id);
	}
}
