document.addEventListener('DOMContentLoaded', function() {
    var logoutLink = document.getElementById('logOutRef');
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        location.reload();
    });
});