let app;

const MAX_SEARCH_RESULTS = 6;
const MAX_ARRIVAL_RESULTS = 3;
const MAX_RECENT_ROUTES = 8;
const KEY = "AIzaSyB24tTVrdzE2nS_x-PZe8gEOaksIZ24w_g";

let results = null;
let scheduleDatetime = new Date();
let travelMode = "WALKING";

let infoState = "saved";
let infoMinimized = true;

let lastDirectionsSearch = null;

let routePassed = null;

let schedule = null;
let lastChosenSchedule = "leave now";

class App {
	constructor() {
		this.language = "English (United Kingdom)";
		this.screens = [];
		this.sidebar = null;
	}
	setSidebar(sidebar) {
		this.sidebar = sidebar;
	}
	addScreens() {
		for (let i=0; i<arguments.length; i++)
			this.screens.push(arguments[i]);
	}
	show(title) {
		for (let i=0; i<this.screens.length; i++) {
			let screen = this.screens[i];
			if (screen.title == title) {
				screen.show();
			} /*else {
				screen.hide();
			}*/
		}
	}
	hide(title) {
		for (let i=0; i<this.screens.length; i++) {
			let screen = this.screens[i];
			if (screen.title == title)
				screen.hide();
		}
	}
	showSidebar() {
		this.sidebar.show();
	}
	hideSidebar() {
		this.sidebar.hide();
	}
}

class Component {
	constructor(element) {
		this.element = element;
	}
	hide() {
		this.element.style.display = "none";
	}
	show() {
		this.element.style.display = "flex";
	}
}

class Sidebar extends Component {
	constructor(element) {
		super(element);
	}
}

class Screen extends Component {
	constructor(title, element) {
		super(element);
		this.title = title;
	}
}

/*
================================================================================
HELP BUTTONS
================================================================================
*/

let helpSectionHeaders = $(".help-section-header", true);
for (let i=0; i<helpSectionHeaders.length; i++)
	helpSectionHeaders[i].addEventListener("click", helpSectionHeaderHandler);

function helpSectionHeaderHandler() {
	let links = this.parentNode.childNodes[3];
	let arrow = this.childNodes[3];
	if (links.style.display == "flex") {
		links.style.display = "none";
		arrow.className = "help-section-header-arrow-down";
	} else {
		links.style.display = "flex";
		arrow.className = "help-section-header-arrow-up";
	}
}

$("help-back").addEventListener("click", function() {
	app.hide("help");
});

/*
================================================================================
SIDEBAR OPTIONS
================================================================================
*/

$("sidebar-help-option").addEventListener("click", function() {
	app.show("help");
});

// NOTE: WHEN THE APP LOADS, THE SUGGESTIONS ARE THE AVAILABLE BUS STOPS FOR THE CURRENT TIMETABLE
function suggestStops() {
	$("search-results").innerHTML = "";
	let activeTimetable = timetables.getActiveTimetable();
	let stops = activeTimetable.getStops();
	for (let i=0; i<stops.length; i++) {
		addSearchResult(stops[i], "a", i);
	}
}

function clearSearchResults() {
	$("search-results").innerHTML = "";
}

function clearDirectionsResults() {
	$("directions-results").innerHTML = "";
}

