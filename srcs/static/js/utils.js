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

function sendVerificationEmail(username = null, password = null) {
	console.log(username);
	console.log(password);
	if (username !== null) {
		fetch('/api/send-verification-code-email/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				username: username,
				password: password
			})
		}).then(function(response) {
			if (!response.ok) {
				throw new Error('Error: ' + response.statusText);
			}
		}).catch(function(error) {
			console.log('Error:', error);
		});
	} else {
		validateToken();
		if (localStorage.getItem('access') === null) {
			alert('Session expired. Please log in again.')
			window.location.hash = 'default';
			return;
		}
		fetchWithToken('/api/send-verification-code-email/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Autorization': 'Bearer ' + localStorage.getItem('access'),
			}
		}).then(function(response) {
			if (!response.ok) {
				throw new Error('Error: ' + response.statusText);
			}
		}).catch(function(error) {
			console.log('Error:', error);
		});
	}

}

function obtainToken(username, password) {
	fetch('/api/token/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username: username,
			password: password
		})
	}).then(function(response) {
		if (response.ok) {
			return response.json();
		} else {
			var errorMessage = document.createElement('p');
			errorMessage.textContent = 'Invalid username or password. Please try again.';
			errorMessage.style.color = 'red';
			var loginForm = document.getElementById('login-form');
			loginForm.removeChild(loginForm.lastChild);
			loginForm.appendChild(errorMessage);
			throw new Error('Error: ' + response.statusText);
		}
	}).then(function(data) {
		localStorage.setItem('access', data.access);
		localStorage.setItem('refresh', data.refresh);
		location.reload();
	}).catch(function(error) {
		console.log('Error:', error);
	});
}

function processTwoStepVerification(username, password) {
	var code = document.getElementById('id_verification_code').value;
	if (!code)
		return;
	fetch('/api/send-verification-code-email/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username: username,
			password: password,
			code: code
		})
	}).then(function(response) {
		if (response.ok) {
			obtainToken(username, password);
			return response.json();
		} else {
			var errorMessage = document.createElement('p');
			errorMessage.textContent = 'Invalid code. Please try again.';
			errorMessage.style.color = 'red';
			var twoStepVerificationForm = document.getElementById('two-step-verification-form');
			twoStepVerificationForm.removeChild(twoStepVerificationForm.lastChild);
			twoStepVerificationForm.appendChild(errorMessage);
			throw new Error('Error: ' + response.statusText);
		}
	}).catch(function(error) {
		console.log('Error:', error);
	});
}