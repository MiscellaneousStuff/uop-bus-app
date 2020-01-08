const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [ "January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December" ];

function $(id, multi) {
	if (id[0] == ".") {
		let elems = document.getElementsByClassName(id.slice(1));
		if (multi) {
			return elems;
		} else {
			return elems[0];
		}
	} else {
		return document.getElementById(id);
	}
}

function weekCount(year, month) {
	let count = 1;
	let firstDay = new Date(year, month);
	let lastDay = new Date(year, month+1);
	// lastDay.setDate(lastDay.getDate() - 1);
	let lastWeek = firstDay.getWeek();
	while (firstDay.getTime() != lastDay.getTime()) {
		let currentWeek = firstDay.getWeek();
		if (lastWeek != currentWeek) {
			lastWeek = currentWeek;
			count += 1;
		}
		firstDay.setDate(firstDay.getDate() + 1);
	}
	return count;
}

function getTime(datetime) {
	let date = datetime;
	if (typeof(datetime) == "string")
		date = new Date(datetime);
	let hours = date.getHours().toString().padStart(2, "0");
	let minutes = date.getMinutes().toString().padStart(2, "0");
	let printTime = hours + ":" + minutes;
	return printTime;
}

function fillTime(elem, datetime) {
	elem.textContent = getTime(datetime);
}

function fillLiveTime(elem) {
	fillTime(elem);
	let interval = setInterval(function() {
		fillTime(elem);
	}, 1000);
	return interval;
}

function REM(rem) {
	return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

// D1 = Event Start, D2 = View Start, END = View End
function sameWeek(d1, d2) {
	let d2_copy = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
	let end = new Date(d2.getTime());
	end.setDate(end.getDate() + 7);
	// end.setSeconds(end.getSeconds() - 1);
	if (d1 >= d2_copy && d1 < end && (d1.getWeek() == d2_copy.getWeek())) {
		return true;
	} else {
		return false;
	}
}

function getMonday(d) {
	d = new Date(d);
	day = d.getDay(),
	diff = d.getDate() - day + (day == 0 ? -6:1);
	return new Date(d.setDate(diff));
}

// TAKEN FROM: https://weeknumber.net/how-to/javascript
Date.prototype.getWeek = function() {
	var date = new Date(this.getTime());
	date.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
	// January 4 is always in week 1.
	var week1 = new Date(date.getFullYear(), 0, 4);
	// Adjust to Thursday in week 1 and count number of weeks from date to week1.
	return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
		                - 3 + (week1.getDay() + 6) % 7) / 7);
}

function sameDay(d1, d2) {
	return d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate();
}