function setArrivalPane(stopIndex) {
	if (infoState == "station") {
		let infoSections = $(".info-section", true);
		for (let i=0; i<infoSections.length; i++)
			infoSections[i].style.display = "none";
		let infoSeparators = $(".info-separator", true);
		for (let i=0; i<infoSeparators.length; i++)
			infoSeparators[i].style.display = "none";
		$("info-minimized").style.display = "none";
		$("info").className = "info info-rounded";
		$("info-quick").style.display = "none";
		infoMinimized = false;
		$("info-arrival").style.display = "block";
		$("info-resize").style.display = "flex";
		
		$("info-arrival-header").textContent = timetables.getActiveTimetable().getStop(stopIndex);
		$("info-arrival-times").innerHTML = "";
		
		// Set it to current time if it hasn't been set otherwise
		if (scheduleDatetime == null)
			scheduleDatetime = new Date();
		
		let arrivalTimes = timetables.getActiveTimetable().getNextArrivals(stopIndex, MAX_ARRIVAL_RESULTS, scheduleDatetime);
		
		if (arrivalTimes == null) {
			let infoArrivalTime = document.createElement("div");
			infoArrivalTime.className = "info-arrival-time";
			infoArrivalTime.textContent = "No more buses available today";
			$("info-arrival-times").appendChild(infoArrivalTime);
		} else {
			for (let i=0; i<arrivalTimes.length; i++) {
				let infoArrivalTime = document.createElement("div");
				infoArrivalTime.className = "info-arrival-time"
				infoArrivalTime.textContent = arrivalTimes[i];
				if (i == 0) {
					let availableTime = Timetable.getDiff(arrivalTimes[0], getTime(scheduleDatetime)) ; // DEBUG: REPLACE THIS WITH ESTIMATED WALKING TIME
					
					infoArrivalTime.textContent += " (" + availableTime.toString() + " mins)";
					infoArrivalTime.className += " info-arrival-time-walking";
					infoArrivalTime.addEventListener("click", function(e) {
						map.showWalking(stopIndex);
					});
				} else {
					infoArrivalTime.addEventListener("click", function(e) {
						// Change this to travel button
						let oldTravelButton = $(".info-arrival-time info-arrival-time-walking");
	
						let thisHandler = this.click;
						this.click = oldTravelButton.click;
						oldTravelButton.click = thisHandler;
						this.className = "info-arrival-time info-arrival-time-walking";
						$(".info-arrival-time info-arrival-time-walking").className = "info-arrival-time";
												
						// string changing
						oldTravelButton.textContent = oldTravelButton.textContent.split(" ")[0];
					});
				}
				$("info-arrival-times").appendChild(infoArrivalTime);
			}
		}
	}
}

function addSearchResult(query, result, stopIndex) {
	let searchResult = document.createElement("div");
	let searchResultIcon = document.createElement("div");
	let searchResultText = document.createElement("div");
	let searchResultQuery = document.createElement("div");
	let searchResultLocation = document.createElement("div");
	
	searchResultQuery.textContent = query;
	searchResultLocation.textContent = result.formatted_address;
	
	searchResult.className = "search-result";
	searchResultIcon.className = "search-result-icon search-result-icon-bus";
	searchResultText.className = "search-result-text";
	searchResultQuery.className = "search-result-query";
	searchResultLocation.className = "search-result-location";
	
	searchResultText.appendChild(searchResultQuery);
	searchResultText.appendChild(searchResultLocation);
	searchResult.appendChild(searchResultIcon);
	searchResult.appendChild(searchResultText);
	
	searchResult.result = result;
	searchResult.stopIndex = stopIndex;
	searchResult.addEventListener("click", function() {
		$("stops-button").style.display = "block";
		infoState = "station";
		infoMinimized = false;
		map.clearMarkers();
		map.placeMarker({"address": timetables.getActiveTimetable().getStopPlace(stopIndex)}, stopIndex, markerHandler);
		closeSearch();
		$("info-arrival").style.display = "flex";
		$("info-minimized").style.display = "none";
		$("info-resize").style.display = "flex";
		$("info").className += " info-rounded";
		setArrivalPane(stopIndex);
		map.clearRoutes();
	});
	
	if ($(".search-result", true) != null) {
		if ($(".search-result", true).length > 0) {
			let separator = document.createElement("div");
			separator.className = "search-result-separator";
			$("search-results").appendChild(separator);
		}
	}
	
	$("search-results").appendChild(searchResult);
}

function closeSearch() {
	$("search-button-sidebar").className = "search-button search-button-sidebar";
	$("search-modal").style.visibility = "hidden";
	$("search").className = "search";
	$("search-outer").style.visibility = "visible";
	
	// DEBUG: NEEDS TO BE PAIRED FOR SOME REASON
	$("search-results").style.display = "none";
	$("search-results").style.visibility = "hidden";
	
	$("start-searchbox").value = "";
}

$("search-button-sidebar").addEventListener("click", function() {
	// Sidebar button
	if (this.className == "search-button search-button-sidebar") {
		$("sidebar").className = "sidebar sidebar-in";
		$("sidebar-modal").style.display = "block";
	}
	// Back button
	else {
		closeSearch();
	}
});

$("sidebar-modal").addEventListener("click", function(e) {
	if (e.target == this) {
		$("sidebar-modal").style.display = "none";
	}
});

