document.querySelectorAll('.tel').forEach(el => {
	IMask(
		el, {
			mask: '+{7} (000) 000-00-00'
		}
	);
});