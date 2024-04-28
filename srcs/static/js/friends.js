function loadFriendsPage() {
	var friendsPage = document.createElement('section');
    friendsPage.setAttribute('id', 'friends-page');
    friendsPage.setAttribute('class', 'container col-8');
    friendsPage.innerHTML = `
    <div class="input-group p-3 rounded border border-secondary">
        <legend class=" p-2">Add friends</legend>
        <button type="button" class="btn btn-outline-secondary rounded-start" id="sendFriendRequest">Send request</button>
        <input type="text" class="form-control rounded-end">
    </div>
    <div id="friends-list"></div>
    `;
    document.getElementById('content').innerHTML = '';
    document.getElementById('content').appendChild(friendsPage);
    document.getElementById('sendFriendRequest').addEventListener('click', sendFriendRequest);
    loadFriendsList();
}

function sendFriendRequest() {
    var searchInput = document.querySelector('input');
    fetchWithToken('http://localhost:8000/api/friends/', {
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
                    <td>${friend.displayName}</td>
                    <td><button type="button" class="btn btn-outline-secondary" data-friend-id="${friend.displayName}">Delete</button></td>
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
