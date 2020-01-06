let route;

const MAX_ZOOM = 12;
let CENTER = {
	lat: 50.79105,
	lng: -1.0772249999999985
};

class MapComponent {
	constructor(center) {
		this.map = null;
		this.center = center;
		this.markers = [];
		this.tracking = false;
		this.route = null;
		this.position = null; // users location if tracking enabled
		this.distanceMatrix = null;
		
		// DirectionsRenderer Containers
		this.routes = [];
	}
	showWalking(stopIndex) {
		if (this.position != null) {
			let origin = this.position;
			let destination = timetables.getActiveTimetable().getStopPlace(stopIndex);
			this.routes.push(this.displayRoute(origin, destination, travelMode, [], "#0000FF"));
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
			for (let i=0; i<stopPlaceCount; i++) {
				let marker = map.markers[i];
				let end = timetables.getActiveTimetable().getStopPlace(closestStop);
				if (marker.id == closestStop) {
					// Change Marker Icon
					marker.setIcon("images/bus-marker-selected.png");
					
					// Set Panel to Closest Stop
					infoState = "station";
					infoMinimized = false;
					setArrivalPane(closestStop);
					
					// Set Walking Directions
					map.routes.push(map.displayRoute(map.position, end, "WALKING", [], "#4285F4"));
				}
			}
		});
	}
	getCurrentLocation(locationControl) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				map.placeMarker(null, -1, markerHandler, {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}, true, true);
				map.position = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				$("stops-button").style.display = "block";
				showStops();
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
	// -----------------------------------------------------------------------------
	// NOTE: WIDTH & HEIGHT ARE JUST VALUES AS STRING WITHOUT PX (e.g. 1000px = "1000")
	// Gets a static image
	// IN = Route Object | OUT = True if added, False if exists
	getStaticMap(origin, destination, width, height) {
		let org = JSON.parse(localStorage.getItem(origin));
		let dest = JSON.parse(localStorage.getItem(destination));
		
		// let request = this.directionsService.directions.request;
		let start = org.lat + ',' + org.lng;
		let end = dest.lat + ',' + dest.lng;
		
		let center = CENTER.lat + "," + CENTER.lng;
		
		/*
		let path = map.directionsDisplay.directions.routes[0].overview_polyline;
		let markers = [];
		let waypoints_label_iter = 0;   
		markers.push("markers=color:green|label:" + waypoints_labels[waypoints_label_iter] + '|' + start);

		for(let i=0;i<request.waypoints.length;i++){
			//I have waypoints that are not stopovers I dont want to display them
			if(request.waypoints[i].stopover==true){
			markers.push("markers=color:blue|label:" + waypoints_labels[++waypoints_label_iter] + '|' + request.waypoints[i].location.lat() + "," +request.waypoints[i].location.lng());
			}           
		}

		markers.push("markers=color:red|label:" + waypoints_labels[++waypoints_label_iter] + '|' + end);

		markers = markers.join('&');
		*/
		
		let path = "";
		let markers = "";
		
		let value = "https://maps.googleapis.com/maps/api/staticmap?center=" + center + "&zoom=12&size=" + width + "x" + height + "&maptype=roadmap&path=enc:" + path + "&" + markers + "&key=" + KEY;
		return value;
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
				
				map.setRouteCenter(route.bounds.getCenter());
				map.updateRouteCenter();
			} else {
				console.log("CANT DISPLAY ROUTE: ", origin, destination);
			}
		});
		return directionsRenderer;
	}
	setRouteCenter(routeCenter) {
		this.routeCenter = routeCenter;
	}
	updateRouteCenter() {
		this.map.setCenter(this.routeCenter);
		if (this.routeCenter != undefined || this.routeCenter != null)
			console.log(this.routeCenter.lat(), this.routeCenter.lng());
	}
	initControls() {
		let directionsControlDiv = document.createElement("div");
		let directionsControl = new DirectionsControl(directionsControlDiv, this.map);
		directionsControlDiv.index = 1;
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(directionsControlDiv);
		
		/*
		let locationControlDiv = document.createElement("div");
		let locationControl = new LocationControl(locationControlDiv, this.map);
		locationControlDiv.index = 1;
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationControlDiv);
		*/
		
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
	/*
		LEGAL:
		- GOOGLE TERMS OF SERVICE SAYS YOU CAN CACHE THIS FOR 30 DAYS MAXIMUM
	*/
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
				// Check if we've saved the geocode so we don't spam the Google Service
				if (localStorage.hasOwnProperty(requestObject.address)) {
					let marker = new google.maps.Marker({
						map: map.map,
						position: JSON.parse(localStorage.getItem(requestObject.address)),
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
					// Get geocode if it hasn't been saved
					this.geocoder.geocode(requestObject, function(results, status) {
						if (status == "OK") {
							if (!localStorage.hasOwnProperty(requestObject.address))
								localStorage.setItem(requestObject.address, JSON.stringify(results[0].geometry.location));
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
								console.log("CANT FIND QUERIED LOCATION");
							}
						} else {
							console.log("GEOCODER ERROR: " + status, requestObject)
						}
					});
					return map.markers[map.markers.length - 1];
				}
			}
			if (zoom)
				this.map.setZoom(13);
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
	clearRoutes() {
		for (let i=0; i<this.routes.length; i++) {
			this.routes[i].set("directions", null);
		}
		this.routes = [];
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
	// showRoute();
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
			map.clearRoutes();
			map.clearMarkers();
			showRoute();
			showStops();
			map.map.setZoom(13);
			closeInfo();
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
		$(".info-arrival-subheader").textContent = "Arrival Times";
		setArrivalPane(this.id);
	}
}
