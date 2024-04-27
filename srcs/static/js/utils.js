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

function validateToken() {
	var token = localStorage.getItem('access');
	if (token === null) {
		window.location.hash = 'default';
		document.getElementById("profileRef").style.display = "none";
		document.getElementById("friendsRef").style.display = "none";
		document.getElementById("messagesRef").style.display = "none";
		document.getElementById("logOutRef").style.display = "none";
	} else {
		if (token) {
			fetchWithToken('/api/verify-token/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + token,
				},
			})
			.then(function(response) {
				if (response.ok) {
					document.getElementById("loginRef").style.display = "none";
					document.getElementById("signUpRef").style.display = "none";
				} else {
					document.getElementById("profileRef").style.display = "none";
					document.getElementById("friendsRef").style.display = "none";
					document.getElementById("messagesRef").style.display = "none";
					document.getElementById("logOutRef").style.display = "none";
					localStorage.removeItem('access');
				}
			});
		} else {
			document.getElementById("content").innerHTML = "<h1>Invalid token</h1>";
			document.getElementById("profileRef").style.display = "none";
			document.getElementById("friendsRef").style.display = "none";
			document.getElementById("messagesRef").style.display = "none";
			document.getElementById("logOutRef").style.display = "none";
		}
	}
	return false;
}