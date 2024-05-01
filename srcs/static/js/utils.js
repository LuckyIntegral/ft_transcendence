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

function createForgotPasswordPopup() {
    var forgotPasswordPopup = createPopup();
    forgotPasswordPopup.style.display = 'flex';
    forgotPasswordPopup.style.justifyContent = 'center';
    forgotPasswordPopup.style.alignItems = 'center';
    forgotPasswordPopup.style.position = 'fixed';
    forgotPasswordPopup.style.top = '0';
    forgotPasswordPopup.style.bottom = '0';
    forgotPasswordPopup.style.left = '0';
    forgotPasswordPopup.style.right = '0';
    forgotPasswordPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    forgotPasswordPopup.innerHTML = `
        <div class="card mb-3" style="width: 300px;">
            <div class="card-header bg-primary text-white">
                Forgot Password
                <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
            </div>
            <div class="card-body">
                <form id="forgot-password-form">
                    <div class="form-group">
                        <label for="id_email" class="form-label fs-6">Email</label>
                        <input type="email" id="id_email" name="email" class="form-control" required>
                    </div>
                    <p class="fw-lighter" style="font-size:12px;" ></p>
                    <button type="submit" class="btn btn-primary">Reset Password</button>
                </form>
                <div id="popupContent"></div>
            </div>
        </div>
    `;
    return forgotPasswordPopup;
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
        span.title = 'Click to send verification email';
        span.style.cursor = 'pointer';
        span.addEventListener('click', function() {
            sendVerificationEmail();
            alertSuccess('Verification email sent');
        });
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
        document.getElementById("searchRef").style.display = "none";
        document.getElementById("searchForLater").style.display = "none";
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
                    document.getElementById("searchRef").style.display = "none";
                    document.getElementById("searchForLater").style.display = "none";
                    localStorage.removeItem('access');
                }
            });
        } else {
            document.getElementById("content").innerHTML = "<h1>Invalid token</h1>";
            document.getElementById("profileRef").style.display = "none";
            document.getElementById("friendsRef").style.display = "none";
            document.getElementById("messagesRef").style.display = "none";
            document.getElementById("logOutRef").style.display = "none";
            document.getElementById("searchRef").style.display = "none";
            document.getElementById("searchForLater").style.display = "none";
        }
    }
    return false;
}

function sendVerificationCodeEmail(username = null, password = null) {
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
            alertError(error);
        });
    } else {
        validateToken();
        if (localStorage.getItem('access') === null) {
            alertError('Session expired. Please log in again.')
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
            alertError(error);
        });
    }

}

async function obtainToken(username, password) {
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
            throw new Error('Error: ' + response.statusText);
        }
    }).then(function(data) {
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        location.reload();
    }).catch(function(error) {
        alertError(error);
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
            alertError('Incorrect verification code');
        }
    });
}

function sendVerificationEmail() {
    fetchWithToken('/api/send-verification-email/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('access'),
        },
    }).then(function(response) {
        if (!response.ok) {
            throw new Error('Error: ' + response.statusText);
        }
    }).catch(function(error) {
        //console.log("")
    });
}

function handlePhotoUpload() {
    var fileInput = document.getElementById('photoUpload');
    var profileImg = document.getElementById('profileImg');
    var file = fileInput.files[0];
    var reader = new FileReader();

    reader.onloadend = function() {
        // Create a FormData object
        var formData = new FormData();
        // Add the file to the FormData object
        formData.append('picture', file);

        // Send a POST request to the server with the file data
        fetchWithToken('/api/upload-picture/', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
            body: formData
        }).then(function(response) {
            if (response.ok) {
                alertSuccess("Profile picture updated successfully!");
                profileImg.src = reader.result;
            } else {
                alertError("Failed to update profile picture");
            }
        });
    }

    if (file) {
        reader.readAsDataURL(file);
    }
}