$("info-minimized").addEventListener("click", function() {
	if (infoState == "saved") {
		// Display Saved Routes
		let infoSections = $(".info-section", true);
		for (let i=0; i<infoSections.length; i++)
			infoSections[i].style.display = "flex";
		let infoSeparators = $(".info-separator", true);
		for (let i=0; i<infoSeparators.length; i++)
			infoSeparators[i].style.display = "flex";
		$("info-minimized").style.display = "none";
		$("info-resize").style.display = "flex";
		$("info").className += " info-rounded";
		// $("info-arrival").style.display = "flex";
		
		// Clear old saved routes and header default to no saved routes
		// Will be changed in loop if any saved routes found
		$(".info-section-trips").innerHTML = "";
		$(".info-section-header").textContent = "No Saved Routes";
		
		// Add new ones
		let recentRoutes = getRecentRoutes();
		if (recentRoutes != null) {
			for (let i=0; i<recentRoutes.length; i++) {
				let recentRoute = recentRoutes[i];
				if (recentRoute.type != "edit") {
					$(".info-section-header").textContent = "Saved Routes";
					addInfoSavedRoute(recentRoute);
				}
			}
		}
	} else {
		$("info-arrival").style.display = "flex";
		$("info-resize").style.display = "flex";
		this.style.display = "none";
	}
});

function addInfoSavedRoute(route) {
	let type = route.type;
	// Get component label and class type
	let label = type[0].toUpperCase() + type.slice(1, type.length);
	let classType = type;
	
	// Create new elements
	let infoSectionTrip = document.createElement("div");
	let infoSectionTripImage = document.createElement("div");
	let infoSectionTripName = document.createElement("div");
	
	// Apply class names
	infoSectionTrip.className = "info-section-trip";
	infoSectionTripImage.className = "info-section-trip-image";
	infoSectionTripImage.className += " info-section-trip-image-" + classType;
	infoSectionTripName.className = "info-section-trip-name";
	
	// Set contents of elements
	infoSectionTripName.textContent = label;
	
	// Show Route
	infoSectionTrip.addEventListener("click", function() {
		setDirections(route.start, route.end);
	});
	
	// Append elements to each other
	$(".info-section-trips").appendChild(infoSectionTrip);
	infoSectionTrip.appendChild(infoSectionTripImage);
	infoSectionTrip.appendChild(infoSectionTripName);
	
	return infoSectionTrip;
}

$("info-resize").addEventListener("click", function() {
	if (infoState == "saved") {
		if (infoMinimized) {
			infoMinimized = false;
		} else {
			let infoSections = $(".info-section", true);
			for (let i=0; i<infoSections.length; i++)
				infoSections[i].style.display = "none";
			let infoSeparators = $(".info-separator", true);
			for (let i=0; i<infoSeparators.length; i++)
				infoSeparators[i].style.display = "none";
			$("info-minimized").style.display = "flex";
			$("info-resize").style.display = "none";
			$("info").className = "info";
			$("info-arrival").style.display = "none";
			infoMinimized = true;
		}
	} else if (infoState == "station") {
		if (infoMinimized) {
			infoMinimized = false;
		} else {
			let infoSections = $(".info-section", true);
			for (let i=0; i<infoSections.length; i++)
				infoSections[i].style.display = "none";
			let infoSeparators = $(".info-separator", true);
			for (let i=0; i<infoSeparators.length; i++)
				infoSeparators[i].style.display = "none";
			$("info-minimized").style.display = "flex";
			$("info-resize").style.display = "none";
			$("info").className = "info";
			$("info-arrival").style.display = "none";
			infoMinimized = true;
			
			$("info-label").textContent = $("info-arrival-header").textContent;
		}
	}
});

$("start-searchbox").addEventListener("click", function() {
	$("search").className += " search-active";
	$("search-modal").style.visibility = "visible";
	$("search-button-sidebar").className += " search-button-return";
	$("search-outer").style.visibility = "visible";
	
	// DEBUG: NEEDS TO BE PAIRED FOR SOME REASON
	$("search-results").style.display = "flex";
	$("search-results").style.visibility = "visible";
});

