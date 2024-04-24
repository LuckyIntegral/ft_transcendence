document.addEventListener('DOMContentLoaded', function() {
	var profileDiv = document.getElementById('profile');
	
	if (profileDiv === null) {
		console.log('profileDiv is null');
		return;
	}
    // profileDiv.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     localStorage.removeItem('token');
    //     location.reload();
    // });

	var editProfileButton = document.getElementById('buttonEditProfile');

	var displayName; 
	var email;
	var mobile;
	var newDisplayName;
	var newEmail;
	var newMobile;
	function editProfile() {
		displayName = document.getElementById('displayName');
		email = document.getElementById('email');
		mobile = document.getElementById('mobile');
		newDisplayName = document.createElement('input');
		newEmail = document.createElement('input');
		newMobile = document.createElement('input');
		newDisplayName.setAttribute('type', 'text');
		newDisplayName.setAttribute('id', 'displayName');
		newDisplayName.setAttribute('value', displayName.textContent);
		newDisplayName.setAttribute('placeholder', 'Beatiful Name');
		newEmail.setAttribute('type', 'text');
		newEmail.setAttribute('id', 'email');
		newEmail.setAttribute('value', email.textContent);
		newEmail.setAttribute('placeholder', 'prossi@exam02.ez.pass');
		newMobile.setAttribute('type', 'text');
		newMobile.setAttribute('id', 'mobile');
		newMobile.setAttribute('value', mobile.textContent);
		newMobile.setAttribute('placeholder', '+380 12 345 6789');
		displayName.parentNode.replaceChild(newDisplayName, displayName);
		email.parentNode.replaceChild(newEmail, email);
		mobile.parentNode.replaceChild(newMobile, mobile);
		editProfileButton.textContent = 'Save';
		editProfileButton.removeEventListener('click', editProfile);
		editProfileButton.addEventListener('click', saveProfile);
	}

	function saveProfile() {
		fetch ('/api/profile/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + localStorage.getItem('token'),
			},
			body: JSON.stringify({
				displayName: displayName.getAttribute('value'),
				email: email.getAttribute('value'),
				mobile: mobile.getAttribute('value'),
			})
		}).then(function(response) {
			if (response.ok) {
				newMobile.parentNode.replaceChild(mobile, newMobile);
				newEmail.parentNode.replaceChild(email, newEmail);
				newDisplayName.parentNode.replaceChild(displayName, newDisplayName);
				editProfileButton.textContent = 'Edit Profile';
				return response.json();
			} else {
				alert('Error: ' + response.error);
				throw new Error('Error: ' + response.error);
			}
		}).catch(function(error) {
			console.log(error);
		});
	}
	editProfileButton.addEventListener('click', editProfile);
});