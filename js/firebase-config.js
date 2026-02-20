// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDvrE92N_kMbIA8gIO0a0dcYx7-ZUmr7mA",
    authDomain: "adscenes-content.firebaseapp.com",
    projectId: "adscenes-content",
    storageBucket: "adscenes-content.firebasestorage.app",
    messagingSenderId: "613616055800",
    appId: "1:613616055800:web:20fcbe7a3370d5b521120d"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
const auth = firebase.auth();
