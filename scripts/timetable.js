/* Contains all used timetables */
class Timetables {
	constructor() {
		this.timetables = [];
		this.activeTimetable = null;
	}
	addTimetable() {
		for (let i=0; i<arguments.length; i++)
			this.timetables.push(arguments[i]);
		this.activeTimetable = this.timetables[0];
	}
	getActiveTimetable() {
		return this.activeTimetable;
	}
}

/*
TITLE = TIMETABLE TITLE (e.g. U1, U2, PR1, PR2)
DATA  = TABLE DATA (IMPLEMENTATION DEALS WITH INTERPRETING TABLE DATA
VALID = DATES AND TIMES WHICH THE TIMETABLE IS VALID (i.e. U1 = TERM TIME)
*/
class Timetable {
	constructor(title, data, stopPlaces, circular=false) {
		this.title = title;
		this.stops = this.setStops(data);
		this.routes = this.setRoutes(data);
		this.arrivals = this.setArrivals(data);
		this.stopPlaces = stopPlaces;
		this.circular = circular;
	}
	getTitle() {
		return this.title;
	}
	getStopPlaces() {
		return this.stopPlaces;
	}
	getStopPlaceCount() {
		return this.stopPlaces.length;
	}
	getStopPlace(stopIndex) {
		return this.stopPlaces[stopIndex];
	}
	getArrivals(stopIndex) {
		return this.arrivals[stopIndex];
	}
	setStops(data) {} // Abstract
	setArrivals(data) {} // Abstract
	getStop(stopIndex) {
		return this.stops[stopIndex];
	}
	getStopCount() {
		return this.stops.length;
	}
	getNextArrivals(datetime) {} // Abstract
	static isTime(cell) {
		if (cell == "...." || !(isNaN(cell)))
			return true;
		else
			return false;
	}
	// TIMES MUST BE FORMATTED AS "12:30" AND NOT "1230", BIG ON LEFT IF YOU NEED POSITIVE
	static getDiff(a, b) {
		let timeBig = new Date();
		timeBig.setHours(parseInt(a.split(":")[0]));
		timeBig.setMinutes(parseInt(a.split(":")[1]));
		
		let timeSmall = new Date();
		timeSmall.setHours(parseInt(b.split(":")[0]));
		timeSmall.setMinutes(parseInt(b.split(":")[1]));
		
		let difference = new Date(timeBig - timeSmall);
		
		return difference.getMinutes();
	}
}

/*
[U1] 3 separate bus services for first 39 traversals. they converge into one service
for the last 10 traversals
*/

class U1 extends Timetable {
	constructor(title, data, stopPlaces) {
		super(title, data, stopPlaces);
	}
	getStops() {
		return this.stops.slice(0, this.stops.length - 1); // Take off the last stop as its a circular route
	}
	setStops(data) {
		let stops = [];
		let firstPart = data.split("\n\n").filter(Boolean)[0];
		let rows = firstPart.split("\n");
		for (let r=0; r<rows.length; r++) {
			let row = rows[r].split(" ");
			for (let c=0; c<row.length; c++) {
				let cell = row[c];
				if (Timetable.isTime(cell)) {
					stops.push(row.slice(0, c).join(" "));
					break;
				}
			}
		}
		return stops;
	}
	getNextArrivals(stopIndex, arrivalCount, datetime) {
		let startHour = datetime.getHours().toString().padStart(2, "0");
		let startMinute = datetime.getMinutes().toString().padStart(2, "0");
		let startTime = startHour + startMinute;
		let arrivals = this.getArrivals(stopIndex);
		for (let i=0; i<arrivals.length; i++) {
			let arrival = arrivals[i];
			if (arrival > startTime) {
				let returnCount = Math.min(arrivalCount, arrivals.length - i);
				let arrivalResults = [];
				for (let j=0; j<returnCount; j++) {
					let currentArrival = arrivals[i + j];
					let hours = currentArrival.slice(0, 2);
					if (hours == "24")
						hours = "00";
					let time = hours + ":" + currentArrival.slice(2, arrival.length);
					if (time != "..:..")
						arrivalResults.push(time);
				}
				return arrivalResults;
			}
		}
		return null;
	}
	getNextRouteTime(startIndex, endIndex, datetime) {
		let startHour = datetime.getHours().toString().padStart(2, "0");
		let startMinute = datetime.getMinutes().toString().padStart(2, "0");
		let startTime = startHour + startMinute;
		console.log(startTime);
	}
	setArrivals(data) {
		// 12 stops so 12 arrivals
		let arrivals = [];
		for (let i=0; i<this.getStopCount(); i++)
			arrivals.push([]);
		let parts = data.split("\n\n").filter(Boolean);
		for (let p=0; p<parts.length; p++) {
			let rows = parts[p].split("\n");
			for (let r=0; r<rows.length; r++) {
				let row = rows[r].split(" ");
				for (let c=0; c<row.length; c++) {
					let cell = row[c];
					if (Timetable.isTime(cell)) {
						if (cell.slice(0, 2) == "00")
							cell = "24" + cell.slice(2, cell.length);
						arrivals[r].push(cell);
					}
				}
			}
		}
		return arrivals;
	}
	setRoutes(data) {
		let routes = [[],[],[]];
		let parts = data.split("\n\n").filter(Boolean);
		for (let p=0; p<parts.length; p++) {
			let rows = parts[p].split("\n");
			this.normaliseRows(rows);
			for (let c=0; c<rows[0].length; c++) {
				let currentRoute = p * 23 + c;
				for (let r=0; r<rows.length; r++) {
					let cell = rows[r][c];
					if (cell.slice(0, 2) == "00")
						cell = "24".concat(cell.slice(2));
					if (currentRoute < 39) {
						routes[currentRoute % 3].push(cell);
					} else {
						routes[0].push(cell);
						routes[1].push(cell);
						routes[2].push(cell);
					}
				}
			}
		}
		return routes;
	}
	normaliseRows(rows) {
		for (let r=0; r<rows.length; r++) {
			let row = rows[r].split(" ");
			for (let c=0; c<row.length; c++) {
				let cell = row[c];
				if (Timetable.isTime(cell)) {
					rows[r] = row.slice(c, row.length);
					break;
				}
			}
		}
	}
}
