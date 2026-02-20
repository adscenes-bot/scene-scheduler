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
    if (!email || !pass) return;
    auth.signInWithEmailAndPassword(email, pass).catch(e => {
        document.getElementById('authError').innerText = e.message;
        document.getElementById('authError').style.display = 'block';
    });
}