$("start-searchbox").addEventListener("keyup", function(e) {
	if (e.keyCode == 13) {
		if ($(".search-result", true).length > 0)
			$(".search-result").click();
	} else if ($("start-searchbox").value != "") {
		clearSearchResults();
		
		let activeTimetable = timetables.getActiveTimetable();
		let query = this.value.toLowerCase().trim();
		let stopList = activeTimetable.getStops();
		
		for (let i=0; i<stopList.length; i++) {
			let stop = stopList[i].toLowerCase();
			if (query == stop.slice(0, query.length))
				addSearchResult(stopList[i], "lol", i);
		}
	} else {
		suggestStops();
	}
});

$("search-button-delayed").addEventListener("click", function() {
	if (scheduleDatetime == undefined || scheduleDatetime == null)
		scheduleDatetime = new Date();
	$("schedule-modal").style.display = "block";
	fillTime($("schedule-datetime"), scheduleDatetime);
});

/*
================================================================================
SCHEDULE MODAL
================================================================================
*/

function generateMinical(parentElement, datetime) {
	// Create New Elements
	let minical_header = document.createElement("div");
	
	// Set Classes
	minical_header.className = "mini-cal-header";
	
	// Set Header Content
	let minical_header_cw = document.createElement("div");
	minical_header_cw.className = "mini-cal-header-cw";
	// minical_header.appendChild(minical_header_cw);
	for (let i=0; i<7; i++) {
		let minical_header_day = document.createElement("div");
		minical_header_day.textContent = DAYS[(i + 1) % 7].slice(0, 3).toUpperCase();
		minical_header_day.className = "mini-cal-header-day";
		minical_header.appendChild(minical_header_day);
	}
	
	// Append Elements
	console.log(parentElement);
	parentElement.appendChild(minical_header);
	
	// Set Minical Rows
	let week_count = weekCount(datetime.getFullYear(), datetime.getMonth());
	let first_day = new Date(datetime.getFullYear(), datetime.getMonth(), 1);
	let first_week_day = getMonday(first_day);
	for (let i=0; i<week_count; i++) {
		let minical_row = document.createElement("div");
		let minical_row_cw = document.createElement("div");
		let minical_row_cw_inner = document.createElement("div");
		minical_row.className = "mini-cal-row";
		if (first_week_day.getWeek() == datetime.getWeek())
			minical_row.className += " mini-cal-row-active";
		minical_row_cw.className = "mini-cal-row-cw";
		minical_row_cw_inner.textContent = first_week_day.getWeek();
		minical_row_cw.appendChild(minical_row_cw_inner);
		// minical_row.appendChild(minical_row_cw);
		for (let i=0; i<7; i++) {
			// Create Cell
			let minical_row_cell_container = document.createElement("div");
			let minical_row_cell = document.createElement("div");
			minical_row_cell_container.className = "mini-cal-row-cell-container";
			
			// Set minical cell ID
			minical_row_cell_container.date = new Date(first_week_day);
			
			// Set cell styles
			if (first_week_day.getMonth() == datetime.getMonth()) {
				minical_row_cell.className = "mini-cal-row-cell";
			} else {
				minical_row_cell.className = "mini-cal-row-cell mini-cal-row-cell-other";
			}
			
			// Add cell behaviour
			if (sameDay(first_week_day, new Date()))
				minical_row_cell.className += " mini-cal-row-cell-today";
			/* if (first_week_day.getMonth() == datetime.getMonth()) */
			minical_row_cell_container.addEventListener("click", function() {
				/*
				calUI.setDate(datetime);
				calUI.displayEvents();
				hideMinical();
				*/
			});
			
			// Append Minical Row
			minical_row_cell.textContent = first_week_day.getDate();
			minical_row_cell_container.appendChild(minical_row_cell);
			minical_row.appendChild(minical_row_cell_container);
			first_week_day.setDate(first_week_day.getDate() + 1);
		}
		parentElement.appendChild(minical_row);
	}
}

$("schedule-datetime").addEventListener("click", function() {
	if (lastChosenSchedule == "depart at") {
		if (scheduleDatetime == null)
			scheduleDatetime = new Date();
		// Update datetime picker here as it will be guarenteed to be correct
		$("time-hour").value = scheduleDatetime.getUTCHours();
		let minutes = scheduleDatetime.getUTCMinutes();
		$("time-minute").value = Math.ceil(minutes/5)*5;
		$("datetime-modal").style.display = "block";
	}
});

