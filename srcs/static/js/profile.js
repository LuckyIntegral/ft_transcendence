function editProfile() {
    var displayName = document.getElementById("displayName");
    var email = document.getElementById("email");
    var editProfileButton = document.getElementById("buttonEditProfile");
    var newDisplayName = document.createElement("input");
    var newEmail = document.createElement("input");
    var undoButton = document.getElementById("buttonChangePassword");

    newDisplayName.setAttribute("type", "text");
    newDisplayName.setAttribute("id", "displayName");
    newDisplayName.setAttribute("value", displayName.textContent);
    newDisplayName.setAttribute("placeholder", "Beatiful Name");

    newEmail.setAttribute("type", "text");
    newEmail.setAttribute("id", "email");
    newEmail.setAttribute("value", email.textContent);
    newEmail.setAttribute("placeholder", "prossi@exam02.ez.pass");

    undoButton.textContent = "Undo";

    localStorage.setItem("displayName", displayName.textContent);
    localStorage.setItem("email", email.textContent);

    displayName.parentNode.replaceChild(newDisplayName, displayName);
    email.parentNode.replaceChild(newEmail, email);

    editProfileButton.textContent = "Save";
    editProfileButton.removeEventListener("click", editProfile);
    editProfileButton.addEventListener("click", saveProfile);
    undoButton.removeEventListener("click", changePassword);
    undoButton.addEventListener("click", undoChanges);
}

function undoChanges() {
    var displayNameInput = document.getElementById("displayName");
    var emailInput = document.getElementById("email");
    var editProfileButton = document.getElementById("buttonEditProfile");
    var undoButton = document.getElementById("buttonChangePassword");

    var displayName = document.createElement("p");
    var email = document.createElement("p");

    email.setAttribute("id", "email");
    displayName.setAttribute("id", "displayName");

    email.setAttribute("class", "text-muted mb-0");
    displayName.setAttribute("class", "text-muted mb-0");

    email.textContent = localStorage.getItem("email");
    displayName.textContent = localStorage.getItem("displayName");

    emailInput.parentNode.replaceChild(email, emailInput);
    displayNameInput.parentNode.replaceChild(displayName, displayNameInput);

    editProfileButton.textContent = "Edit Profile";
    editProfileButton.removeEventListener("click", saveProfile);
    editProfileButton.addEventListener("click", editProfile);

    undoButton.textContent = "Change Password";
    undoButton.removeEventListener("click", undoChanges);
    undoButton.addEventListener("click", changePassword);
}

function saveProfile() {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    document.getElementById("loading").style.display = "block";
    var newDisplayName = document.getElementById("displayName");
    var newEmail = document.getElementById("email");
    var editProfileButton = document.getElementById("buttonEditProfile");
    var undoButton = document.getElementById("buttonChangePassword");
    var email = document.createElement("p");
    var displayName = document.createElement("p");

    fetchWithToken("/api/profile/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            displayName: newDisplayName.value,
            email: newEmail.value,
        }),
    })
        .then(function (response) {
            if (response.ok) {
                if (localStorage.getItem("email") !== newEmail.value) {
                    var emailVerificationP = document.getElementById("emailVerified");
                    var emailVerificationSpan = createVerificationSpan(false);
                    emailVerificationP.innerHTML = "";
                    emailVerificationP.appendChild(emailVerificationSpan);
                }
                email.setAttribute("id", "email");
                displayName.setAttribute("id", "displayName");
                email.setAttribute("class", "text-muted mb-0");
                displayName.setAttribute("class", "text-muted mb-0");

                email.textContent = newEmail.value;
                displayName.textContent = newDisplayName.value;

                newEmail.parentNode.replaceChild(email, newEmail);
                newDisplayName.parentNode.replaceChild(displayName, newDisplayName);

                editProfileButton.textContent = "Edit Profile";
                editProfileButton.removeEventListener("click", saveProfile);
                editProfileButton.addEventListener("click", editProfile);

                undoButton.textContent = "Change Password";
                undoButton.removeEventListener("click", undoChanges);
                undoButton.addEventListener("click", changePassword);
                location.reload();
                return response.json();
            } else if (response.status === 400) {
                alertError("Invalid email address");
            } else if (response.status === 401) {
                alertError("Email is already taken");
            } else if (response.status === 405) {
                alertError('Display name is too long')
            }
        })
        .finally(function () {
            document.getElementById("loading").style.display = "none";
        });
}

