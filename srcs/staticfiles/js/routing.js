// Get the login link
var loginLink = document.getElementById('loginRef');

// Add a click event listener to the login link
loginLink.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the link from navigating to "#login"

    // Create a pop-up
    var popup = document.createElement('div');
    popup.style.display = 'block';
    popup.style.width = '200px';
    popup.style.height = '200px';
    popup.style.backgroundColor = '#fff';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    popup.style.padding = '20px';
    popup.style.textAlign = 'center';
    popup.innerHTML = '<h2>Login</h2><p>Please enter your username and password.</p>';

    // Add the pop-up to the body
    document.body.appendChild(popup);
});