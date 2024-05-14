function createPopup() {
    var popup = document.createElement('div');
    popup.setAttribute('id', 'searchPopup');
    popup.style.zIndex = '1000';
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


function createUserSearchPopup() {
    var searchPopup = createPopup();
    searchPopup.innerHTML = `
        <div class="card" style="width: 300px">
            <div class="card-header bg-dark text-white">
                <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
            </div>
            <div class="card-body">
                <form id="search-form" class="input-group mb-3">
                    <input type="text" id="search-input" class="form-control" placeholder="Search for users" required>
                    <button type="submit" class="btn btn-dark">Search</button>
                </form>
            </div>
            <div class="people-list">
                <ul id="popupContent" class="list-unstyled chat-list mt-2 overflow-y-auto"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(searchPopup);
    var closeSearchPopupButton = searchPopup.querySelector('#close-button');
    closeSearchPopupButton.addEventListener('click', function() {
        var searchPopup = document.getElementById('searchPopup');
        searchPopup.remove();
    });
    var searchForm = document.getElementById('search-form');
    console.log(searchForm);
    searchForm.addEventListener('submit', function(event) {
        console.log("Before default")
        event.preventDefault();
        console.log(document.getElementById('search-input').value.length);
        if (document.getElementById('search-input').value.length < 1) {
            return;
        }
        console.log('searching for: ' + document.getElementById('search-input').value);
        var url = new URL('/api/friends-search/', window.location.origin);
        url.searchParams.append('pageSize', 20);
        url.searchParams.append('search_query', document.getElementById('search-input').value);
        fetchWithToken(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            },
        })
        .then(response => {
            if (response.status !== 200) {
                response.json().then(data => alertError(data.error));
            } else {
                response.json().then(data => {
                    searchPopupContent = document.getElementById('popupContent');
                    searchPopupContent.innerHTML = '';
                    height = 60;
                    if (data.length === 0) {
                        searchPopupContent.innerHTML = '<p style="text-align: center;">No users found</p>';
                    } else if (data.length < 5) {
                        height = data.length * 90;
                    } else {
                        height = 450;
                    }
                    searchPopupContent.setAttribute('style', `height: ${height}px;`);
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].username === localStorage.getItem('username')) {
                            continue;
                        }
                        var userItem = createSearchResultItem(data[i], searchPopup);
                        searchPopupContent.appendChild(userItem);
                    }
                });
            }
        })
        .catch(error => {
            console.error(error);
        });
    });
    console.log(searchPopup);
    return searchPopup;
}

function createForgotPasswordPopup() {
    var forgotPasswordPopup = createPopup();
    forgotPasswordPopup.innerHTML = `
        <div class="card mb-3" style="width: 300px;">
            <div class="card-header bg-dark text-white">
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
                    <button type="submit" class="btn btn-dark">Reset Password</button>
                </form>
                <div id="popupContent"></div>
            </div>
        </div>
    `;
    return forgotPasswordPopup;
}

function createUserDetailPopup(user) {
    var profilePopup = createPopup();
    profilePopup.setAttribute('id', 'profile-popup');
    profilePopup.innerHTML = `
        <div class="card" style="width: 330px;">
            <div class="card-header bg-dark text-white">
                <button id="close-button" style="float: right; border: none; background: none; color: white;">&times;</button>
            </div>
            <img src="${user.picture}" class="card-img-top" alt="Profile image">
            <div class="card-body">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Username:</span>
                        <span class="d-inline-block text-truncate" style="max-width: 150px;"
                        data-bs-toggle="tooltip" title="${user.username}">${user.username}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Email:</span>
                        <span class="d-inline-block text-truncate" style="max-width: 150px;"
                        data-bs-toggle="tooltip" title="${user.email}">${user.email}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Display Name:</span>
                        <span class="d-inline-block text-truncate" style="max-width: 150px;"
                        data-bs-toggle="tooltip" title="${user.displayName}">${user.displayName}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Games won:</span>
                        <span>${user.wins}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <span>Games played:</span>
                        <span>${user.games}</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
    return profilePopup;
}

function createVerificationSpan(is_verified) {
    var span = document.createElement('span');
    if (is_verified) {
        span.setAttribute('class', 'material-symbols-outlined');
        span.style.color = 'green';
        span.textContent = 'check_circle';
    } else {
        span.setAttribute('class', 'btn btn-outline-success d-flex justify-content-center align-items-center');
        span.textContent = 'Verify';
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
        localStorage.setItem('username', username);
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

function formatTimestamp(timestamp) {
    var date;
    if (isNaN(timestamp)) {
        date = moment(timestamp);
    } else {
        date = moment(timestamp * 1000);
    }
    return date.fromNow();
}