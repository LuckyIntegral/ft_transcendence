document.addEventListener('DOMContentLoaded', function() {
	var profileDiv = document.getElementById('content');

	if (profileDiv === null) {
		console.log('profileDiv is null');
		return;
	}

	var editProfileButton;
	var displayName; 
	var email;
	var phoneNumber;
	var newDisplayName;
	var newEmail;
	var newPhoneNumber;
	var changePasswordButton;

	function editProfile() {
		displayName = document.getElementById('displayName');
		email = document.getElementById('email');
		phoneNumber = document.getElementById('phoneNumber');
		newDisplayName = document.createElement('input');
		newEmail = document.createElement('input');
		newPhoneNumber = document.createElement('input');
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
				email.textContent = newEmail.value;
				phoneNumber.textContent = newPhoneNumber.value;
				displayName.textContent = newDisplayName.value;
				newPhoneNumber.parentNode.replaceChild(phoneNumber, newPhoneNumber);
				newEmail.parentNode.replaceChild(email, newEmail);
				newDisplayName.parentNode.replaceChild(displayName, newDisplayName);
				editProfileButton.textContent = 'Edit Profile';
				editProfileButton.removeEventListener('click', saveProfile);
				editProfileButton.addEventListener('click', editProfile);
				return response.json();
			} else {
				alert('Error: ' + response.error);
				throw new Error('Error: ' + response.error);
			}
		}).catch(function(error) {
			console.log(error);
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
					var profileData = getProfileData();
				} catch (error) {
					console.log(error);
					return error;
				}
				var profileDiv = document.getElementById('content');
				profileDiv.innerHTML = '';

				profileDiv.appendChild(profilePage);
				editProfileButton = document.getElementById('buttonEditProfile');
				editProfileButton.addEventListener('click', editProfile);

				changePasswordButton = document.getElementById('buttonChangePassword');
				changePasswordButton.addEventListener('click', changePassword);
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}

	function getProfileData() {
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
			displayName = document.getElementById('displayName');
			email = document.getElementById('email');
			phoneNumber = document.getElementById('phoneNumber');
			displayName.textContent = data.displayName;
			email.textContent = data.email;
			phoneNumber.textContent = data.phoneNumber;
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
                        throw new Error('Error: ' + response.statusText);
                    }
                }).then(function(data) {
                    // Reload the page
	                // document.body.removeChild(popup);
                    location.reload();
                }).catch(function(error) {
                    console.log('Error:', error);
                });
			});
		}
	}


	var profileButton = document.getElementById('profileRef');
	profileButton.addEventListener('click', loadProfilePage);

});
