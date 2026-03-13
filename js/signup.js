import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, set, get, ref } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { showNotification } from './notification.js';

// Firebase configuration
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


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

console.log("Firebase Initialized for Add User");
const role_type = sessionStorage.getItem('role_type');
console.log("Role Type from Session Storage:", role_type);

window.addEventListener('DOMContentLoaded', () => {
    let roletype = sessionStorage.getItem('role_type');
    if (!roletype) {
        console.error('Role type not found in session storage.');
        window.location.href = 'index.html';
        return;
    }
    const roleSelect = document.getElementById('role');
    
    if(roletype === 'guest'){
        const option = document.createElement('option');
        option.value = 'guest';
        option.textContent = 'Guest';
        roleSelect.appendChild(option);
        return;
    }
    if(roletype === 'admin'){
        const option = document.createElement('option');
        option.value = 'admin';
        option.textContent = 'Admin';
        roleSelect.appendChild(option);
        return;
    }
    if(roletype === 'clo'){
        const option = document.createElement('option');
        option.value = 'clo';
        option.textContent = 'Chief Logistic Officer';
        roleSelect.appendChild(option);
        return;
    }
    if(roletype === 'cc'){
        const option = document.createElement('option');
        option.value = 'cc';
        option.textContent = 'Commanding Officer';
        roleSelect.appendChild(option);
        return;
    }

    
    const dbRef = ref(db, 'roles/' + roletype);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const roles = snapshot.val();
            for (const key in roles) {
                if (roles.hasOwnProperty(key)) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = roles[key].name;
                    roleSelect.appendChild(option);
                }
            }
        } else {
            console.warn('No roles found for role type:', roletype);
            const option = document.createElement('option');
            option.value = 'admin';
            option.textContent = 'Admin';

            roleSelect.appendChild(option);
        }
    }).catch((error) => {
        console.error('Error fetching roles:', error);
    });
});

// Handle form submission
const addUserForm = document.getElementById('add-user-form');
addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const userid = document.getElementById('ba-number').value.trim();
    const name = document.getElementById('name').value.trim();
    const rank = document.getElementById('rank').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;

    // Validation
    if (!userid || !name || !rank || !password || !role) {
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
        const userRef = ref(db, 'users/'+role_type + '/' + userid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            showNotification("User with this BA Number already exists", "error", "User Exists");
            return;
        }
        set(ref(db, 'approval/' + userid), {
            userid: userid,
            name: name,
            rank: rank,
            password: password,
            role: role,
            role_type: role_type,
            createdAt: new Date().toISOString()
        });
        console.log("User added to CLO approval queue:", userid);
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
