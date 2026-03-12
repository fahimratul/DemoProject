import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, set, get, ref } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { showNotification } from './notification.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIX-3-GunSudlllY-dFRo943ysFXtBiOk",
    authDomain: "bdarmystoremgt.firebaseapp.com",
    databaseURL: "https://bdarmystoremgt-default-rtdb.firebaseio.com",
    projectId: "bdarmystoremgt",
    storageBucket: "bdarmystoremgt.firebasestorage.app",
    messagingSenderId: "960978586847",
    appId: "1:960978586847:web:afcee2217a1c3c876ead6a",
    measurementId: "G-H27M1SNMPX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

console.log("Firebase Initialized for Add User");

window.addEventListener('DOMContentLoaded', () => {
    let roletype = sessionStorage.getItem('role_type');
    if (!roletype) {
        console.error('Role type not found in session storage.');
        window.location.href = 'index.html';
        return;
    }
});

// Handle form submission
const addUserForm = document.getElementById('add-user-form');
addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const baNumber = document.getElementById('ba-number').value.trim();
    const name = document.getElementById('name').value.trim();
    const rank = document.getElementById('rank').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;

    // Validation
    if (!baNumber || !name || !rank || !password || !role) {
        showNotification("Please fill in all required fields", "error", "Validation Error");
        return;
    }

    if (password !== confirmPassword) {
        showNotification("Passwords do not match", "error", "Validation Error");
        return;
    }

    if (password.length < 6) {
        showNotification("Password must be at least 6 characters long", "error", "Validation Error");
        return;
    }

    // Check if user already exists
    try {
        const userRef = ref(db, 'users/' + baNumber);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            showNotification("User with this BA Number already exists", "error", "User Exists");
            return;
        }
        set(ref(db, 'cloapproval/users/' + baNumber), {
            baNumber: baNumber,
            name: name,
            rank: rank,
            password: password,
            role: role
        });
        console.log("User added to CLO approval queue:", baNumber);
        showNotification("Account created successfully and pending approval", "success", "Success");
        setTimeout(() => {        
            addUserForm.reset();
            window.location.href = 'index.html';
        }, 750);
    } catch (error) {
        console.error("Error adding user:", error);
        showNotification("Error adding user. Please try again.", "error", "Error");
    }
});



console.log("Add User Script Loaded");