$("popup-cancel").addEventListener("click", function() {
	// DISABLE TIME UPDATE & HIDE MODAL
	$("schedule-modal").style.display = "none";
});

$("popup-confirm").addEventListener("click", function() {
	// DISABLE TIME UPDATE & HIDE MODAL
	$("schedule-modal").style.display = "none";
	
	if (lastChosenSchedule == "leave now") {
		scheduleDatetime = new Date();
	} else {
		// Update timetable datetime
		scheduleDatetime = new Date($("schedule-datetime").getAttribute("datetime"));
	}
	
	// Update datetime picker here as it will be guarenteed to be correct
	$("time-hour").value = scheduleDatetime.getUTCHours();
	let minutes = scheduleDatetime.getUTCMinutes();
	$("time-minute").value = Math.ceil(minutes/5)*5;
});

let radioButtons = $(".popup-radio-button", true)
for (let i=0; i<radioButtons.length; i++) {
	let radioButton = radioButtons[i];
	radioButton.parentNode.addEventListener("click", function() {
		/* Visual Behaviour */
		let allRadios = null;
		let node = this;
		while (node.className != "popup")
			node = node.parentNode;
		allRadios = node.getElementsByClassName("popup-radio-button");
		for (let i=0; i<allRadios.length; i++)
			allRadios[i].className = "popup-radio-button";
		this.getElementsByClassName("popup-radio-button")[0].className = "popup-radio-button popup-radio-button-active";
		lastChosenSchedule = this.getAttribute("data-option");
		
		if (this.textContent.trim() == "Leave Now") {
			$("schedule-datetime").style.color = "rgba(0, 0, 0, 0.5)";
		} else {
			$("schedule-datetime").style.color = "rgba(0, 0, 0, 1)";
		}
	});
}

$("directions-back").addEventListener("click", function() {
	$("directions-modal").style.display = "none";
	$("directions-results").style.display = "none";
});

function showDirections() {
	// Show Directions Modal
	$("directions-modal").style.display = "block";
	
	// Clear Direction Searchboxes and Stopindexs
	$("directions-start").value = "";
	$("directions-start").stopIndex = undefined;
	$("directions-end").value = "";
	$("directions-end").stopIndex = undefined;
	
	// Show Bus Stops
	fillDirectionStops();
}

function fillDirectionStops() {
	clearDirectionsResults();
	let timetable = timetables.getActiveTimetable();
	for (let i=0; i<timetable.getStopCount() - 1; i++) {
		addDirectionsResult(timetable.getStop(i));
	}
}

/*
================================================================================
DIRECTIONS SEARCH BOX HANDLERS
================================================================================
*/

$("directions-start").addEventListener("click", function() {
	lastDirectionsSearch = this;
	$("directions-results").style.display = "flex";
	directionsHandler();
});

$("directions-end").addEventListener("click", function() {
	lastDirectionsSearch = this;
	$("directions-results").style.display = "flex";
	directionsHandler();
});

$("directions-start").addEventListener("keyup", directionsHandler);
$("directions-end").addEventListener("keyup", directionsHandler);

function directionsHandler(e) {
	if (this.value == "") {
		fillDirectionStops();
	} else if (this.value != "") {
		clearDirectionsResults();
		
		let activeTimetable = timetables.getActiveTimetable();
		let query = document.activeElement.value.toLowerCase().trim();
		let stopList = activeTimetable.getStops();
		
		for (let i=0; i<stopList.length; i++) {
			let stop = stopList[i].toLowerCase();
			if (query == stop.slice(0, query.length)) {
				addDirectionsResult(stopList[i]);
				/*
				if (lastDirectionsSearch != null) {
					if (i != lastDirectionsSearch.stopIndex) {
						addDirectionsResult(stopList[i]);
					}
				} else {
					addDirectionsResult(stopList[i]);
				}
				*/
			}
		}
	} else {
		clearDirectionsResults();
	}
}