function loadProfilePage() {
    var profilePage = document.createElement("section");
    profilePage.setAttribute("style", "background-color: #eee;");
    // spesify path to file with content instead of hardcoding html in next line

    fetch("/static/templates/profile.html")
        .then((response) => response.text())
        .then((data) => {
            profilePage.innerHTML = data;
            try {
                getAndSetProfileData();
            } catch (error) {
                alertError(error);
                return error;
            }
            var profileDiv = document.getElementById("content");
            profileDiv.innerHTML = "";

            profileDiv.appendChild(profilePage);
            var editProfileButton = document.getElementById("buttonEditProfile");
            editProfileButton.addEventListener("click", editProfile);

            var changePasswordButton = document.getElementById("buttonChangePassword");
            changePasswordButton.addEventListener("click", changePassword);

            var twoStepVerificationButton = document.getElementById("buttonTwoStepVerification");
            twoStepVerificationButton.addEventListener("click", editTwoStepVerification);
        });
}

function getAndSetProfileData() {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    fetchWithToken("/api/profile/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    })
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Error: " + response.error);
            }
        })
        .then(function (data) {
            var displayName = document.getElementById("displayName");
            var email = document.getElementById("email");
            var username = document.getElementById("username");
            var picture = document.getElementById("profileImg");

            var emailVerificationP = document.getElementById("emailVerified");
            var emailVerificationSpan = createVerificationSpan(data.emailVerified);

            displayName.textContent = data.displayName;
            email.textContent = data.email;
            username.textContent = data.username;
            picture.src = data.picture;

            setTwoStepVerificationButton(data.twoStepVerificationEnabled);
            emailVerificationP.appendChild(emailVerificationSpan);
        })
        .catch(function (error) {
            alertError(error);
        });
}

