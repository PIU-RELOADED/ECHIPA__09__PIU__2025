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
    const isRegisterPage = currentPath.includes('register.html');
    const protectedPages = ['dashboard.html', 'index.html', 'event-detail.html', 'create-event.html'];
    
    if (!isLoginPage && !isRegisterPage && protectedPages.some(page => currentPath.includes(page))) {
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
    if (currentPath.includes('login.html') || currentPath.includes('register.html')) {
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

function getUsers() {
    const raw = localStorage.getItem("users");
    return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}

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

        const users = getUsers();
        if (users.length > 0) {
            const user = users.find(u => u.email === email);
            if (!user) {
                errorElement.innerText = "Email sau parolă incorectă";
                errorElement.style.display = "block";
                return;
            }
            if (user.password !== password) {
                errorElement.innerText = "Email sau parolă incorectă";
                errorElement.style.display = "block";
                return;
            }
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

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const email = document.getElementById("regEmail").value.trim();
        const password = document.getElementById("regPassword").value;
        const passwordConfirm = document.getElementById("regPasswordConfirm").value;
        const name = document.getElementById("regName").value.trim();

        const errorElement = document.getElementById("error");
        const successElement = document.getElementById("success");

        errorElement.style.display = "none";
        successElement.style.display = "none";

        if (email === "" || password === "" || passwordConfirm === "" || name === "") {
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

        if (password !== passwordConfirm) {
            errorElement.innerText = "Parolele nu coincid";
            errorElement.style.display = "block";
            return;
        }

        const users = getUsers();
        if (users.find(u => u.email === email)) {
            errorElement.innerText = "Un cont cu acest email există deja";
            errorElement.style.display = "block";
            return;
        }

        const newUser = {
            email: email,
            password: password,
            name: name,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        
        successElement.innerText = "Cont creat cu succes! Redirecționare...";
        successElement.style.display = "block";
        
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const dashboardPath = currentPath.includes('pages/') ? 'dashboard.html' : 'pages/dashboard.html';
            window.location.href = dashboardPath;
        }, 1500);
    });
}

