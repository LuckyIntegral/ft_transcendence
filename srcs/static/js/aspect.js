async function fetchWithToken(url, options) {
    options.headers = options.headers || {};
    options.headers.Authorization = "Bearer " + localStorage.getItem("access");
    return fetch(url, options).then((response) => {
        if (response.status === 401) {
            // Token expired, try to refresh it
            return fetch("/api/token/refresh/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refresh: localStorage.getItem("refresh"),
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    // Store the new access token in local storage
                    localStorage.setItem("access", data.access);
                    // Retry the original request
                    options.headers.Authorization = "Bearer " + data.access;
                    return fetch(url, options);
                });
        } else {
            return response;
        }
    });
}