function changePassword() {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    var popup = createPopup();

    popup.innerHTML = `
        <div class="card mb-3" style="width: 300px;">
            <div class="card-header bg-dark text-white">
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
                    <button type="submit" class="btn btn-dark">Change Password</button>
                </form>
                <div id="popupContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    var closeButton = popup.querySelector("#close-button");

    closeButton.addEventListener("click", function () {
        document.body.removeChild(popup);
    });

    var changePasswordForm = document.getElementById("change-password-form");
    var oldPassword = document.getElementById("id_old_password");
    var newPassword = document.getElementById("id_new_password");
    var newPasswordConfirm = document.getElementById("id_new_password_confirm");

    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", function (e) {
            e.preventDefault();

            fetchWithToken("/api/password/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("access"),
                },
                body: JSON.stringify({
                    old_password: oldPassword.value,
                    new_password: newPassword.value,
                    new_password_confirm: newPasswordConfirm.value,
                }),
            }).then(function (response) {
                if (response.ok) {
                    alertSuccess("Password was changed");
                    document.body.removeChild(popup);
                    return response.json();
                } else if (response.status === 400) {
                    popupAlertError("Old password is incorrect");
                } else if (response.status === 401) {
                    popupAlertError("Passwords do not match");
                } else if (response.status === 402) {
                    popupAlertError(
                        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
                    );
                } else if (response.status === 405) {
                    popupAlertError('Password is too long');
                }
            });
        });
    }
}

function getTwoStepVerificationStatus() {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    return fetchWithToken("/api/two-step-verification/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    })
        .then((response) => {
            return response.status;
        })
        .catch(function (error) {
            alertError(error);
        });
}

function enableTwoStepVerification(popup) {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    var verificationCode = document.getElementById("id_verification_code");
    fetchWithToken("/api/two-step-verification/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            code: verificationCode.value,
            action: "enable",
        }),
    }).then(function (response) {
        if (response.ok) {
            alertSuccess("Two-step verification enabled");
            setTwoStepVerificationButton(true);
            popup.parentNode.removeChild(popup);
            location.reload();
        } else {
            alertError("Email is not verified");
        }
    });
}

function disableTwoStepVerification(popup) {
    validateToken();
    if (localStorage.getItem("access") === null) {
        alertError("You are not logged in");
        window.location.hash = "default";
        return;
    }
    var verificationCode = document.getElementById("id_verification_code");
    fetchWithToken("/api/two-step-verification/", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
            code: verificationCode.value,
            action: "disable",
        }),
    })
        .then(function (response) {
            if (response.ok) {
                alertSuccess("Two-step verification disabled");
                setTwoStepVerificationButton(false);
                popup.parentNode.removeChild(popup);
                location.reload();
            } else {
                alertError(response.statusText);
            }
        })
        .catch(function (error) {
            alertError(error);
        });
}

function editTwoStepVerification() {
    var popup = createPopup();
    getTwoStepVerificationStatus().then((status) => {
        var twoStepStatus = status;
        // if verification is disabled open popup to enable i
        if (twoStepStatus === 202) {
            popup.innerHTML = `
                <div class="card mb-3" style="width: 300px;">
                    <div class="card-header bg-dark text-white">
                        Enable Two-Step Verification
                        <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
                    </div>
                    <div class="card-body">
                        <form id="two-step-verification-form">
                            <div class="form-group
                            ">
                                <label for="id_verification_code" class="form-label
                                ">Verification Code</label>
                                <input type="text" id="id_verification_code" name="verification_code" class="form-control" required>
                            </div>
                            <p class="fw-lighter" style="font-size:12px;" >TODO: add explanation</p>
                            <button type="submit" class="btn btn-primary">Verify</button>
                        </form>
                    <div id="popupContent"></div>
                    </div>
                </div>
            `;
        } else if (twoStepStatus === 200) {
            popup.innerHTML = `
                <div class="card mb-3" style="width: 300px;">
                    <div class="card-header bg-dark text-white">
                        Disable Two-Step Verification
                        <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
                    </div>
                    <div class="card-body">
                        <form id="two-step-verification-form">
                            <div class="form-group
                            ">
                                <label for="id_verification_code" class="form-label
                                ">Verification Code</label>
                                <input type="text" id="id_verification_code" name="verification_code" class="form-control" required>
                            </div>
                            <p class="fw-lighter" style="font-size:12px;" >TODO: add explanation</p>
                            <button type="submit" class="btn btn-primary">Verify</button>
                        </form>
                    </div>
                </div>
            `;
        } else {
            alertError("Email is not verified");
            return;
        }
        document.body.appendChild(popup);
        sendVerificationCodeEmail();
        var closeButton = popup.querySelector("#close-button");
        closeButton.addEventListener("click", function () {
            document.body.removeChild(popup);
        });

        var twoStepVerificationForm = document.getElementById("two-step-verification-form");
        if (twoStepVerificationForm) {
            twoStepVerificationForm.addEventListener("submit", function (e) {
                e.preventDefault();
                if (twoStepStatus === 202) {
                    enableTwoStepVerification(popup);
                } else if (twoStepStatus === 200) {
                    disableTwoStepVerification(popup);
                }
            });
        }
    });
}

function setTwoStepVerificationButton(isEnabled) {
    var twoStepVerifictionButton = document.getElementById("buttonTwoStepVerification");
    if (isEnabled) {
        twoStepVerifictionButton.textContent = "Disable Two Step Verification";
        twoStepVerifictionButton.class = "btn btn-outline-danger ms-1";
    } else {
        twoStepVerifictionButton.textContent = "Enable Two Step Verification";
        twoStepVerifictionButton.class = "btn btn-outline-primary ms-1";
    }
}
