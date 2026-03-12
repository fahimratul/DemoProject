import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase, get, ref, set, remove, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


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
    let roleType = sessionStorage.getItem('role_type');
    console.log('Role Type from sessionStorage:', roleType);
    if (!roleType || roleType !== 'officer' && roleType !== 'clo' && roleType !=='cc') {
        console.error('Unauthorized access. Redirecting to login.');
        window.location.href = 'index.html';
        return;
    }
    if (!baNumber) {
        console.error('BA Number not found in local storage.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', baNumber);
    if(roleType === 'clo' || roleType === 'cc'){
        document.getElementById('PendingUser').style.display = 'inline-block';
    }
});

let userrole ={
    engrnco:"Storeman (Engineer)",
    signco:"Storeman (Signal)",
    bqms:"BQMS",
    ammonco:"Ammo NCO",
    bknco:"Barrack NCO",
    mtnco:"MT NCO",
    mtjco:"MT JCO",
    cc:"Contingent Commander",
    clo:"Cheif Logistics Officer",
    lo:"Logistics Officer",
    so:"Signals Officer",
    eo:"Engineer Officer",
    mto:"Military Transport Officer"
}

let ranklist ={
    snk:"Sainik",
    lcpl:"Lance Corporal",
    cpl:"Corporal",
    sgt:"Sergeant",
    wo:"Warrant Officer",
    swo:"Senior Warrant Officer",
    mwo:"Master Warrant Officer",
    lt:"Lieutenant",
    capt:"Captain",
    major:"Major",
    ltcol:"Lieutenant Colonel",
    col:"Colonel",
    brig:"Brigadier",
    majorgen:"Major General",
    ltgen:"Lieutenant General",
    gen:"General"
}


import {showNotification} from './notification.js';
console.log("User management Script Loaded");

let role = sessionStorage.getItem('role');


function loaditemdata() {
    const dbRef = ref(db, 'users/');
    const loadingOverlay = document.getElementById('loadingOverlay');
    let undercommandrole = {};
    if(role === 'eo'){
        undercommandrole = ['engrnco', 'bknco'];
    }
    else if(role === 'so'){
        undercommandrole = ['signco'];
    }
    else if (role === 'lo'){
        undercommandrole = ['bqms', 'ammonco'];
    }
    else if (role === 'mto'){
        
        undercommandrole = ['mtnco', 'mtjco'];
    }
    else if( role === 'workshop'){
        undercommandrole = ['workshopnco'];
    }
    else{
        undercommandrole = null; // CLO and above can see all
    }


    get(dbRef).then((snapshot) => {
        const data = snapshot.val();
        let serial = 1;
        const tableBody = document.getElementById('itemTableBody');
        
        if (!tableBody) {
            console.error('itemTableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const item = data[key];
                if (undercommandrole && !undercommandrole.includes(item.role)) {
                    continue; // Skip users not under command
                }
                if(item.role === 'cc' || item.role === 'clo'){
                    continue; // Skip CC and CLO from user list
                }
                const banumber = item.baNumber || '';
                const rank = item.rank || '';
                const name = item.name || '';
                const role = item.role || '';
                html += `<tr id="${banumber}" data-key="${key}">
                            <td>${serial}</td>
                            <td>${banumber}</td>
                            <td>${ranklist[rank] || rank}</td>
                            <td>${name}</td>
                            <td>${userrole[role] || role}</td>
                            <td><button class="delete-btn" id="delete-btn" data-key='${key}'>Delete</button></td>
                        </tr>`;
                serial += 1;
            }
        } else {
            html = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No inventory data available</td></tr>';
        }
        
        tableBody.innerHTML = html;
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                openEditModal(key);
            });
        });
        
        // Hide loading overlay after data is loaded
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById('itemTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #e53e3e;">Error loading data. Please refresh the page.</td></tr>';
        }
        // Hide loading overlay even on error
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}