function addDirectionsResult(value) {
	let directionsResult = document.createElement("div");
	let searchResultIcon = document.createElement("div");
	let searchResultText = document.createElement("div");
	let searchResultQuery = document.createElement("div");
	let searchResultLocation = document.createElement("div");
	
	searchResultQuery.textContent = value;
	searchResultLocation.textContent = "";
	
	directionsResult.className = "directions-result";
	searchResultIcon.className = "search-result-icon search-result-icon-marker";
	searchResultText.className = "search-result-text";
	searchResultQuery.className = "search-result-query";
	searchResultLocation.className = "search-result-location";
	
	searchResultText.appendChild(searchResultQuery);
	searchResultText.appendChild(searchResultLocation);
	directionsResult.appendChild(searchResultIcon);
	directionsResult.appendChild(searchResultText);
	
	// directionsResult.result = result;
	// directionsResult.stopIndex = stopIndex;
	directionsResult.addEventListener("click", function() {
		// Clear Directions Results
		$("directions-results").innerHTML = "";
		
		// Set Stops and StopIndex of current directions searchbox
		if (lastDirectionsSearch != null) {
			let stops = timetables.getActiveTimetable().getStops();
			for (let i=0; i<stops.length; i++) {
				let stop = stops[i];
				if (stop == value) {
					lastDirectionsSearch.stopIndex = i;
					lastDirectionsSearch.value = value;
					break;
				}
			}
		}
		
		// If both directions searchbox stop indexes are set, we have a route
		// Save this in recent routes as well
		let startIndex = $("directions-start").stopIndex;
		let endIndex = $("directions-end").stopIndex;
		let timetableTitle = timetables.getActiveTimetable().getTitle();
		if (startIndex != undefined && endIndex != undefined) {
			setDirections(startIndex, endIndex);
			
			// Save Route as Recent Route
			let route = {
				title: timetableTitle,
				start: startIndex,
				end: endIndex,
				type: "edit" // Default, removable,
			}
			addRecentRoute(route);
			// console.log("recent-routes after:", JSON.parse(localStorage.getItem("recent-routes")));
			
			// Hide Directions Screen
			app.hide("directions");
		}
	});
	
	if ($(".directions-result", true) != null) {
		if ($(".directions-result", true).length > 0) {
			let separator = document.createElement("div");
			separator.className = "search-result-separator";
			$("directions-results").appendChild(separator);
		}
	}
	
	$("directions-results").appendChild(directionsResult);
}

$("directions-options-button").addEventListener("click", function() {
	if (scheduleDatetime == undefined || scheduleDatetime == null)
		scheduleDatetime = new Date();
	$("schedule-modal").style.display = "block";
	fillTime($("schedule-datetime"), scheduleDatetime);
	// $("schedule-datetime").setAttribute("datetime", new Date());
});

$("guide-screen-button-nav").addEventListener("click", function() {
	// Don't show the guide screen on load after it's shown the first time
	if (localStorage.getItem("visited") === null)
		localStorage.setItem("visited", "yes");
	
	// Hide Guide Screen
	app.hide("guide");
});

function setDirections(startIndex, endIndex) {
	// Set Route on Map
	let timetableTitle = timetables.getActiveTimetable().getTitle();
	let waypointCount = Math.abs(endIndex - startIndex);
	if (endIndex < startIndex) {
		let tempEndIndex = endIndex + timetables.getActiveTimetable().getStopPlaceCount();
		waypointCount = tempEndIndex - startIndex - 1;
	} else {
		waypointCount = endIndex - startIndex;
	}
	let start = timetables.getActiveTimetable().getStopPlace(startIndex);
	let end = timetables.getActiveTimetable().getStopPlace(endIndex);
	let timetable = timetables.getActiveTimetable();
	let stopPlaceCount = timetable.getStopPlaceCount();
	let origin = timetable.getStopPlace(0);
	let destination;
	if (timetable.circular)
		destination = timetable.getStopPlace(stopPlaceCount - 1);
	else
		destination = origin;
	let waypoints = [];
	if (waypointCount > 0) {
		let loopStart = startIndex + 1;
		let loopEnd = endIndex - 1;
		if (endIndex < startIndex)
			loopEnd = endIndex + stopPlaceCount;
		for (let i=loopStart; i<loopEnd; i++) {
			waypoints.push({"location": timetable.getStopPlace(i % stopPlaceCount)});
		}
	}
	
	// Hide previous routes
	map.clearRoutes();
	
	// Show our new route
	map.routes.push(map.displayRoute(start, end, "DRIVING", waypoints, "#800080"));// "#800080");
	
	// Show reset button on map
	$("stops-button").style.display = "block";
}

