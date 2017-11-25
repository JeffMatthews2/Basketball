
function checkChangePassword(myCheckbox) {
	let pwInput = document.getElementById('pwInput');
	let confirmPwInput = document.getElementById('confirmPwInput');
	pwInput.disabled = !myCheckbox.checked;
	confirmPwInput.disabled = !myCheckbox.checked;
}
