function isAuthenticated() {
    return localStorage.getItem("isLoggedIn") === "true";
}

function getCurrentUserEmail() {
    return localStorage.getItem("userEmail") || "";
}

function protectPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    const isLoginPage = currentPath.includes('login.html');
    const protectedPages = ['dashboard.html', 'index.html', 'event-detail.html', 'create-event.html'];
    
    if (!isLoginPage && protectedPages.some(page => currentPath.includes(page))) {
        if (!isAuthenticated()) {
            const loginPath = currentPath.includes('pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
            return false;
        }
    }
    return true;
}

function redirectIfAuthenticated() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('login.html')) {
        if (isAuthenticated()) {
            const dashboardPath = currentPath.includes('pages/') ? 'dashboard.html' : 'pages/dashboard.html';
            window.location.href = dashboardPath;
        }
    }
}

(function() {
    function init() {
        if (!protectPage()) {
            return;
        }
        redirectIfAuthenticated();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const errorElement = document.getElementById("error");

        if (email === "" || password === "") {
            errorElement.innerText = "Completează toate câmpurile";
            errorElement.style.display = "block";
            return;
        }

        if (!validateEmail(email)) {
            errorElement.innerText = "Introdu o adresă de email validă";
            errorElement.style.display = "block";
            return;
        }

        if (password.length < 3) {
            errorElement.innerText = "Parola trebuie să aibă minimum 3 caractere";
            errorElement.style.display = "block";
            return;
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        
        const currentPath = window.location.pathname;
        const dashboardPath = currentPath.includes('pages/') ? 'dashboard.html' : 'pages/dashboard.html';
        window.location.href = dashboardPath;
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function logout() {
    if (confirm("Ești sigur că vrei să te deloghezi?")) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        const currentPath = window.location.pathname;
        const loginPath = currentPath.includes('pages/') ? 'login.html' : 'pages/login.html';
        window.location.href = loginPath;
    }
}

function displayUserInfo() {
    const email = getCurrentUserEmail();
    const currentPath = window.location.pathname;
    
    if (email && (currentPath.includes("dashboard.html") || currentPath.includes("index.html"))) {
        const welcomeElement = document.getElementById("welcome");
        const userInfoElement = document.getElementById("userInfo");
        
        if (welcomeElement) {
            const name = email.split('@')[0];
            welcomeElement.innerText = `Bine ai venit, ${name}!`;
        }
        
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <div class="info-item">
                    <strong>Email:</strong> ${email}
                </div>
            `;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', displayUserInfo);
} else {
    displayUserInfo();
}
