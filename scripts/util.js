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

function getTime() {
	let date = new Date();
	let hours = date.getHours().toString().padStart(2, "0");
	let minutes = date.getMinutes().toString().padStart(2, "0");
	let printTime = hours + ":" + minutes;
	return printTime;
}

function fillTime(elem) {
	elem.textContent = getTime();
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
