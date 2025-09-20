function checkLoginStatus() {
    const user = localStorage.getItem('user');
    const adminLink = document.querySelector('nav ul li a[href="admin.html"]');
    
    if (user) {
        const userData = JSON.parse(user);
        document.getElementById('userDisplay').style.display = 'flex';
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userName').textContent = `Welcome, ${userData.name}`;
        
        if (adminLink) {
            adminLink.parentElement.style.display = userData.role === 'admin' ? 'block' : 'none';
        }
    } else {
        if (adminLink) {
            adminLink.parentElement.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

window.onload = checkLoginStatus; 