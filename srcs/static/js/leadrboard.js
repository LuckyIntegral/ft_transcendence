const LEADERBOARD_PAGE_SIZE = 8;

function loadLeaderboardPage(page = 0) {
    if (document.getElementById("leaderboard") != null) {
        document.getElementById("leaderboard").remove();
    }
    var leaderboardSection = document.createElement("section");
    leaderboardSection.setAttribute("id", "leaderboard");
    leaderboardSection.setAttribute("class", "container col-12");
    leaderboardSection.innerHTML = `
    <div class="row">
        <div class="col justify-content-center input-group p-3 rounded border border-secondary">
            <legend class="p-2">Leaderboard</legend>
            <div id="leaderboard-table" class="container col-12"></div>
            <div class="table-pagination"></div>
        </div>
    </div>
    `;

    document.getElementById("content").innerHTML = "";
    document.getElementById("content").appendChild(leaderboardSection);

    loadLeaderboardTable(page);
}

function loadPagination(page, totalPages) {
    var pagination = document.querySelector(".table-pagination");
    pagination.innerHTML = `
    <ul class="pagination">
        <li class="page-item">
            <button class="page-link" id="left-btn" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>
        <li class="page-item"><a class="page-link" id="current-page"></a></li>
        <li class="page-item">
            <button class="page-link" id="right-btn" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>
    </ul>
    `;

    var leftButton = document.getElementById("left-btn");
    if (page <= 0) {
        leftButton.setAttribute("disabled", true);
    } else {
        leftButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadLeaderboardPage(page - 1);
        });
    }

    var rightButton = document.getElementById("right-btn");
    if (page + 1 >= totalPages) {
        rightButton.setAttribute("disabled", true);
    } else {
        rightButton.addEventListener("click", function (e) {
            e.preventDefault();
            loadLeaderboardPage(page + 1);
        });
    }

    var currentPage = document.getElementById("current-page");
    currentPage.textContent = page + 1;
}

function loadLeaderboardTable(page = 0) {
    var leaderboardTable = document.getElementById("leaderboard-table");
    var table = document.createElement("table");
    table.setAttribute("class", "table table-striped table-hover table-bordered text-center");
    table.innerHTML = `
    <thead class="thead-dark">
        <tr>
            <th scope="col">Rank</th>
            <th scope="col">Photo</th>
            <th scope="col">Username</th>
            <th scope="col">Games won</th>
            <th scope="col">Games played</th>
            <th scope="col">Win Rate</th>
            <th scope="col">Actions</th>
        </tr>
    </thead>
    <tbody id="leaderboard-table-body"></tbody>
    `;

    leaderboardTable.appendChild(table);

    var url = new URL(`https://${window.location.host}/api/leaderboard/`);
    url.searchParams.append("page", page);
    url.searchParams.append("pageSize", LEADERBOARD_PAGE_SIZE);

    fetchWithToken(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("access"),
        },
    })
        .then((response) => response.json())
        .then((res) => {
            loadPagination(page, res.totalPages);
            var leaderboardTableBody = document.getElementById("leaderboard-table-body");
            for (i = 0; i < res.data.length; i++) {
                var user = res.data[i];
                var row = document.createElement("tr");
                var winRate = 0;
                if (user.games != 0) {
                    winRate = ((user.wins / user.games) * 100).toFixed(2) + "%";
                }
                row.innerHTML = `
                <th scope="row">${i + 1 + page * LEADERBOARD_PAGE_SIZE}</th>
                <td><img src="${user.photo}" alt="Profile photo" class="rounded-circle" width="50" height="50"></td>
                <td>${user.username}</td>
                <td>${user.wins}</td>
                <td>${user.games}</td>
                <td>${winRate}</td>
                <td>
                    <button id="profile-popup-button" class="btn btn-outline-success">
                        <span class="material-symbols-outlined">info</span>
                    </button>
                    <button id="add-friend" class="btn btn-outline-danger">
                        <span class="material-symbols-outlined">person_add</span>
                    </button>
                </td>
                `;
                leaderboardTableBody.appendChild(row);
            }
            // Add event listeners to buttons
            var profilePopupButtons = document.querySelectorAll("#profile-popup-button");
            profilePopupButtons.forEach((button) => {
                button.addEventListener("click", function (e) {
                    e.preventDefault();
                    var username = button.parentElement.parentElement.children[2].textContent;
                    loadProfilePopup(username);
                });
            });
            var addFriendButtons = document.querySelectorAll("#add-friend");
            addFriendButtons.forEach((button) => {
                button.addEventListener("click", function () {
                    var username = button.parentElement.parentElement.children[2].textContent;
                    sendFriendRequest(username);
                });
            });
        })
        .catch((error) => {
            alertError(error);
        });
}

function loadProfilePopup(username) {
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
                enableButtons();
            });
            disableButtons();
        })
        .catch((error) => {
            alertError(error);
        });
}

function disableButtons() {
    var profilePopupButtons = document.querySelectorAll("#profile-popup-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = true;
    });
    var addFriendButtons = document.querySelectorAll("#add-friend");
    addFriendButtons.forEach((button) => {
        button.disabled = true;
    });
}

function enableButtons() {
    var profilePopupButtons = document.querySelectorAll("#profile-popup-button");
    profilePopupButtons.forEach((button) => {
        button.disabled = false;
    });
    var addFriendButtons = document.querySelectorAll("#add-friend");
    addFriendButtons.forEach((button) => {
        button.disabled = false;
    });
}
