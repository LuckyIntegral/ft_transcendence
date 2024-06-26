FRIEND_REQUESTS_LIST_PAGE_SIZE = 8;
FRIEND_LIST_PAGE_SIZE = 6;

function loadFriendsPage() {
    var friendsPage = document.createElement("section");
    friendsPage.setAttribute("id", "friends-page");
    friendsPage.setAttribute("class", "container col-12");
    friendsPage.innerHTML = `
    <div class="row">
        <div class="input-group p-3 rounded border border-secondary">
            <legend class=" p-2">Add friends</legend>
            <input type="text" class="form-control rounded-end" id="friendRequestInput" placeholder="Add friend..." data-bs-toggle="dropdown" aria-expanded="true">
            <ul class="dropdown-menu" aria-labelledby="friendRequestInput" id="friendRequestResultsDropdown" style></ul>
        </div>
    </div>
    <div class="row">
        <div class="col input-group p-3 rounded border border-secondary justify-content-center">
            <div>
                <legend class="p-2">Friends</legend>
                <div id="friends-list" class="container col-12 mb-5"></div>
            </div>
            <div class="friends-list-table-pagination position-absolute bottom-0 start-50 translate-middle-x"></div>
        </div>
        <div class="col input-group p-3 rounded border border-secondary justify-content-center">
            <div>
                <legend class="p-2">Friend requests</legend>
                <div id="friends-requests" class="container col-12 mb-5"></div>
            </div>
            <div class="friends-requests-table-pagination position-absolute bottom-0 start-50 translate-middle-x"></div>
        </div>
    </div>
    `;
    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(friendsPage);
    document.getElementById("friendRequestInput").addEventListener("input", searchFriendQuery);
    loadFriendsList();
    loadFriendsRequestsList();
}

function loadFriendsRequestsList(page = 0) {
    var friendsRequestsList = document.getElementById("friends-requests");
    friendsRequestsList.innerHTML = "";
    var url = new URL(`https://${window.location.host}/api/friends-requests/`);
    url.searchParams.append("page", page);
    url.searchParams.append("pageSize", FRIEND_REQUESTS_LIST_PAGE_SIZE);
    fetchWithToken(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.data.length === 0) {
                var noFriendsRequests = document.createElement("table");
                noFriendsRequests.setAttribute("class", "table table-striped table-hover table-bordered");
                noFriendsRequests.innerHTML = `
            <thead>
                <th scope="col">
                    You have no friend requests yet
                </th>
            </thead>
            `;
                friendsRequestsList.appendChild(noFriendsRequests);
            } else {
                loadFriendsRequestsListPagination(page, data.totalPages);
                var friendRequestTable = document.createElement("table");
                friendRequestTable.setAttribute("class", "table table-striped table-hover table-bordered");

                var friendRequestTableHeader = document.createElement("thead");
                friendRequestTableHeader.innerHTML = `
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Email</th>
                    <th scope="col">Username</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            `;

                var friendRequestTableBody = document.createElement("tbody");
                let i = 1;
                data.data.forEach(function (friendRequest) {
                    var friendRequestDiv = document.createElement("tr");
                    friendRequestDiv.innerHTML = `
                <th scope="row">${i + page * FRIEND_REQUESTS_LIST_PAGE_SIZE}</th>
                <td><span class="d-inline-block text-truncate" style="max-width: 150px;"
                data-bs-toggle="tooltip" title="${friendRequest.email}">${friendRequest.email}</span></td>
                <td><span class="d-inline-block text-truncate" style="max-width: 150px;"
                data-bs-toggle="tooltip" title="${friendRequest.username}">${friendRequest.username}</span></td>
                <td>
                    <button type="button" id="accept-friend-request" class="btn btn-outline-secondary"
                        data-friend-request-id="${friendRequest.username}">
                        <span class="material-symbols-outlined">priority</span>
                    </button>
                    <button type="button" id="delete-friend-request" class="btn btn-outline-secondary"
                        data-friend-request-id="${friendRequest.username}">
                        <span class="material-symbols-outlined">disabled_by_default</span>
                    </button>
                </td>
                `;
                    friendRequestTableBody.appendChild(friendRequestDiv);
                    i += 1;
                });
                friendRequestTableBody.querySelectorAll("#accept-friend-request").forEach((button) => {
                    button.addEventListener("click", acceptFriendRequest);
                });
                friendRequestTableBody.querySelectorAll("#delete-friend-request").forEach((button) => {
                    button.addEventListener("click", deleteFriendRequest);
                });
                friendRequestTable.appendChild(friendRequestTableHeader);
                friendRequestTable.appendChild(friendRequestTableBody);
                friendsRequestsList.appendChild(friendRequestTable);
            }
        })
        .catch((error) => alertError(error));
}

