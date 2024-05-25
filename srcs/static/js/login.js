document.addEventListener("DOMContentLoaded", function () {
    function forgotPasswordClick(loginPopup) {
        var forgotPasswordPopup = createForgotPasswordPopup();
        document.body.removeChild(loginPopup);
        document.body.appendChild(forgotPasswordPopup);
        var closeButton = forgotPasswordPopup.querySelector("#close-button");
        closeButton.addEventListener("click", function () {
            document.body.removeChild(forgotPasswordPopup);
        });
        var forgotPasswordForm = document.getElementById("forgot-password-form");
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener("submit", function (e) {
                e.preventDefault();
                var email = document.getElementById("id_email").value;
                fetch("/reset-password/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email,
                    }),
                }).then(function (response) {
                    if (response.ok) {
                        alertSuccess("An email has been sent to you with instructions to reset your password.");
                        document.body.removeChild(forgotPasswordPopup);
                    } else {
                        popupAlertError("Invalid email. Please try again.");
                    }
                });
            });
        }
    }

    var loginLink = document.getElementById("loginRef");

    if (!loginLink) {
        return;
    }
    loginLink.addEventListener("click", function (e) {
        e.preventDefault();

        var loginPopup = createPopup();
        loginPopup.innerHTML = `
            <div class="card mb-3" style="width: 300px;">
                <div class="card-header bg-dark text-white">
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
                        <a id="forgot-password" style="cursor: pointer;" class="link-dark d-block text-right mt-1 mb-2">Forgot your password?</a>
                        <button type="submit" class="btn btn-dark">Log In</button>
                    </form>
                    <div id="popupContent"></div>
                </div>
            </div>
        `;
        document.body.appendChild(loginPopup);

        var twoStepVerificationPopup = createPopup();

        twoStepVerificationPopup.innerHTML = `
            <div class="card mb-3" style="width: 300px;">
                <div class="card-header bg-dark text-white">
                    Two Step Verification
                    <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
                </div>
                <div class="card-body">
                    <form id="two-step-verification-form">
                        <div class="form-group">
                            <label for="id_verification_code" class="form-label fs-6">Verification Code</label>
                            <input type="text" id="id_verification_code" name="verification_code" class="form-control" required>
                        </div>
                        <p class="fw-lighter" style="font-size:12px;" ></p>
                        <button type="submit" class="btn btn-dark">Verify</button>
                    </form>
                    <div id="popupContent"></div>
                </div>
            </div>
        `;

        var closeButton = loginPopup.querySelector("#close-button");
        closeButton.addEventListener("click", function () {
            document.body.removeChild(loginPopup);
        });

        var forgotPasswordLink = loginPopup.querySelector("#forgot-password");
        forgotPasswordLink.addEventListener("click", function () {
            forgotPasswordClick(loginPopup);
        });
        var loginForm = document.getElementById("login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", function (e) {
                e.preventDefault();
                var username = document.getElementById("id_username").value;
                var password = document.getElementById("id_password").value;
                fetch("/api/login/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                })
                    .then(function (response) {
                        if (response.status == 200) {
                            obtainToken(username, password);
                            return response.json();
                        } else if (response.status == 202) {
                            document.body.removeChild(loginPopup);
                            document.body.appendChild(twoStepVerificationPopup);
                            sendVerificationCodeEmail(username, password);
                            var twoStepVerificationForm = document.getElementById("two-step-verification-form");
                            closeButton = twoStepVerificationPopup.querySelector("#close-button");
                            closeButton.addEventListener("click", function () {
                                document.body.removeChild(twoStepVerificationPopup);
                            });
                            if (!twoStepVerificationForm) {
                                return;
                            }
                            twoStepVerificationForm.addEventListener("submit", function (e) {
                                e.preventDefault();
                                processTwoStepVerification(username, password);
                            });
                        } else {
                            popupAlertError("Incorrect username or password");
                        }
                    })
                    .finally(function () {
                        if (localStorage.getItem("access") != null) {
                            document.body.removeChild(loginPopup);
                        }
                    });
            });
        }
    });
});
