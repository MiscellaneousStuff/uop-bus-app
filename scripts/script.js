let timetables;
let map;

function initMap() {
	map = new MapComponent({
		lat: 50.80,
		lng: -1.08
	});
	map.initMap();
}

function showRoute() {
	let timetable = timetables.getActiveTimetable();
	let stopPlaceCount = timetable.getStopPlaceCount();
	let origin = timetable.getStopPlace(0);
	let destination;
	if (timetable.circular)
		destination = timetable.getStopPlace(stopPlaceCount - 1);
	else
		destination = origin;
	let waypoints = [];
	for (let i=1; i<stopPlaceCount-1; i++)
		waypoints.push({"location": timetable.getStopPlace(i)});
	map.displayRoute(origin, destination, "DRIVING", waypoints, "#800080");
}

/*
================================================================================

================================================================================
*/
class UoPBusApp extends App {
	constructor() {
		super();
	}
}

window.onload = function() {
	/* APP OBJECTS */
	app = new App();
	
	let mainScreen 		= new Screen("main", $("main-screen"));
	let languageScreen 	= new Screen("language", $("language-screen"));
	let settingsScreen 	= new Screen("settings", $("settings-screen"));
	let helpScreen 		= new Screen("help", $("help-screen"));
	let guideScreen		= new Screen("guide", $("guide-screen"));
	let routesScreen	= new Screen("routes", $("routes-screen"));
	
	let sidebar = new Sidebar($("sidebar-modal"));
	
	app.addScreens(mainScreen, languageScreen, settingsScreen,
	helpScreen, guideScreen, routesScreen);
	app.setSidebar(sidebar);
	
	app.show("main");
	
	/* GUI SHIT */
	timetables = new Timetables();
	let stopPlaces = u1_places.split("\n").filter(Boolean);
	timetables.addTimetable(
		new U1("U1", u1_data, stopPlaces)
	);
	suggestStops();
	showRoute();
	showStops();
	initSwipe(".guide-screen-fragments");
	
	if (localStorage.getItem("visited") != "yes")
		app.show("guide");
	app.show("main");
}
