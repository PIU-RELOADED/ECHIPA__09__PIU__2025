if (window.location.pathname.includes("dashboard.html")) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "login.html";
    } else {
        document.getElementById("welcome").innerText =
            "Bine ai venit, " + user.email;
    }
}

const form = document.getElementById("loginForm");
if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (email === "" || password === "") {
            document.getElementById("error").innerText =
                "Completeaza toate campurile";
            return;
        }

        // simulare autentificare
        const user = {
            email: email
        };

        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "dashboard.html";
    });
}

// logout
function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}
