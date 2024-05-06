function loadMessagesPage() {
    var messagesPage = document.createElement('section');
    messagesPage.setAttribute('style', 'background-color: #eee;');

    fetch('/static/templates/messages.html')
        .then(response => response.text())
        .then(data => {
            messagesPage.innerHTML = data;
            document.getElementById('content').innerHTML = '';
            document.getElementById('content').appendChild(messagesPage);
        });
}

function createIncomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.setAttribute('style', 'text-align: left;');
    li.innerHTML = `<div class="message-data">
                        <span class="message-data-time">${time}</span>
                        <img src=${avatarUrl} alt="avatar">
                    </div>
                    <div class="message my-message">${message}</div>
                    `;
    return li;
}

function createOutcomeMessageItemLi(message, time, avatarUrl) {
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.setAttribute('style', 'text-align: right;');
    li.innerHTML = `<div class="message-data">
                        <span class="message-data-time">${time}</span>
                        <img src=${avatarUrl} alt="avatar">
                    </div>
                    <div class="message other-message float-right">${message}</div>
                    `;
    return li;
}

function createUserListItemLi(data, type) {
    var li = document.createElement('li');
    var unreadLine = '';
    if (type === 'active') {
        li.setAttribute('class', 'clearfix active');
    } else if (data['isRead']) {
        li.setAttribute('class', 'clearfix')
    } else {
        li.setAttribute('class', 'clearfix unread');
        unreadLine = `<div class="unread-indicator">
                        <span class="icon">✉️</span>
                        <span class="text">New message</span>
                    </div>
                    `;
    }
    if (data['isOnline']) {
        statusLine = `<div class="status"> <i class="fa fa-circle online"></i> online </div>`
    } else {
        statusLine = `<div class="status"> <i class="fa fa-circle offline"></i> ${data['lastOnline']} </div>`
    }
    li.innerHTML = `<li class="clearfix" data-chat-token="${data['token']}">
                        <img src="${data['picture']}" alt="avatar">
                        <div class="about">
                            <div class="name">${data['username']}</div>
                            ${statusLine}
                        </div>
                        ${unreadLine}
                    </li>
                    `;
    return li;
}

function getUserListChats () {
    fetchWithToken('/api/messages/')
    .then(response => function() {
        if (response.status === 200) {
            return response.json();
        }
        throw new Error('Failed to load messages');
    })
    .then(data => {
        var chatsList = document.getElementById('userList');
        chatsList.innerHTML = '';
        data.forEach(chat => {
            chatsList.appendChild(createUserListItemLi(chat, 'inactive'));
        });
    }).catch(error => {
        console.error(error);
    });
}
