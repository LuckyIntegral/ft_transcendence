document.addEventListener('DOMContentLoaded', function() {
    function sendLongPollRequest() {
        fetchWithToken('api/messages/longpoll', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access')
            }
        })
        .then(response => {
            if (response.status === 200) {
                return response.json();
            }
        })
        .then(data => {
            if (data) {
                var action = data['action'];
                if (action == 'new_message') {
                    getUserListChats();
                }
            }
            sendLongPollRequest();
        });
    }
    sendLongPollRequest();
});