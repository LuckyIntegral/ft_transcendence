document.addEventListener('DOMContentLoaded', function() {
    // Logout handling
    var logoutLink = document.getElementById('logoutRef');
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        location.reload();
    });
});