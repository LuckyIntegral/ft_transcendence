function loadFriendsPage() {
    var friendsPage = document.createElement('section');
    friendsPage.setAttribute('id', 'friends-page');
    friendsPage.setAttribute('class', 'container col-10');
    friendsPage.innerHTML = `
    <div class="row">
        <div class="input-group p-3 rounded border border-secondary">
            <legend class=" p-2">Add friends</legend>
            <button type="button" class="btn btn-outline-secondary rounded-start" id="sendFriendRequest">Send request</button>
            <input type="text" class="form-control rounded-end">
        </div>
    </div>
    <div class="row">
        <div class="col input-group p-3 rounded border border-secondary">
            <legend class="p-2">Friends</legend>
            <div id="friends-list" class="container col-12"></div>
        </div>
        <div class="col input-group p-3 rounded border border-secondary">
            <legend class="p-2">Friend requests</legend>
            <div id="friends-requests" class="container col-12"></div>
        </div>
    </div>
    `;
    document.getElementById('content').innerHTML = '';
    document.getElementById('content').appendChild(friendsPage);
    document.getElementById('sendFriendRequest').addEventListener('click', sendFriendRequest);
    loadFriendsList();
    loadFriendsRequestsList();
}

function loadFriendsRequestsList() {
    var friendsRequestsList = document.getElementById('friends-requests');
    fetchWithToken('http://localhost:8000/api/friends-requests/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
    }).then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            var noFriendsRequests = document.createElement('table');
            noFriendsRequests.setAttribute('class', 'table table-striped table-hover table-bordered');
            noFriendsRequests.innerHTML = `
            <thead>
                <th scope="col">
                    You have no friend requests yet
                </th>
            </thead>
            `;
            friendsRequestsList.appendChild(noFriendsRequests);
        } else {
            var friendRequestTable = document.createElement('table');
            friendRequestTable.setAttribute('class', 'table table-striped table-hover table-bordered');

            var friendRequestTableHeader = document.createElement('thead');
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

            var friendRequestTableBody = document.createElement('tbody');
            let i = 1;
            data.forEach(function(friendRequest) {
                var friendRequestDiv = document.createElement('tr');
                friendRequestDiv.innerHTML = `
                <th scope="row">${i}</th>
                <td>${friendRequest.email}</td>
                <td>${friendRequest.username}</td>
                <td>
                <button type="button" id="accept-friend-request" class="btn btn-outline-secondary" data-friend-request-id="${friendRequest.username}">
                    <span class="material-symbols-outlined">priority</span>
                </button>
                <button type="button" id="delete-friend-request" class="btn btn-outline-secondary" data-friend-request-id="${friendRequest.username}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
                </td>
                `;
                friendRequestTableBody.appendChild(friendRequestDiv);
                i += 1
            });
            friendRequestTableBody.querySelectorAll('#accept-friend-request').forEach(button => {
                button.addEventListener('click', acceptFriendRequest);
            });
            friendRequestTableBody.querySelectorAll('#delete-friend-request').forEach(button => {
                button.addEventListener('click', deleteFriendRequest);
            });
            friendRequestTable.appendChild(friendRequestTableHeader);
            friendRequestTable.appendChild(friendRequestTableBody);
            friendsRequestsList.appendChild(friendRequestTable);
        }
    }
    ).catch(error => console.error('Error:', error));
}

function acceptFriendRequest() {
    actionFriendRequest.call(this, 'accept');
}

function deleteFriendRequest() {
    actionFriendRequest.call(this, 'delete');
}

function actionFriendRequest(action = 'accept') {
    var friendUsername = this.getAttribute('data-friend-request-id');
    fetchWithToken('http://localhost:8000/api/friends-requests/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
            body: JSON.stringify({
                'friend_username': friendUsername,
                'action': action,
            }),
    }).then(response => {
        if (response.status !== 200) {
            response.json().then(data => alert(data.error));
        } else {
            window.location.reload();
        }
    }).catch(error => console.error('Error:', error));
}

function sendFriendRequest() {
    var searchInput = document.querySelector('input');
    fetchWithToken('http://localhost:8000/api/friends-requests/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
            body: JSON.stringify({
                'friend_username': searchInput.value,
            }),
    }).then(response => {
        if (response.status !== 200) {
            response.json().then(data => alert(data.error));
        } else {
            window.location.reload();
        }
    }).catch(error => console.error('Error:', error));
}

function loadFriendsList() {
    var friendsList = document.getElementById('friends-list');
    fetchWithToken('http://localhost:8000/api/friends/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
    })
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                var noFriends = document.createElement('table');
                noFriends.setAttribute('class', 'table table-striped table-hover table-bordered');
                noFriends.innerHTML = `
                <thead>
                    <th scope="col">
                        You have no friends yet
                    </th>
                </thead>
                `;
                friendsList.appendChild(noFriends);
            } else {
                var friendTable = document.createElement('table');
                friendTable.setAttribute('class', 'table table-striped table-hover table-bordered');

                var friendTableHeader = document.createElement('thead');
                friendTableHeader.innerHTML = `
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Email</th>
                        <th scope="col">Username</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                `;

                var friendTableBody = document.createElement('tbody');
                let i = 1;
                data.forEach(function(friend) {
                    var friendDiv = document.createElement('tr');
                    friendDiv.innerHTML = `
                    <th scope="row">${i}</th>
                    <td>${friend.email}</td>
                    <td>${friend.username}</td>
                    <td><button type="button" class="btn btn-outline-secondary" data-friend-id="${friend.username}">Delete</button></td>
                    `;
                    friendTableBody.appendChild(friendDiv);
                    i += 1
                });
                friendTableBody.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', deleteFriend);
                });
                friendTable.appendChild(friendTableHeader);
                friendTable.appendChild(friendTableBody);
                friendsList.appendChild(friendTable);
            }
        })
        .catch(error => console.error('Error:', error));
}

function deleteFriend() {
    var friendUsername = this.getAttribute('data-friend-id');
    fetchWithToken('http://localhost:8000/api/friends/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access'),
            },
            body: JSON.stringify({
                'friend_username': friendUsername,
            }),
    }).then(response => {
        if (response.status !== 200) {
            response.json().then(data => alert(data.error));
        } else {
            window.location.reload();
        }
    }).catch(error => console.error('Error:', error));
}
