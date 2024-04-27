document.addEventListener('DOMContentLoaded', function() {
    // Login handling
	var loginLink = document.getElementById('loginRef');

    if (!loginLink) {
        return;
    }
    loginLink.addEventListener('click', function(e) {
        e.preventDefault();

        var popup = createPopup();
		popup.innerHTML = `
            <div class="card mb-3" style="width: 300px;">
                <div class="card-header bg-primary text-white">
                        Login
                        <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
                </div>
                <div class="card-body">
                    <form id="login-form">
                        <div class="form-group">
                            <label for="id_username" class="form-label fs-6">Username</label>
                            <input type="text" id="id_username" name="username" class="form-control" autocomplete="username" required>
                        </div>
                        <div class="form-group">
                            <label for="id_password" class="form-label fs-6">Password</label>
                            <input type="password" id="id_password" name="password" class="form-control" autocomplete="current-password" required>
                        </div>
                        <p class="fw-lighter" style="font-size:12px;" ></p>
                        <button type="submit" class="btn btn-primary">Log In</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        var closeButton = popup.querySelector('#close-button');
        closeButton.addEventListener('click', function() {
            document.body.removeChild(popup);
        });

        var loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var username = document.getElementById('id_username').value;
                var password = document.getElementById('id_password').value;
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
						loginForm.removeChild(loginForm.lastChild);
                        loginForm.appendChild(errorMessage);
                        throw new Error('Error: ' + response.statusText);
                    }
                }).then(function(data) {
                    // Store the JWT in localStorage
                    localStorage.setItem('access', data.access);
					localStorage.setItem('refresh', data.refresh);
                    // Reload the page
                    location.reload();
                }).catch(function(error) {
                    console.log('Error:', error);
                }).finally(function() {
                    if (localStorage.getItem('access') != null) {
                        document.body.removeChild(popup);
                    }
                });
            });
        }
    });
});