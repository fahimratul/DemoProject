import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, get, ref, set, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { showNotification } from '../../js/notification.js';

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
const db = getDatabase(app);

// Global variables
let pendingIssuesData = {};
let unserviceableData = {};
let pendingChangesData = {};

window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const baNumber = sessionStorage.getItem('baNumber');
    const role_type = sessionStorage.getItem('role_type');
    
    if (!role_type || !baNumber) {
        alert('Session expired. Please log in again.');
        window.location.href = '../login.html';
        return;
    }
    
    console.log('Logged in as Storeman, BA Number:', baNumber);
    loadtotalitemdata();
    // Load all data
    loadAllPendingData();
    pendingnewitemdata();
    pendingnewtotalitemdata();
});
let ranklist ={
    snk:"Sainik",
    lcpl:"Lance Corporal",
    cpl:"Corporal",
    sgt:"Sergeant",
    wo:"Warrant Officer",
    swo:"Senior Warrant Officer",
    mwo:"Master Warrant Officer",
};
window.addEventListener('DOMContentLoaded', () => {
    const username=sessionStorage.getItem('username');
    const rank=sessionStorage.getItem('rank');
    const banumber=sessionStorage.getItem('baNumber');
    document.getElementById('username').textContent='Name: ' + username;
    document.getElementById('rank').textContent=ranklist[rank] ? 'Rank: ' + ranklist[rank] : 'Rank: ' + rank;
    document.getElementById('banumber').textContent='Army No: ' + banumber;
});
// Make this function globally available
window.loadAllPendingData = loadAllPendingData;

async function loadAllPendingData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';
    
    try {
        await Promise.all([
            loadPendingIssues(),
            loadUnserviceableItems()
        ]);
        
        updateSummaryCards();
        showNotification('Data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data. Please try again.', 'error');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

async function loadPendingIssues() {
    try {
        const dbRef = ref(db, 'issuepending/bknco/');
        const snapshot = await get(dbRef);
        pendingIssuesData = snapshot.val() || {};
        console.log('Pending Issues loaded:', pendingIssuesData);
        populatePendingIssuesTable();
    } catch (error) {
        console.error('Error loading pending issues:', error);
        pendingIssuesData = {};
    }
}

async function loadUnserviceableItems() {
    try {
        const dbRef = ref(db, 'unservicable_storeman/bknco/');
        const snapshot = await get(dbRef);
        unserviceableData = snapshot.val() || {};
        console.log('Unserviceable items loaded:', unserviceableData);
        populateUnserviceableTable();
    } catch (error) {
        console.error('Error loading unserviceable items:', error);
        populateUnserviceableTable();
    }
}
let dataCache = {};
function loadtotalitemdata() {
    let dbref =ref(db, 'bkncoinventory/main/');
    onValue(dbref, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            dataCache = data; // Cache the data for later use
        }
    },(error) => {
        console.error('Error loading total item data:', error);
    });
}


function pendingnewitemdata() {
    let dbRef =ref(db, 'officerapproval/new/bkncoinventory/');
    const newpendingitembody = document.getElementById('newpendingitem');
    const newitemTableBody = document.getElementById('newitemTableBody');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        let html = '';
        if (data) {
            document.getElementById('newpendingitemEmpty').style.display='none';
            let serial = 1;
            for (const key in data) {
                const item = data[key];
                const name = item.name || '';
                const authorized = item.authorized ?? '';
                const unit = item.unit || '';
                const total = item.total ?? 0;
                const servicable = item.servicable ?? 0;
                const unservicable = item.unservicable ?? 0;
                const issue = item.issue ?? 0;
                const instore = item.instore ?? 0;
                
                html += `<tr class="row-data" id="${name}" data-key="${key}" style="cursor: pointer;">
                            <td>${serial}</td>
                            <td>${name}</td>
                            <td>${unit}</td>
                            <td>${authorized}</td>
                            <td>${total}</td>
                            <td>${issue}</td>
                            <td>${instore}</td>
                            <td>${servicable}</td>
                            <td>${unservicable}</td>
                        </tr>`;
                serial += 1;
            }
            newitemTableBody.innerHTML = html;
        }
    },(error) => {
        console.error('Error loading pending new item data:', error);
    });
} 

function pendingnewtotalitemdata() {
    let dbRef =ref(db, 'officerapproval/newtotal/bkncoinventory/');
    const newpendingtotalitem = document.getElementById('newpendingtotalitem');
    const newitemtotalTableBody = document.getElementById('newitemtotalTableBody');

    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        let html = '';
        if (data) {
            document.getElementById('newpendingtotalitemEmpty').style.display='none';
            let serial = 1;
            for (const key in data) {
                console.log(key);
                const item = data[key];
                const name = item.name || '';
                const unit = item.unit || '';
                const authorized = item.authorized ?? '';
                const oldtotal = dataCache[key]?.total ?? 0;
                const newtotal = item.total ?? 0;
                html += `<tr class="row-data" id="${name}" data-key="${key}" style="cursor: pointer;">
                            <td>${serial}</td>
                            <td>${name}</td>
                            <td>${unit}</td>
                            <td>${authorized}</td>
                            <td>${oldtotal}</td>
                            <td>${newtotal}</td>
                        </tr>`;
                serial += 1;
            }
            newitemtotalTableBody.innerHTML = html;
        }
    },(error) => {
        console.error('Error loading pending new item data:', error);
    });
}


