
function checkChangeZap(myCheckbox) {
    //alert(myCheckbox);
	let confirmZapCheckbox = document.getElementById('confirmZap');

    confirmZapCheckbox.disabled = !myCheckbox.checked;

	if (!myCheckbox.checked) {
        confirmZapCheckbox.checked = false;
    };
}