/*
================================================================================
HELP GUIDE BUTTONS HANDLERS
================================================================================
*/

$("help-guide-arrivals").addEventListener("click", helpGuideHandler);

$("help-guide-routes").addEventListener("click", helpGuideHandler);

$("help-guide-saving").addEventListener("click", helpGuideHandler);

$("help-guide-schedule").addEventListener("click", helpGuideHandler);

function helpGuideHandler() {
	let type = this.id.split("-")[2];
	app.show("guide");
	switch (type) {
		case "arrivals":
			setGuidePage(0);
			break;
		case "routes":
			setGuidePage(1);
			break;
		case "saving":
			setGuidePage(2);
			break;
		case "schedule":
			setGuidePage(3);
			break;
	}
}

/*
================================================================================
GUIDE HANDLERS
================================================================================
*/

function setGuidePage(i) {
	_C.style.setProperty("--i", i);
	let dots = $(".guide-screen-dot", true);
	for (let j=0; j<dots.length; j++) {
		let dot = dots[j];
		if (i == j) {
			dot.classList.add("guide-screen-dot-active");
		} else {
			dot.classList.remove("guide-screen-dot-active");
		}
	}
	if (i == 3) {
		$("guide-screen-button-nav").textContent = "DONE";
	} else {
		$("guide-screen-button-nav").textContent = "Skip";
	}
}

/*
================================================================================
RECENT ROUTES HANDLERS
================================================================================
*/

$("routes-clear").addEventListener("click", function() {
	localStorage.setItem("recent-routes", JSON.stringify([]));
	loadRecentRoutes();
});

$("sidebar-help-routes").addEventListener("click", function() {
	loadRecentRoutes();
	app.show("routes");
});

$("routes-back").addEventListener("click", function() {
	app.hide("routes");
});

function loadRecentRoutes() {
	if (localStorage.hasOwnProperty("recent-routes")) {
		// Get recent routes if user has recent routes
		let recentRoutes = getRecentRoutes();
		recentRoutes.reverse();
		
		// Clear routes sections
		$(".routes-sections").innerHTML = "";
		
		// Loop through recent routes if they exist
		for (let i=0; i<recentRoutes.length; i++) {
			// Get Recent Route from LocalStorage
			let recentRoute = recentRoutes[i];
			
			// Get Recent Route Details
			let timetable = timetables.getActiveTimetable()
			let start = recentRoute.start;
			let end = recentRoute.end;
			let startStop = timetable.getStop(start);
			let endStop = timetable.getStop(end);
			let type = recentRoute.type;
			
			// Create elements for recent route entry
			let routesSection = document.createElement("div");
			let routesSectionMap = document.createElement("div");
			let routesSectionDesc = document.createElement("div");
			let routesSectionDescIcon = document.createElement("div");
			let infoSectionTrip = document.createElement("div");
			let infoSectionTripInner = document.createElement("div");
			let routesSectionDescStops = document.createElement("div");
			let routesSectionDescStart = document.createElement("div");
			let routesSectionDescEnd = document.createElement("div");
			
			// Apply classes to new elements
			routesSection.className = "routes-section";
			routesSectionMap.className = "routes-section-map";
			routesSectionDesc.className = "routes-section-desc";
			routesSectionDescIcon.className = "routes-section-desc-icon";
			infoSectionTrip.className = "info-section-trip";
			infoSectionTripInner.className = "info-section-trip-image";
			infoSectionTripInner.className += " info-section-trip-image-" + type;
			routesSectionDescStops.className = "routes-section-desc-stops";
			routesSectionDescStart.className = "routes-section-desc-start";
			routesSectionDescEnd.className = "routes-section-desc-end";
			
			// Set content of relevant elements
			routesSectionDescStart.textContent = startStop;
			routesSectionDescEnd.textContent = "to " + endStop;
			routesSectionDescIcon.route = recentRoute;
			
			// Set routes section and icon click handlers here
			routesSection.addEventListener("click", function(e) {
				app.hide("routes");
				setDirections(start, end);
				app.hideSidebar();
				app.show("main");
			});
			routesSectionDescIcon.addEventListener("click", function() {
				routePassed = this.route;
				app.show("routeType");
			});
			
			// Append elements to each other
			infoSectionTrip.appendChild(infoSectionTripInner);
			routesSectionDescIcon.appendChild(infoSectionTrip);
			routesSectionDescStops.appendChild(routesSectionDescStart);
			routesSectionDescStops.appendChild(routesSectionDescEnd);
			routesSectionDesc.appendChild(routesSectionDescIcon);
			routesSectionDesc.appendChild(routesSectionDescStops);
			routesSection.appendChild(routesSectionMap);
			routesSection.appendChild(routesSectionDesc);
			$(".routes-sections").appendChild(routesSection);
			
			// Set minimap content
			let minimapStart = timetable.getStopPlace(start);
			let minimapEnd = timetable.getStopPlace(end);
			let width = window.innerWidth - REM(2);
			let height = 120;
			let staticMap = map.getStaticMap(minimapStart, minimapEnd, width, height);
			routesSectionMap.style.backgroundImage = "url('" + staticMap + "')";
		}
	}
}

