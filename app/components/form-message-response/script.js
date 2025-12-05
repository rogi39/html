function formMessageResponse(check, msg = '') {
	if (document.querySelector('.form-message-response')) document.querySelector('.form-message-response').remove();
	let div = document.createElement('div');
	div.classList.add('form-message-response');
	check === true ? div.classList.add('form-message-response__success') : div.classList.add('form-message-response__error');
	div.textContent = msg ? msg : (check === true ? 'Сообщение успешно отправлено!' : 'Заполните обязательные поля!');
	// div.textContent = 'Сообщение успешно отправлено!';

	document.querySelector('body').insertAdjacentElement('beforebegin', div);
	setTimeout(() => {
		div.classList.add('active');
		setTimeout(() => {
			div.classList.remove('active');
			setTimeout(() => {
				div.remove();
			}, 500);
		}, 3000);
	}, 10);
}