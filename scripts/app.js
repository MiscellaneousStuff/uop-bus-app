let app;

const MAX_SEARCH_RESULTS = 6;
const MAX_ARRIVAL_RESULTS = 3;

let results = null;
let scheduleDatetime = null;
let liveTime;
let LANGUAGE = "English (United Kingdom)";

let travelMode = "WALKING";

let infoState = "saved";
let infoMinimized = true;

let lastDirectionsSearch = null;

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
	console.log("header clicked");
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
					let availableTime = Timetable.getDiff(arrivalTimes[0], getTime()) ; // DEBUG: REPLACE THIS WITH ESTIMATED WALKING TIME
					
					infoArrivalTime.textContent += " (" + availableTime.toString() + " mins)";
					infoArrivalTime.className += " info-arrival-time-walking";
					infoArrivalTime.addEventListener("click", function(e) {
						console.log(this.className, this.click);
						map.showWalking(stopIndex);
					});
				} else {
					console.log(this.className);
					infoArrivalTime.addEventListener("click", function(e) {
						console.log(this.className, this.click);
						
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
	} else {
		$("info-arrival").style.display = "flex";
		$("info-resize").style.display = "flex";
		this.style.display = "none";
	}
});

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
	$("schedule-modal").style.display = "block";
	liveTime = fillLiveTime($("schedule-datetime"));
});

$("popup-cancel").addEventListener("click", function() {
	// DISABLE TIME UPDATE & HIDE MODAL
	$("schedule-modal").style.display = "none";
	clearInterval(liveTime);
});

$("popup-confirm").addEventListener("click", function() {
	// DISABLE TIME UPDATE & HIDE MODAL
	$("schedule-modal").style.display = "none";
	clearInterval(liveTime);
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
		
		/* Schedule Setting */
		setSchedule(this.dataset.option);
	});
}

function setSchedule(schedule) {
	if (schedule == "leave now") {
		scheduleDatetime = new Date();
	} else if (schedule == "depart at") {
		let chosenHour 		= parseInt($("schedule-datetime").textContent.split(":")[0]);
		let chosenMinute 	= parseInt($("schedule-datetime").textContent.split(":")[1]);
		scheduleDatetime 	= new Date();
		scheduleDatetime.setHours(chosenHour);
		scheduleDatetime.setMinutes(chosenMinute);
	} else if (schedule == "arrive by") {
		// DEBUG: Requires route
	}
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
		/*
		if (lastDirectionsSearch != null) {
			if (i != lastDirectionsSearch.stopIndex) {
				console.log(timetable.getStop(i));
				addDirectionsResult(timetable.getStop(i));
			}
		}
		*/
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
		let waypointCount = Math.abs(endIndex - startIndex);
		if (endIndex < startIndex) {
			let tempEndIndex = endIndex + timetables.getActiveTimetable().getStopPlaceCount();
			waypointCount = tempEndIndex - startIndex - 1;
		} else {
			waypointCount = endIndex - startIndex;
		}
		if (startIndex != undefined && endIndex != undefined) {
			// Set Route on Map
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
				console.log(waypointCount, loopStart, loopEnd);
				for (let i=loopStart; i<loopEnd; i++) {
					console.log(i % stopPlaceCount);
					waypoints.push({"location": timetable.getStopPlace(i % stopPlaceCount)});
				}
			}
			map.busDirections = map.displayRoute(start, end, "DRIVING", waypoints, "#000000");
			
			// Save Route as Recent Route
			localStorage.setItem("recentRoute", JSON.stringify({title: timetableTitle, start: startIndex, end: endIndex}));
			console.log(localStorage.getItem("recentRoute"));
			
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
	$("schedule-modal").style.display = "block";
	liveTime = fillLiveTime($("schedule-datetime"));
});

$("guide-screen-button-nav").addEventListener("click", function() {
	// Don't show the guide screen on load after it's shown the first time
	if (localStorage.getItem("visited") === null)
		localStorage.setItem("visited", "yes");
	
	// Hide Guide Screen
	app.hide("guide");
});

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

$("sidebar-help-routes").addEventListener("click", function() {
	app.show("routes");
});

$("routes-back").addEventListener("click", function() {
	app.hide("routes");
});
