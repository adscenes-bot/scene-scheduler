// js/auth-engine.js
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('authOverlay').style.display = 'none';
        loadCloudData();
    } else {
        currentUser = null;
        document.getElementById('authOverlay').style.display = 'flex';
    }
});

function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPass').value;
    const errBox = document.getElementById('authError');
    
    if (!email || !pass) { 
        errBox.innerText = "Credentials required."; 
        errBox.style.display = 'block'; 
        return; 
    }

    auth.signInWithEmailAndPassword(email, pass).catch(e => { 
        errBox.innerText = "Access Denied: " + e.message; 
        errBox.style.display = 'block'; 
    });
}

function logout() { auth.signOut(); }
