function editProfile() {
	var displayName = document.getElementById('displayName');
	var email = document.getElementById('email');
	var phoneNumber = document.getElementById('phoneNumber');
	var editProfileButton = document.getElementById('buttonEditProfile');
	var newDisplayName = document.createElement('input');
	var newEmail = document.createElement('input');
	var newPhoneNumber = document.createElement('input');

	newDisplayName.setAttribute('type', 'text');
	newDisplayName.setAttribute('id', 'displayName');
	newDisplayName.setAttribute('value', displayName.textContent);
	newDisplayName.setAttribute('placeholder', 'Beatiful Name');
	
	newEmail.setAttribute('type', 'text');
	newEmail.setAttribute('id', 'email');
	newEmail.setAttribute('value', email.textContent);
	newEmail.setAttribute('placeholder', 'prossi@exam02.ez.pass');
	
	newPhoneNumber.setAttribute('type', 'text');
	newPhoneNumber.setAttribute('id', 'phoneNumber');
	newPhoneNumber.setAttribute('value', phoneNumber.textContent);
	newPhoneNumber.setAttribute('placeholder', '+380 12 345 6789');
	
	displayName.parentNode.replaceChild(newDisplayName, displayName);
	email.parentNode.replaceChild(newEmail, email);
	phoneNumber.parentNode.replaceChild(newPhoneNumber, phoneNumber);
	
	editProfileButton.textContent = 'Save';
	editProfileButton.removeEventListener('click', editProfile);
	editProfileButton.addEventListener('click', saveProfile);
}

function saveProfile() {
	document.getElementById('loading').style.display = 'block';
	var newDisplayName = document.getElementById('displayName');
	var newEmail = document.getElementById('email');
	var newPhoneNumber = document.getElementById('phoneNumber');
	var editProfileButton = document.getElementById('buttonEditProfile');
	var email = document.createElement('p');
	var phoneNumber = document.createElement('p');
	var displayName = document.createElement('p');
	
	fetchWithToken ('/api/profile/', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + localStorage.getItem('token'),
		},
		body: JSON.stringify({
			displayName: newDisplayName.value,
			email: newEmail.value,
			phoneNumber: newPhoneNumber.value
		})
	}).then(function(response) {
		if (response.ok) {
			if (email.textContent !== newEmail.value) {
				console.log('Email was changed');
				var emailVerificationP = document.getElementById('emailVerified');
				var emailVerificationSpan = createVerificationSpan(false);
				emailVerificationP.innerHTML = '';
				emailVerificationP.appendChild(emailVerificationSpan);
			}
			phoneNumber.setAttribute('id', 'phoneNumber');
			email.setAttribute('id', 'email');
			displayName.setAttribute('id', 'displayName');
			phoneNumber.setAttribute('class', 'text-muted mb-0');
			email.setAttribute('class', 'text-muted mb-0');
			displayName.setAttribute('class', 'text-muted mb-0');
			
			phoneNumber.textContent = newPhoneNumber.value;
			email.textContent = newEmail.value;
			displayName.textContent = newDisplayName.value;
	
			newPhoneNumber.parentNode.replaceChild(phoneNumber, newPhoneNumber);
			newEmail.parentNode.replaceChild(email, newEmail);
			newDisplayName.parentNode.replaceChild(displayName, newDisplayName);
	
			editProfileButton.textContent = 'Edit Profile';
			editProfileButton.removeEventListener('click', saveProfile);
			editProfileButton.addEventListener('click', editProfile);
			return response.json();
		} else {
			response.json().then(data => alert(data.error));
		}
	}).finally(function() {
		document.getElementById('loading').style.display = 'none';
	});
}

