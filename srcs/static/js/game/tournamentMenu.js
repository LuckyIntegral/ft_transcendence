PAGE_SIZE = 10;

class TournamentMenu {
    constructor() {
        this.participants = [];
    }

    start() {
        this.init();
        this.addMainUser();
        this.addEventListeners();
    }

    addEventListeners() {
        document
            .getElementById("search-by-username")
            .addEventListener("click", () => {
                this.loadUsersByUsername();
            });

        document
            .getElementById("create-tournament")
            .addEventListener("click", () => {
                this.createTournament();
            });
    }

    addMainUser() {
        fetchWithToken("/api/profile/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("access"),
            },
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                throw new Error(response.statusText);
            })
            .then((data) => {
                this.participants.push({
                    username: data.username,
                    picture: data.picture,
                    online: "Online",
                });
                this.updateParticipantsList();
            })
            .catch(() => {
                this.participants.push({
                    username: "Error",
                    picture: "",
                    online: "Online",
                });
                this.updateParticipantsList();
            });
    }

    loadUsersByUsername(pageIndex = 0) {
        var isFriendsOnly = document.getElementById("gridCheck1").checked;
        var username = document.getElementById("floatingInput").value;
        if (username === "") {
            return;
        }
        var url = new URL("/api/user-search", window.location.origin);
        url.searchParams.append("username", username);
        url.searchParams.append("is_friends_only", isFriendsOnly);
        url.searchParams.append("page_size", PAGE_SIZE);
        url.searchParams.append("page_index", pageIndex);
        fetchWithToken(url, {
            method: "GET",
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                }
                throw new Error(response.statusText);
            })
            .then((data) => {
                this.loadUsersToTable(data.data);
                this.loadUsersByUsernamePagination(data.totalPages, pageIndex);
            })
            .catch((error) => {
                alertError(error);
            });
    }

    loadUsersToTable(data) {
        var table = document.createElement("table");
        table.setAttribute("class", "table table-hover");
        table.innerHTML = `
            <tbody id="users-table">
            </tbody>
        `;
        document.getElementById("search-result").innerHTML = "";
        document.getElementById("search-result").appendChild(table);
        data.forEach((user) => {
            var row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${user.picture}" alt="profile picture" width="50" height="50"></td>
                <td>${user.username}</td>
                <td>${user.online}</td>
                <td>
                    <button class="btn btn-primary" id="add-${user.username}">
                        Add
                    </button>
                </td>
            `;
            row.querySelector(`#add-${user.username}`).addEventListener(
                "click",
                () => {
                    this.addParticipant(user);
                }
            );
            document.getElementById("users-table").appendChild(row);
        });
    }

    loadUsersByUsernamePagination(totalPages, page) {
        var pagination = document.getElementById(
            "user-search-table-pagination"
        );
        pagination.innerHTML = "";
        if (totalPages <= 1) {
            return;
        }
        pagination.innerHTML = `
        <ul class="pagination d-flex justify-content-center">
            <li class="page-item">
                <button class="page-link" id="user-search-left-btn" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </button>
            </li>
            <li class="page-item"><a class="page-link" id="user-search-current-page"></a></li>
            <li class="page-item">
                <button class="page-link" id="user-search-right-btn" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </button>
            </li>
        </ul>
        `;
        var leftButton = document.getElementById("user-search-left-btn");
        if (page <= 0) {
            leftButton.setAttribute("disabled", true);
        } else {
            leftButton.addEventListener("click", (e) => {
                e.preventDefault();
                this.loadUsersByUsername(page - 1);
            });
        }
        var rightButton = document.getElementById("user-search-right-btn");
        if (page + 1 >= totalPages) {
            rightButton.setAttribute("disabled", true);
        } else {
            rightButton.addEventListener("click", (e) => {
                e.preventDefault();
                this.loadUsersByUsername(page + 1);
            });
        }
        var currentPage = document.getElementById("user-search-current-page");
        currentPage.textContent = page + 1;
    }

    addParticipant(participant) {
        if (
            this.participants.filter((p) => p.username === participant.username)
                .length > 0
        ) {
            alertError("User is already in the tournament");
            return;
        }
        if (this.participants.length >= 4) {
            alertError("Tournament is full");
            return;
        }
        this.participants.push(participant);
        this.updateParticipantsList();
    }

    removeParticipant(user) {
        if (this.participants.includes(user)) {
            this.participants = this.participants.filter(
                (participant) => participant.username !== user.username
            );
            this.updateParticipantsList();
        }
    }

    updateParticipantsList() {
        var participantsList = document.getElementById("participants-list");
        participantsList.innerHTML = "";
        for (var i = 0; i < this.participants.length; i++) {
            var row = document.createElement("tr");
            if (i == 0) {
                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td><img src="${
                        this.participants[i].picture
                    }" alt="profile picture" width="50" height="50"></td>
                    <td>${this.participants[i].username}</td>
                    <td>${this.participants[i].online}</td>
                    <td></td>
                `;
            } else {
                row.innerHTML = `
                <td>${i + 1}</td>
                <td><img src="${
                    this.participants[i].picture
                }" alt="profile picture" width="50" height="50"></td>
                <td>${this.participants[i].username}</td>
                <td>${this.participants[i].online}</td>
                <td>
                    <button class="btn btn-danger" id="remove-${
                        this.participants[i].username
                    }">
                        <span class="material-symbols-outlined">
                            delete_forever
                        </span>
                    </button>
                </td>
                `;
            }
            participantsList.appendChild(row);
        }
        for (let i = 1; i < this.participants.length; i++) {
            document
                .getElementById(`remove-${this.participants[i].username}`)
                .addEventListener("click", () => {
                    console.log("Removing participant: ", this.participants[i]);
                    this.removeParticipant(this.participants[i]);
                });
        }
    }

    createTournament() {
        if (this.participants.length != 4) {
            alertError("Tournament must have 4 participants");
            return;
        }
        console.log("Creating tournament with participants: ", this.participants)
        var requestData = {}
        for (let i = 0; i < this.participants.length; i++) {
            requestData[`player${i + 1}`] = this.participants[i].username;
        }
        fetchWithToken("/api/lobby/tournament/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("access"),
            },
            body: JSON.stringify(requestData),
        })
        .then((response) => {
            if (response.status === 429) {
                alertError("Too many tournaments created by you. Please try again later.");
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then((data) => {
            if (data.error) {
                alertError(data.error);
            } else {
                window.location.hash = `tournamentslobby?token=${data.token}`;
                alertSuccess("Tournament created successfully. You joined the tournament lobby.");
            }
        }).catch((error) => {

        });
    }

    init() {
        this.loadContentDiv();
        this.loadParticipantsList();
        this.loadSearchQuery();
    }

    loadSearchQuery() {
        var form = document.createElement("form");
        form.setAttribute("id", "invite-form");
        form.setAttribute("class", "col-12");
        form.innerHTML = `
            <div class="form-group p-2">
                <div class="row-12">
                    <div class="form-check d-flex justify-content-between align-items-center">
                        <div>
                            <input class="form-check-input" type="checkbox" id="gridCheck1">
                            <label class="form-check-label" for="gridCheck1">
                                Friends only
                            </label>
                        </div>
                        <button class="btn btn-outline-secondary" type="button" id="search-by-username">
                            Search
                        </button>
                    </div>
                </div>
                <div class="form-floating mt-2 row-1">
                    <input type="text" class="form-control" id="floatingInput" placeholder="name">
                    <label for="floatingInput">Enter username</label>
                </div>
            </div>
        `;
        document.getElementById("invite-query").appendChild(form);
    }

    loadParticipantsList() {
        var table = document.createElement("table");
        table.setAttribute("class", "table table-striped");
        table.innerHTML = `
            <thead>
                <tr>
                    <th scope="col"></th>
                    <th scope="col">Picture</th>
                    <th scope="col">Username</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody id="participants-list">
            </tbody>
        `;
        document.getElementById("participants").appendChild(table);
    }

    loadContentDiv() {
        var friendsPage = document.createElement("section");
        friendsPage.setAttribute("class", "container col-12");
        friendsPage.innerHTML = `
            <div class="col border rounded border-secondary">
                <div class="row m-2 d-flex justify-content-center">
                    <div class="col-6">
                        <div id="invite-query">
                            <h2 class="mt-2">Add to Tournament</h2>
                        </div>
                        <div id="search-result"></div>
                        <div id="user-search-table-pagination"></div>
                    </div>
                    <div class="col-6">
                        <div class="row-5" id="participants"><h3 class="mt-2">Participants</h3></div>
                        <button class="btn btn-primary" id="create-tournament">
                            Create Tournament
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("content").innerHTML = "";
        document.getElementById("content").appendChild(friendsPage);
    }
}
