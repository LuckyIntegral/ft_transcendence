document.addEventListener('DOMContentLoaded', function() {
    // Signup handling
    var signupLink = document.getElementById('signUpRef');

    if (!signupLink) {
        return;
    }
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();

        var popup = createPopup();
        popup.innerHTML = `
            <div class="card" style="width: 300px;">
                <div class="card-header bg-primary text-white">
                    Signup
                    <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
                </div>
                <div class="card-body">
                    <form id="signup-form">
                        <div class="form-group">
                            <label for="id_username" class="form-label">Username</label>
                            <input type="text" id="id_username" name="username" class="form-control" autocomplete="username" required>
                        </div>
                        <div class="form-group">
                            <label for="id_email" class="form-label">Email</label>
                            <input type="email" id="id_email" name="email" class="form-control" autocomplete="email" required>
                        </div>
                        <div class="form-group">
                            <label for="id_password" class="form-label">Password</label>
                            <input type="password" id="id_password" name="password" class="form-control" autocomplete="new-password" required>
                        </div>
                        <div class="form-group">
                            <label for="id_password_confirm" class="form-label">Confirm Password</label>
                            <input type="password" id="id_password_confirm" name="password_confirm" class="form-control" autocomplete="new-password" required>
                        </div>
                        <p class="fw-lighter" style="font-size:12px;" >TODO: Password policy will be implemented later</p>
                        <button type="submit" class="btn btn-primary">Sign Up</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        var closeButton = popup.querySelector('#close-button');
        closeButton.addEventListener('click', function() {
            document.body.removeChild(popup);
        });

        var signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var username = document.getElementById('id_username').value;
                var email = document.getElementById('id_email').value;
                var password = document.getElementById('id_password').value;
                var passwordConfirm = document.getElementById('id_password_confirm').value;
                fetch('/api/signup/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                        password_confirm: passwordConfirm
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                    } else {
                        alert('Successfully signed up!');
                        document.body.removeChild(popup);
                        return obtainToken(username, password)
                    }
                }).then(() => {
                    sendVerificationEmail();
                });
            });
        }
    });
});
