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

function createIncomeMessageLi(message, time, avatarUrl) {
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

function createOutcomeMessageLi(message, time, avatarUrl) {
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