function loadProfilePage() {
	var profilePage = document.createElement('section');
	profilePage.setAttribute('style', 'background-color: #eee;');
	// spesify path to file with content instead of hardcoding html in next line

	fetch('/static/templates/profile.html')
		.then(response => response.text())
		.then(data => {
			profilePage.innerHTML = data;
			try {
				getAndSetProfileData();
			} catch (error) {
				console.log(error);
				return error;
			}
			var profileDiv = document.getElementById('content');
			profileDiv.innerHTML = '';

			profileDiv.appendChild(profilePage);
			var editProfileButton = document.getElementById('buttonEditProfile');
			editProfileButton.addEventListener('click', editProfile);

			var changePasswordButton = document.getElementById('buttonChangePassword');
			changePasswordButton.addEventListener('click', changePassword);
		})
		.catch(error => {
			console.error('Error:', error);
		});
}

function getAndSetProfileData() {
	fetchWithToken('/api/profile/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + localStorage.getItem('token'),
		}
	}).then(function(response) {
		if (response.ok) {
			return response.json();
		} else {
			throw new Error('Error: ' + response.error);
		}
	}
	).then(function(data) {
		var displayName = document.getElementById('displayName');
		var email = document.getElementById('email');
		var phoneNumber = document.getElementById('phoneNumber');

		var emailVerificationP = document.getElementById('emailVerified'); 
		var emailVerificationSpan = createVerificationSpan(data.emailVerified);
		
		displayName.textContent = data.displayName;
		email.textContent = data.email;
		phoneNumber.textContent = data.phoneNumber;

		emailVerificationP.appendChild(emailVerificationSpan);
	}).catch(function(error) {
		console.log(error);
	});
}

function changePassword() {
	var popup = createPopup();
	
	popup.innerHTML = `
		<div class="card mb-3" style="width: 300px;">
			<div class="card-header bg-primary text-white">
				Change Password
				<button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
			</div>
			<div class="card-body">
				<form id="change-password-form">
					<div class="form-group">
						<label for="id_old_password" class="form-label">Old Password</label>
						<input type="password" id="id_old_password" name="old_password" class="form-control" autocomplete="current-password" required>
					</div>
					<div class="form-group">
						<label for="id_new_password" class="form-label">New Password</label>
						<input type="password" id="id_new_password" name="new_password" class="form-control" autocomplete="new-password" required>
					</div>
					<div class="form-group">
						<label for="id_new_password_confirm" class="form-label">Confirm New Password</label>
						<input type="password" id="id_new_password_confirm" name="new_password_confirm" class="form-control" autocomplete="new-password" required>
					</div>
					<p class="fw-lighter
					" style="font-size:12px;" >TODO: Password policy will be implemented later</p>
					<button type="submit" class="btn btn-primary">Change Password</button>
				</form>
			</div>
		</div>
	`;
	document.body.appendChild(popup);

	var closeButton = popup.querySelector('#close-button');
	
	closeButton.addEventListener('click', function() {
		document.body.removeChild(popup);
	});

	var changePasswordForm = document.getElementById('change-password-form');
	var oldPassword = document.getElementById('id_old_password');
	var newPassword = document.getElementById('id_new_password');
	var newPasswordConfirm = document.getElementById('id_new_password_confirm');
	
	if (changePasswordForm) {
		changePasswordForm.addEventListener('submit', function(e) {
			e.preventDefault();
	
			fetchWithToken('/api/password/', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + localStorage.getItem('token'),
				},
				body: JSON.stringify({
					old_password: oldPassword.value,
					new_password: newPassword.value,
					new_password_confirm: newPasswordConfirm.value
				}),
			}).then(function(response) {
				if (response.ok) {
					return response.json();
				} else {
					var errorMessage = document.createElement('p');
	
					errorMessage.textContent = 'Password error (doesnt match etc).'; // TODO: Add error message
					errorMessage.style.color = 'red';
	
					changePasswordForm.removeChild(changePasswordForm.lastChild);
					changePasswordForm.appendChild(errorMessage);
					throw new Error('Error: ' + response.error);
				}
			}).then(function(data) {
				location.reload();
			}).catch(function(error) {
				console.log('Error:', error);
			});
		});
	}
}
