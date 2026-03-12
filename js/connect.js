
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase, set, get, ref } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


 // Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBUis8E99I4feTN2D2Opivn1rwyZe7DmPU",
    authDomain: "fir-3842a.firebaseapp.com",
    databaseURL: "https://fir-3842a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fir-3842a",
    storageBucket: "fir-3842a.firebasestorage.app",
    messagingSenderId: "904490469367",
    appId: "1:904490469367:web:53595ab4b9d2a1c65810f2",
    measurementId: "G-EEZ0XX89X5"
};

import {showNotification} from './notification.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
console.log("Firebase Initialized");
console.log("Analytics Initialized");
console.log(sessionStorage.getItem('role_type'));



// Handle Enter key press in BA number field to move to password field
document.getElementById('ba-number').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('password').focus();
    }
});

// Handle Enter key press in password field to trigger login
document.getElementById('password').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        handlelogin();
    }
});

function handlelogin() {
    console.log("Login button clicked");
    const banumber = document.getElementById('ba-number').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!banumber || !password) {
        showNotification("Please fill in all fields", "error", "Login Failed");
        return;
    }
    let dbRef;
    const role_type = sessionStorage.getItem('role_type');
    if( role_type === 'guest') {
    dbRef = ref(db, 'users/guest/' + banumber);
    }
    else if (role_type === 'admin') {
        dbRef = ref(db, 'users/admin/' + banumber);
    }
    else if (role_type === 'storeman') {
        dbRef = ref(db, 'users/storeman/' + banumber);
    }
    else if (role_type === 'officer') {
        dbRef = ref(db, 'users/officer/' + banumber);
    }
    else if (role_type === 'cc') {
        dbRef = ref(db, 'users/cc/' + banumber);
    }
    else if( role_type === 'clo') {
        dbRef = ref(db, 'users/clo/' + banumber);
    }
    
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const role =userData.role;
            const userRank = userData.rank;
            if (userData.password === password) {
                console.log("Login successful");
                sessionStorage.setItem('baNumber', banumber);
                sessionStorage.setItem('role', role);
                sessionStorage.setItem('username', userData.name);
                sessionStorage.setItem('rank', userData.rank);
                if (rememberMe) {
                    localStorage.setItem('baNumber', banumber);
                    localStorage.setItem('password', password);
                    console.log("Credentials saved to localStorage");
                } else {
                    localStorage.removeItem('baNumber');
                    localStorage.removeItem('password');
                    localStorage.removeItem('role');
                }
                if (role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                }
                else if (role === 'storeman') {
                    window.location.href = 'dashboard/storeman_dashboard.html';
                }
                else if (role === 'officer') {
                    window.location.href = 'dashboard/officer_dashboard.html';
                }
            } else {
                console.log("Invalid password or role");
                showNotification("Invalid password or role", "error", "Login Failed");
            }
            }
        }).catch((error) => {
        console.error(error);
        alert("Error fetching data");
    });
}


const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', handlelogin); 

console.log("Event listener added to login button");

