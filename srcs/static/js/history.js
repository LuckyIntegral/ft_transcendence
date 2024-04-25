// import loadProfile from './profile.js';

// // Define your routes
// var routes = {
//     'profile': function() {
//         loadProfile();
//     },
//     'pong': function() {
//         document.getElementById('content').textContent = 'Pong page';
//     },
//     'default': function() {
//         document.getElementById('content').textContent = 'Default page';
//     }
// };

// // Function to handle hash changes
// function handleHashChange() {
//     var hash = window.location.hash.slice(1);  // Remove the '#' from the hash
//     var routeFunction = routes[hash];
//     if (routeFunction) {
//         routeFunction();
//     } else {
//         routes['default']();
//     }
// }

// // Listen for hash changes
// window.addEventListener('hashchange', handleHashChange);

// // Handle the initial hash
// handleHashChange();