function pendingApprovalCount() {
    const dbRef = ref(db, 'cloapproval/users/');
    get(dbRef).then((snapshot) => {
        const data = snapshot.val();
        let serial = 1;
        const tableBody = document.getElementById('itemTableBody');
        
        if (!tableBody) {
            console.error('itemTableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const item = data[key];
                const banumber = item.baNumber || '';
                const rank = item.rank || '';
                const name = item.name || '';
                const role = item.role || '';
                html += `<tr id="${banumber}" data-key="${key}">
                            <td>${serial}</td>
                            <td>${banumber}</td>
                            <td>${ranklist[rank] || rank}</td>
                            <td>${name}</td>
                            <td>${userrole[role] || role}</td>
                            <td>
                            <button class="approve-btn" id="approve-btn" data-key='${key}'>Approve</button>
                            <button class="delete-btn" id="reject-btn" data-key='${key}'>Reject</button>
                            </td>
                        </tr>`;
                serial += 1;
            }
        } else {
            html = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No inventory data available</td></tr>';
        }
        
        tableBody.innerHTML = html;
        tableBody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                approve(key);
            });
        });
        tableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                reject(key);
            });
        });
        // Hide loading overlay after data is loaded
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById('itemTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #e53e3e;">Error loading data. Please refresh the page.</td></tr>';
        }
        // Hide loading overlay even on error
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}
loaditemdata();
let mode='all';
document.getElementById('PendingUser')?.addEventListener('click', () => {
    if(mode==='all'){
        mode='pending';
        document.getElementById('PendingUser').textContent = 'View All Users';
        pendingApprovalCount();
    }
    else{
        mode='all';
        document.getElementById('PendingUser').textContent = 'View Pending Approvals';
        loaditemdata();
    }
});

function approve(key) {
    if(sessionStorage.getItem('role') === 'guest'){
        showNotification('Guests are not authorized to approve users.', 'error', 'Unauthorized Action');
        return;
    }
    const userRef = ref(db, 'cloapproval/users/' + key);
    get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            const newUserRef = ref(db, 'users/' + key);
            set(newUserRef, userData).then(() => {
                remove(userRef).then(() => {
                    showNotification('User approved successfully', 'success');
                    pendingApprovalCount();
                }).catch((error) => {
                    console.error('Error removing pending approval:', error);
                    showNotification('Error during approval process. Please try again.', 'error');
                });
            }).catch((error) => {
                console.error('Error adding approved user:', error);
                showNotification('Error during approval process. Please try again.', 'error');
            });
        } else {
            showNotification('User data not found for approval', 'error');
        }
    }).catch((error) => {
        console.error('Error fetching user data for approval:', error);
        showNotification('Error during approval process. Please try again.', 'error');
    });
}   

function reject(key) {
    if(sessionStorage.getItem('role') === 'guest'){
        showNotification('Guests are not authorized to reject users.', 'error', 'Unauthorized Action');
        return;
    }
    const userRef = ref(db, 'cloapproval/users/' + key);
    remove(userRef).then(() => {
        showNotification('User rejected successfully', 'success');
        pendingApprovalCount();
    }).catch((error) => {
        console.error('Error rejecting user:', error);
        showNotification('Error during rejection process. Please try again.', 'error');
    }   );
}   

function searchItems() {
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('itemTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const searchTerm = searchInput.value.toLowerCase();

    Array.from(rows).forEach(row => {
        const itemName = row.getAttribute('id');
        if (itemName && itemName.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        } 
    });
}

 

document.getElementById('itemTableBody')?.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'delete-btn') {
        const key = event.target.getAttribute('data-key');
        if (key) {
            deleteUser(key);
        } else {
            console.error('No key found for deletion');
        }
    }
});

function deleteUser(key) {
    if(sessionStorage.getItem('role') === 'guest'){
        showNotification('Guests are not authorized to delete users.', 'error', 'Unauthorized Action');
        return;
    }
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }   
    const userRef = ref(db, 'users/' + key);
    remove(userRef).then(() => {
        showNotification('User deleted successfully', 'success');
        loaditemdata();
    }).catch((error) => {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user. Please try again.', 'error');
    });
}