/*
================================================================================
RECENT ROUTE TYPE MODAL HANDLERS
================================================================================
*/

let routeTypeOptions = $(".route-type-popup-option", true);
for (let i=0; i<routeTypeOptions.length; i++) {
	let option = routeTypeOptions[i];
	option.addEventListener("click", function() {
		let index = getRouteIndex(routePassed.start, routePassed.end);
		if (index != -1) {
			let routes = getRecentRoutes();
			routes[index].type = this.getAttribute("data-option");
			console.log(this.getAttribute("data-option"));
			localStorage.setItem("recent-routes", JSON.stringify(routes));
		}
		loadRecentRoutes();
		
		app.hide("routeType");
		app.show("routes");
	});
}

/*
================================================================================
RECENT ROUTE STORAGE
================================================================================
*/

// NOTE: Saving a route as none is the same as deleting it as all routes saved
// as edit are removed when new recent routes are added, only saved routes don't
// get overwritten. There's a maximum of 4 saved routes and 4 recent routes for
// a total of 8 routes in the recent route screen in total.

function getRouteIndex(start, end) {
	let recentRoutes = JSON.parse(localStorage.getItem("recent-routes"));
	let index = -1;
	for (let i=0; i<recentRoutes.length; i++) {
		let recentRoute = recentRoutes[i];
		let recentStart = recentRoute.start;
		let recentEnd = recentRoute.end;
		if (recentStart == start & recentEnd == end) {
			return i;
		}
	}
	return index;
}

// -----------------------------------------------------------------------------
// Returns a list of route objects
function getRecentRoutes() {
	let recentRoutes = JSON.parse(localStorage.getItem("recent-routes"));
	return recentRoutes;
}

// -----------------------------------------------------------------------------
// Adds a route object to local storage
// IN = Route Object | OUT = True if added, False if exists
function addRecentRoute(route) {
	// Add recent route array if it doesn't exist
	if (!localStorage.hasOwnProperty("recent-routes"))
		localStorage.setItem("recent-routes", JSON.stringify([]));
	
	// Get recent / saved routes
	let recentRoutes = JSON.parse(localStorage.getItem("recent-routes"));
	
	// Check if route exists
	for (let i=0; i<recentRoutes.length; i++) {
		let recentRoute = recentRoutes[i];
		let start = recentRoute.start;
		let end = recentRoute.end;
		if (route.start == start && route.end == end)
			return false;
	}
	
	// Add route if it doesn't exist and recent route limit hasn't been reached
	if (recentRoutes.length != MAX_RECENT_ROUTES) {
		recentRoutes.push(route);
		localStorage.setItem("recent-routes", JSON.stringify(recentRoutes));
		return true;
	} else {
		return false;
	}
}

/*
================================================================================
DATETIME MODAL HANDLERS
================================================================================
*/

$("datetime-popup-cancel").addEventListener("click", function() {
	// Go back
	$("datetime-modal").style.display = "none";
});

$("datetime-popup-confirm").addEventListener("click", function() {
	// Set time of previous modal and change its text content
	let hour = $("time-hour").value;
	let minute = $("time-minute").value;
	let d = new Date();
	d.setUTCHours(parseInt(hour));
	d.setUTCMinutes(parseInt(minute));
	
	$("schedule-datetime").setAttribute("datetime", d);
	$("schedule-datetime").textContent = hour + ":" + minute.padStart(2, "0");
	
	// Go back
	$("datetime-modal").style.display = "none";
});
