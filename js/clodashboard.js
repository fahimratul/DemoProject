import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase, get, ref,set, update, remove, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


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
getAnalytics(app);
const db = getDatabase(app);
console.log(db);
console.log("Firebase Initialized");

window.addEventListener('DOMContentLoaded', () => {
    let baNumber = sessionStorage.getItem('baNumber');
    let role_type = sessionStorage.getItem('role_type');
    if (!role_type) { 
        console.error('Role type not found in session storage.');
        alert('Session expired or unauthorized access. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    if( role_type !== 'cc' && role_type !== 'clo') { 
        console.error('Unauthorized role type:', role_type);
        alert('Unauthorized access. Please log in with the correct credentials.');
        window.location.href = 'index.html';
        return;
    }
    if (!baNumber) {
        console.error('BA Number not found in local storage.');
        alert('Session expired. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', baNumber);
});

let ranklist ={
    lt:"Lieutenant",
    capt:"Captain",
    major:"Major",
    ltcol:"Lieutenant Colonel",
    col:"Colonel",
    brig:"Brigadier",
    majorgen:"Major General",
    ltgen:"Lieutenant General",
    gen:"General"
};


// Clear sessionStorage when the site is closed
 
const role = sessionStorage.getItem('role');


window.addEventListener('DOMContentLoaded', () => {
    const username=sessionStorage.getItem('username');
    const rank=sessionStorage.getItem('rank');
    const banumber=sessionStorage.getItem('baNumber');
    document.getElementById('username').textContent='Name: ' + username;
    document.getElementById('rank').textContent=ranklist[rank] ? 'Rank: ' + ranklist[rank] : 'Rank: ' + rank;
    document.getElementById('banumber').textContent='BA Number: ' + banumber;
    const titleElement = document.getElementById('title');
    if(role === 'cc'){
        
        titleElement.textContent = 'Welcome , Contingent Commander';
    }
    else if(role === 'clo'){
        
        titleElement.textContent = 'Welcome , Cheif Logistic Officer';
    }
    else if(role === 'guest'){
        titleElement.textContent = 'Welcome, Guest';
    }
    else {
        console.error('Invalid role:', role);
        showNotification("Invalid role. Cannot load inventory data.", "error", "Load Failed");
        window.location.href = 'index.html';
        return;
    }
    
});


import {showNotification} from './notification.js';

console.log("Officer Script Loaded");



function loaditemdata(type, path) {
    let dbRef=ref(db, path);
    const totalitemElement = document.getElementById(type);
    let totalItemsCount = 0;
    const loadingOverlay = document.getElementById('loadingOverlay');

    onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            totalItemsCount =snapshot.size;
            totalitemElement.textContent = totalItemsCount;
            console.log(`Total items in ${type} inventory:`, totalItemsCount);
        } else {
            totalitemElement.textContent = '0';
            console.log(`No data available in ${type} inventory.`);
        }   
            
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}



loaditemdata('engr', 'engrinventory/main/');
loaditemdata('sig', 'siginventory/main/');
loaditemdata('mt', 'mtinventory/main/');
loaditemdata('bknco', 'bkncoinventory/main/');
loaditemdata('bqms', 'bqmsinventory/main/');
loaditemdata('workshop', 'workshop/main/');
loaditemdata('medical', 'medical/main/');
loaditemdata('cimic', 'cimic/main/');
loaditemdata('stationary', 'stationary/main/');


const logoutButton = document.getElementById('logoutButton');

logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('baNumber');
    sessionStorage.removeItem('role_type');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('rank');
    window.location.href = 'index.html';
});


window.addEventListener('DOMContentLoaded', () => {
    if(role=== 'clo'){
        onValue(ref(db, 'clonotification'), (snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('notificationCount').style.display='block';
            }
        }, (error) => {
            console.error(error);
        });
    }  
});

document.getElementById('notification_menu').addEventListener('click', () => {
    if(role=== 'clo'){
        remove(ref(db, 'clonotification')).then(() => {
            document.getElementById('notificationCount').style.display='none';
            console.log("Notification count reset");
        }).catch((error) => {
            console.error(error);
        });
    }
});



function loadvehicledata() {

    const dbRef = ref(db, `vehiclelist/main/`);
    const loadingOverlay = document.getElementById('loadingOverlay');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        let vehicleinfo = {
            total: 0, alr: 0, asr: 0, inmaintenance: 0, grounded: 0 
        };
        if (data) {
            for (const key in data) {
                vehicleinfo.total += 1;
                const vehicle = data[key];
                switch (vehicle.condition) {
                    case 'alr':
                        vehicleinfo.alr += 1;
                        break;
                    case 'asr':
                        vehicleinfo.asr += 1;
                        break;
                    case 'inmaintenance':
                        vehicleinfo.inmaintenance += 1;
                        break;
                    case 'grounded':
                        vehicleinfo.grounded += 1;
                        break;
                }
            }
        }
        document.getElementById('totalVehicles').textContent = vehicleinfo.total;
        document.getElementById('ALRVehicles').textContent = vehicleinfo.alr;
        document.getElementById('ASRVehicles').textContent = vehicleinfo.asr;
        document.getElementById('inMaintenanceVehicles').textContent = vehicleinfo.inmaintenance;
        document.getElementById('groundedVehicles').textContent = vehicleinfo.grounded;
        // Hide loading overlay after data is loaded
        if (loadingOverlay) {
            setTimeout(() => {
            document.getElementById('loadingOverlay').classList.add('hidden');
            }, 50);
        }
    });
}


loadvehicledata();

document.getElementById('passwordChangeSubmitBtn').addEventListener('click', () => {
    const newBaNumber = document.getElementById('banumber').value.trim();
    const newRank = document.getElementById('rank').value.trim();
    const baNumber = sessionStorage.getItem('baNumber');
    const name = document.getElementById('name').textContent;
    if (!newBaNumber || !newRank) {
        showNotification("BA Number and Rank cannot be empty.", "warning", "Input Error");
        return;
    }
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (password !== confirmPassword) {
        showNotification("Passwords do not match.", "error", "Input Error");
        return;
    }
    remove(ref(db, `officers/${baNumber}`)).then(() => {
        const newOfficerData = {
            name: name,
            rank: newRank,
            baNumber: newBaNumber,
            role_type: 'clo',
            password: password
        };
        set(ref(db, `users/${newBaNumber}`), newOfficerData).then(() => {
            sessionStorage.setItem('baNumber', newBaNumber);
            sessionStorage.setItem('rank', newRank);
            showNotification("Information updated successfully. Please log in again.", "success", "Update Successful");
            setTimeout(() => {
                window.location.href = 'index.html';
            },1000);
        }).catch((error) => {
            console.error('Error updating information:', error);
            showNotification("Failed to update information. Please try again.", "error", "Update Failed");
        });
    }).catch((error) => {
        console.error('Error removing old information:', error);
        showNotification("Failed to update information. Please try again.", "error", "Update Failed");
    }
    );
});



