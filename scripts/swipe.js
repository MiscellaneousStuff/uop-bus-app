let i = 0, x0 = null, locked = false;

let _C = null, N = null;

function unify(e) {	return e.changedTouches ? e.changedTouches[0] : e };

function lock(e) {
  x0 = unify(e).clientX;
	_C.classList.toggle('smooth', !(locked = true))
};

function drag(e) {
	e.preventDefault();
	
	if(locked) 		
		_C.style.setProperty('--tx', `${Math.round(unify(e).clientX - x0)}px`)
};

function move(e) {
	if(locked) {
		let dx = unify(e).clientX - x0, s = Math.sign(dx);

		if((i > 0 || s < 0) && (i < N - 1 || s > 0))
			_C.style.setProperty('--i', i -= s);
		_C.style.setProperty('--tx', '0px');
		_C.classList.toggle('smooth', !(locked = false));
		x0 = null;
		let dots = $(".guide-screen-dot", true);
		console.log(dots, dots.length);
		for (let j=0; j<dots.length; j++) {
			let dot = dots[j];
			if (i == j) {
				dot.classList.add("guide-screen-dot-active");
			} else {
				dot.classList.remove("guide-screen-dot-active");
			}
			if (j == i) {
				
			} else {
				
			}
		}
	}
};

function initSwipe(selector) {
	_C = document.querySelector(selector), 
      N = _C.children.length;
      
	_C.style.setProperty('--n', N);

	_C.addEventListener('mousedown', lock, false);
	_C.addEventListener('touchstart', lock, false);

	_C.addEventListener('mousemove', drag, false);
	_C.addEventListener('touchmove', drag, false);

	_C.addEventListener('mouseup', move, false);
	_C.addEventListener('touchend', move, false);	
}
