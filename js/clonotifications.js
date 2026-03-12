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
    let userid = sessionStorage.getItem('userid');
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
    if (!userid) {
        console.error('BA Number not found in local storage.');
        alert('Session expired. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', userid);
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


 
const role = sessionStorage.getItem('role');

let notificationbody = document.getElementById('officer_notification');;
let notificationDataCache = {};

function loadnotifactions() {
    let dbref = ref(db, `clo_cc_notification/`);
    const loadingOverlay = document.getElementById('loadingOverlay'); 
    onValue(dbref, (snapshot) => {
        notificationDataCache = snapshot.val();
        let html = '';
        notificationbody.style.display='flex';
        if (notificationDataCache) {
            for (const key of Object.keys(notificationDataCache).reverse()) {
                const notification = notificationDataCache[key];
                const message = notification.msg || '';
                const from= notification.from || '';
                const date = notification.date || '';
                html += `<div class="msg">
                        <h2>${from}</h2>
                        <p class="content">${message}<br><br> </p>
                        <p class="date">${date}</p>
                    </div>`;
            }
            notificationbody.innerHTML = html;
            notificationbody.style.minHeight='max-content';
            console.log("Notifications Loaded");
            console.log(notificationDataCache);
            if(loadingOverlay){
                loadingOverlay.classList.add('hidden'); 
            }
        }
        else {
            notificationbody.innerHTML = '<p>No notifications available.</p>';
            notificationbody.style.minHeight='50px';
            console.log("No Notifications Found");
            loadingOverlay.classList.add('hidden');
        } 
    }, (error) => {
        console.error('Error loading notifications:', error);
        loadingOverlay.classList.add('hidden');
        showNotification("Failed to load notifications. Please try again later.", "error", "Load Failed");
    });
}


loadnotifactions();


window.addEventListener('DOMContentLoaded', () => {
    const username=sessionStorage.getItem('username');
    const rank=sessionStorage.getItem('rank');
    const userid=sessionStorage.getItem('userid');
    document.getElementById('username').textContent='Name: ' + username;
    document.getElementById('rank').textContent=ranklist[rank] ? 'Rank: ' + ranklist[rank] : 'Rank: ' + rank;
    document.getElementById('userid').textContent='BA Number: ' + userid;
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



const logoutButton = document.getElementById('logoutButton');

logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('userid');
    sessionStorage.removeItem('role_type');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('rank');
    window.location.href = 'index.html';
});


document.getElementById('clear_notifications')?.addEventListener('click', () => {
    if(role === 'guest'){
        showNotification('Guests are not authorized to clear notifications.', 'error', 'Unauthorized Action');
        return;
    }
    const confirmClear = confirm("Are you sure you want to clear all notifications?");
    if (confirmClear) {  
        let dbref = ref(db, `clo_cc_notification/`);
        remove(dbref).then(() => {
            showNotification("All notifications cleared successfully.", "success", "Notifications Cleared");
            notificationbody.innerHTML = '<p>No notifications available.</p>';
            notificationbody.style.minHeight='50px';
            console.log("Notifications Cleared");
        }).catch((error) => {
            console.error('Error clearing notifications:', error);
            showNotification("Failed to clear notifications. Please try again later.", "error", "Clear Failed");
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    if(role=== 'clo'){
        get(ref(db, 'clonotificationcount')).then((snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('notificationCount').style.display='block';
            }
        }).catch((error) => {
            console.error(error);
        });
    }
});

document.getElementById('notification_menu').addEventListener('click', () => {
    if(role=== 'clo'){
        remove(ref(db, 'clonotificationcount')).then(() => {
            document.getElementById('notificationCount').style.display='none';
            console.log("Notification count reset");
        }).catch((error) => {
            console.error(error);
        });
    }
});

// Auto-reload page every 30 seconds
setInterval(() => {
    console.log('Auto-reloading page...');
    window.location.reload();
}, 30000); // 30 seconds = 30000 milliseconds