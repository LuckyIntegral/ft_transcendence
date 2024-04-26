function createPopup() {
	var popup = document.createElement('div');
	popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.bottom = '0';
    popup.style.left = '0';
    popup.style.right = '0';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	return popup;
}

function createVerificationSpan(is_verified) {
	var span = document.createElement('span');
	if (is_verified) {
		span.setAttribute('class', 'material-symbols-outlined');
		span.style.color = 'green';
		span.textContent = 'check_circle';
	} else {
		span.setAttribute('class', 'material-symbols-outlined');
		span.style.color = 'red';
		span.textContent = 'unpublished';
	}
	return span;
}