function populatePendingIssuesTable() {
    const tableBody = document.getElementById('pendingIssuesTableBody');
    const table = document.getElementById('pendingIssuesTable');
    const emptyState = document.getElementById('pendingIssuesEmpty');
    
    if (Object.keys(pendingIssuesData).length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    let html = '';
    let serial = 1;
    Object.keys(pendingIssuesData).forEach(key => {
        const request = pendingIssuesData[key];
        const itemsCount = request.items ? Object.keys(request.items).length : 0;
        
        // Calculate days pending
        const requestDate = new Date(request.date || Date.now());
        
        html += `
            <tr>
                <td>${serial++}</td>
                <td><strong>${request.voucherNumber || 'Pending'}</strong></td>
                <td>${request.location || 'N/A'}</td>
                <td>${formatDate(request.date)}</td>
                <td><span class="status-badge status-new">${itemsCount} items</span></td>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewPendingRequest('${key}')">
                            <i data-lucide="eye"></i> View
                        </button>
                        <button class="btn-small btn-reject" onclick="rejectRequest('${key}')">
                            <i data-lucide="x"></i> Reject
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    lucide.createIcons();
}

function populateUnserviceableTable() {
    const tableBody = document.getElementById('unserviceableTableBody');
    const table = document.getElementById('unserviceableTable');
    const emptyState = document.getElementById('unserviceableEmpty');
    
    if (Object.keys(unserviceableData).length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    let html = '';
    let serial = 1;
    Object.keys(unserviceableData).forEach(key => {
        const item = unserviceableData[key];
        const itemsCount = item.items ? Object.keys(item.items).length : 0;
        
        html += `
            <tr>
                <td>${serial++}</td>
                <td><strong>${item.voucherNumber}</strong></td>
                <td>${formatDate(item.issueDate)}</td>
                <td><span class="status-badge status-new">${itemsCount} items</span></td>
                <td><span class="status-badge status-urgent">Pending</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="viewUnserviceableItem('${key}')">
                            <i data-lucide="eye"></i> View
                        </button>
                        <button class="btn-small btn-reject" onclick="markAsDisposed('${key}')">
                            <i data-lucide="trash-2"></i> Cancel
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    lucide.createIcons();
}


function updateSummaryCards() {
    document.getElementById('pendingIssuesCount').textContent = Object.keys(pendingIssuesData).length;
    document.getElementById('unserviceableCount').textContent = Object.keys(unserviceableData).length;
    document.getElementById('pendingChangesCount').textContent = Object.keys(pendingChangesData).length;
    
    const totalCount = Object.keys(pendingIssuesData).length + 
                      Object.keys(unserviceableData).length + 
                      Object.keys(pendingChangesData).length;
    document.getElementById('totalCount').textContent = totalCount;
}




function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

window.viewPendingRequest = function(requestId) {
    // Navigate to the detailed pending issue page
    window.location.href = `pendingissueitem_storeman.html?key=${requestId}`;
};

window.rejectRequest = function(requestId) {
    if (confirm('Are you sure you want to reject this request?')) {
        const dbRef = ref(db, 'issuepending/bknco/' + requestId);
        remove(dbRef)
            .then(() => {
                showNotification('Request rejected successfully.', 'success');
                loadAllPendingData(); // Refresh the data
            })
            .catch((error) => {
                console.error('Error rejecting request:', error);
                showNotification('Error rejecting request. Please try again.', 'error');
            });
    }
};

window.viewUnserviceableItem = function(itemId) {
    // Navigate to the detailed unserviceable item page
    window.location.href = `pending_unservicable_storeman.html?key=${itemId}`;
};

window.markAsDisposed = function(itemId) {
    if (confirm('Are you sure you want to cancel this unserviceable item request?')) {
        const dbRef = ref(db, 'unservicable_storeman/bknco/' + itemId);
        remove(dbRef)
            .then(() => {
                showNotification('Unserviceable item request cancelled successfully.', 'success');  
                loadAllPendingData(); // Refresh the data
            })
            .catch((error) => {
                console.error('Error cancelling unserviceable item request:', error);
                showNotification('Error cancelling request. Please try again.', 'error');
            }); 
    }
};


function changePassword() {
    const baNumber = sessionStorage.getItem('baNumber');
    if (!baNumber) {
        console.error('BA Number not found in session storage.');
        window.location.href = 'index.html';return;
    }
    const currentPassword = document.getElementById('password').value;
    const newPassword = document.getElementById('new-password').value;    
    const confirmPassword = document.getElementById('confirm-password').value;
    if (newPassword !== confirmPassword) {
        showNotification("New passwords do not match", "error", "Validation Error");
        return;
    }
    if (newPassword.length < 6) {
        showNotification("New password must be at least 6 characters long", "error", "Validation Error");
        return;
    }
    const userRef = ref(db, 'users/' + baNumber);
    get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            if (userData.password !== currentPassword) {
                showNotification("Current password is incorrect", "error", "Validation Error");
                return;
            }
            update(userRef, { password: newPassword })
                .then(() => {
                    showNotification("Password changed successfully", "success", "Success");
                    sessionStorage.clear();
                    window.location.href = '../index.html';
                })
                .catch((error) => {
                    console.error("Error updating password:", error);
                    showNotification("Error updating password", "error", "Update Failed");
                });
        } else {
            showNotification("User data not found", "error", "Error");
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
        showNotification("Error fetching user data", "error", "Error");
    });
}

document.getElementById('passwordChangeSubmitBtn')?.addEventListener('click', changePassword);