function loadFriendsRequestsListPagination(page, totalPages) {
    var pagination = document.querySelector(".friends-requests-table-pagination");
    pagination.innerHTML = `
    <ul class="pagination">
        <li class="page-item">
            <button class="page-link" id="friends-requests-left-btn" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>
        <li class="page-item"><a class="page-link" id="friends-requests-current-page"></a></li>
        <li class="page-item">
            <button class="page-link" id="friends-requests-right-btn" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>
    </ul>
    `;

    var leftButton = document.getElementById("friends-requests-left-btn");
    if (page <= 0) {
        leftButton.setAttribute("disabled", true);
    } else {
        leftButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadFriendsRequestsList(page - 1);
        });
    }

    var rightButton = document.getElementById("friends-requests-right-btn");
    if (page + 1 >= totalPages) {
        rightButton.setAttribute("disabled", true);
    } else {
        rightButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadFriendsRequestsList(page + 1);
        });
    }

    var currentPage = document.getElementById("friends-requests-current-page");
    currentPage.textContent = page + 1;
}

function acceptFriendRequest() {
    actionFriendRequest.call(this, "accept");
}

function deleteFriendRequest() {
    actionFriendRequest.call(this, "delete");
}

function actionFriendRequest(action = "accept") {
    var friendUsername = this.getAttribute("data-friend-request-id");
    fetchWithToken(`https://${window.location.host}/api/friends-requests/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
        body: JSON.stringify({
            friend_username: friendUsername,
            action: action,
        }),
    })
        .then((response) => {
            if (response.status !== 200) {
                response.json().then((data) => alertError(data.error));
            } else {
                window.location.reload();
            }
        })
        .catch((error) => alertError(error));
}

function loadFriendsList(page = 0) {
    var friendsList = document.getElementById("friends-list");
    friendsList.innerHTML = "";
    var url = new URL(`https://${window.location.host}/api/friends/`);
    url.searchParams.append("page", page);
    url.searchParams.append("pageSize", FRIEND_LIST_PAGE_SIZE);
    fetchWithToken(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.data.length === 0) {
                var noFriends = document.createElement("table");
                noFriends.setAttribute("class", "table table-striped table-hover table-bordered");
                noFriends.innerHTML = `
                <thead>
                    <th scope="col">
                        You have no friends yet
                    </th>
                </thead>
                `;
                friendsList.appendChild(noFriends);
            } else {
                loadFriendsListPagination(page, data.totalPages);
                var friendTable = document.createElement("table");
                friendTable.setAttribute("class", "table table-striped table-hover table-bordered");

                var friendTableHeader = document.createElement("thead");
                friendTableHeader.innerHTML = `
                <thead>
                <tr>
                <th scope="col">#</th>
                <th scope="col">Photo</th>
                <th scope="col">Email</th>
                <th scope="col">Username</th>
                <th scope="col">Actions</th>
                </tr>
                </thead>
                `;

                var friendTableBody = document.createElement("tbody");
                let i = 1;
                data.data.forEach(function (friend) {
                    var friendDiv = document.createElement("tr");
                    friendDiv.innerHTML = `
                    <th scope="row">${i + page * FRIEND_LIST_PAGE_SIZE}</th>
                    <td><img src="${
                        friend.pictureSmall
                    }" alt="Profile photo" class="rounded-circle" width="50" height="50"></td>
                    <td><span class="d-inline-block text-truncate" style="max-width: 150px;"
                        data-bs-toggle="tooltip" title="${friend.email}">${friend.email}</span></td>
                    <td><span class="d-inline-block text-truncate" style="max-width: 150px;"
                        data-bs-toggle="tooltip" title="${friend.username}">${friend.username}</span></td>
                    <td>
                        <button type="button" id="info-button" class="btn btn-outline-secondary" data-friend-id="${
                            friend.username
                        }">
                            <span class="material-symbols-outlined">info</span>
                        </button>
                        <button type="button" id="delete-button" class="btn btn-outline-secondary" data-friend-id="${
                            friend.username
                        }">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </td>
                    `;
                    friendTableBody.appendChild(friendDiv);
                    i += 1;
                });
                friendTableBody.querySelectorAll("#delete-button").forEach((button) => {
                    button.addEventListener("click", deleteFriend);
                });
                friendTableBody.querySelectorAll("#info-button").forEach((button) => {
                    button.addEventListener("click", function () {
                        showInfoFriend(this.getAttribute("data-friend-id"));
                    });
                });
                friendTable.appendChild(friendTableHeader);
                friendTable.appendChild(friendTableBody);
                friendsList.appendChild(friendTable);
            }
        })
        .catch((error) => alertError(error));
}

