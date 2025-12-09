document.addEventListener("DOMContentLoaded", function () {

});

document.querySelectorAll('.tel').forEach(el => {
	IMask(
		el, {
			mask: '+{7} (000) 000-00-00'
		}
	);
});



function widthScrollBar() {
	let div = document.createElement("div");
	div.style.overflowY = "scroll";
	div.style.width = "50px";
	div.style.height = "50px";
	document.body.append(div);
	let scrollWidth = div.offsetWidth - div.clientWidth;
	div.remove();
	return scrollWidth;
}

function fadeIn(el, timeout, display) {
	el.style.opacity = 0;
	el.style.display = display || "block";
	el.style.transition = `opacity ${timeout}ms`;
	setTimeout(() => {
		el.style.opacity = 1;
	}, 10);
}

function fadeOut(el, timeout) {
	el.style.opacity = 1;
	el.style.transition = `opacity ${timeout}ms`;
	el.style.opacity = 0;
	setTimeout(() => {
		el.style.display = "none";
	}, timeout);
}


function wrapTagInDiv(el, wrapClass = 'wrapclass') {
	let div = document.createElement("div");
	div.classList.add(wrapClass);
	el.parentNode.insertBefore(div, el);
	div.appendChild(el);
}

function wrapVideoInContent() {
	let contents = document.querySelectorAll('.content');
	if (!contents) return false;
	contents.forEach(el => {
		let videos = el.querySelectorAll('iframe, video');
		videos.forEach(video => {
			wrapTagInDiv(video, 'video');
		});
		let tables = el.querySelectorAll('table');
		tables.forEach(table => {
			wrapTagInDiv(table, 'table-adaptive');
		});
	})
}
document.addEventListener("DOMContentLoaded", wrapVideoInContent);