function loadFriendsListPagination(page, totalPages) {
    var pagination = document.querySelector(".friends-list-table-pagination");
    pagination.innerHTML = `
    <ul class="pagination">
        <li class="page-item">
            <button class="page-link" id="friends-list-left-btn" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>
        <li class="page-item"><a class="page-link" id="friends-list-current-page"></a></li>
        <li class="page-item">
            <button class="page-link" id="friends-list-right-btn" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>
    </ul>
    `;

    var leftButton = document.getElementById("friends-list-left-btn");
    if (page <= 0) {
        leftButton.setAttribute("disabled", true);
    } else {
        leftButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadFriendsList(page - 1);
        });
    }

    var rightButton = document.getElementById("friends-list-right-btn");
    if (page + 1 >= totalPages) {
        rightButton.setAttribute("disabled", true);
    } else {
        rightButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadFriendsList(page + 1);
        });
    }

    var currentPage = document.getElementById("friends-list-current-page");
    currentPage.textContent = page + 1;
}

function showInfoFriend(username) {
    var url = new URL(`https://${window.location.host}/api/user-details/`);
    url.searchParams.append("username", username);
    fetchWithToken(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
    })
        .then((response) => response.json())
        .then((data) => {
            var user = data;
            var profilePopup = createUserDetailPopup(user);
            document.body.appendChild(profilePopup);
            var closeButton = profilePopup.querySelector("#close-button");
            closeButton.addEventListener("click", function () {
                document.body.removeChild(profilePopup);
                displayFriendActionButtons();
            });
            hideFriendActionButtons();
        })
        .catch((error) => {
            alertError(error);
        });
}

function displayFriendActionButtons() {
    var profilePopupButtons = document.querySelectorAll("#info-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = false;
        button.style.display = "initial";
    });
    var profilePopupButtons = document.querySelectorAll("#delete-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = false;
        button.style.display = "initial";
    });
}

function hideFriendActionButtons() {
    var profilePopupButtons = document.querySelectorAll("#info-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = true;
        button.style.display = "none";
    });
    var profilePopupButtons = document.querySelectorAll("#delete-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = true;
        button.style.display = "none";
    });
}

function deleteFriend() {
    var friendUsername = this.getAttribute("data-friend-id");
    fetchWithToken(`https://${window.location.host}/api/friends/`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
        body: JSON.stringify({
            friend_username: friendUsername,
        }),
    })
        .then((response) => {
            if (response.status !== 200) {
                response.json().then((data) => alertError(data.error));
            } else {
                window.location.reload();
            }
        })
        .catch((error) => alertError(error));
}

function searchFriendQuery() {
    var searchInput = document.getElementById("friendRequestInput");
    if (searchInput.value !== "") {
        var url = new URL(`https://${window.location.host}/api/friends-search/`);
        url.searchParams.append("search_query", searchInput.value);
        fetchWithToken(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("access"),
            },
        })
            .then((response) => {
                if (response.status !== 200) {
                    response.json().then((data) => alertError(data.error));
                } else {
                    response.json().then((data) => {
                        var dropdownMenu = document.getElementById("friendRequestResultsDropdown");
                        dropdownMenu.innerHTML = "";
                        for (var i = 0; i < data.length; i++) {
                            var searchResults = document.createElement("li");
                            searchResults.setAttribute("class", "");
                            searchResults.innerHTML = `
                        <a class="dropdown-item ml-2 justify-content-center" id="dropdown-item" data-friend-id="${data[i].username}">
                            <div>
                            <span class="material-symbols-outlined">
                                group_add
                            </span>
                            <span class="align-top">
                            ${data[i].username}
                            </span>
                            </div>
                        </a>
                        `;
                            dropdownMenu.appendChild(searchResults);
                        }
                        dropdownMenu.querySelectorAll("#dropdown-item").forEach((item) => {
                            item.addEventListener("click", function () {
                                sendFriendRequest(this.getAttribute("data-friend-id"));
                            });
                        });
                    });
                }
            })
            .catch((error) => alertError(error));
    } else {
        var dropdownMenu = document.getElementById("friendRequestResultsDropdown");
        dropdownMenu.innerHTML = "";
    }
}

function sendFriendRequest(username) {
    fetchWithToken(`https://${window.location.host}/api/friends-requests/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
        body: JSON.stringify({
            friend_username: username,
        }),
    })
        .then((response) => {
            if (response.status !== 200) {
                response.json().then((data) => alertError(data.error));
            } else {
                alertSuccess("Friend request sent successfully!");
            }
        })
        .catch((error) => alertError(error));
}
