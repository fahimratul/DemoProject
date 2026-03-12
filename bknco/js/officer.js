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
    if( role_type !== 'officer' && role_type !== 'clo' && role_type !== 'cc'){ 
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
    
    // PDF functionality
    initializePDFButtons();
    
    // Issue Item functionality
    initializeIssueButton();
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
    sessionStorage.setItem('rank_proper', ranklist[rank] ? ranklist[rank] : rank);
    document.getElementById('banumber').textContent='BA Number: ' + banumber;
});


import {showNotification} from '../../js/notification.js';

console.log("Officer Script Loaded");

let dataCache = {};
let newitemCache = {};
let newtotalitemCache = {};

let currentEditKey = null;
const modal = document.getElementById('editModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const deleteItemBtn = document.getElementById('deleteItemBtn');
const editForm = document.getElementById('editForm');
const inputs = {
    name: document.getElementById('editName'),
    authorized: document.getElementById('editAuthorized'),
    unit: document.getElementById('editUnit'),
    total: document.getElementById('editTotal'),
    deleteitem: document.getElementById('deleteitem')
};

function loaditemdata() {
     
    let dbRef =ref(db, 'bkncoinventory/main/');

    const loadingOverlay = document.getElementById('loadingOverlay');

     onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        dataCache = data || {};
        let serial = 1;
        const tableBody = document.getElementById('itemTableBody');
        let datainfo={
            total:0,
            servicable:0,
            unservicable:0,
            issue:0,
            instore:0
        };
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
                const name = item.name || '';
                const unit = item.unit || '';
                const authorized = item.authorized ?? '';
                const total = item.total ?? 0;
                const servicable = item.servicable ?? 0;
                const unservicable = item.unservicable ?? 0;
                const issue = item.issue ?? 0;
                const instore = item.instore ?? 0;
                
                html += `<tr class="row-data" id="${name}" data-key="${key}" style="cursor: pointer;">
                            <td class="select-column" style="display: none;">
                                <input type="checkbox" class="row-select" data-key="${key}">
                            </td>
                            <td>${serial}</td>
                            <td>${name}</td>
                            <td>${unit}</td>
                            <td>${authorized}</td>
                            <td>${total}</td>
                            <td>${issue}</td>
                            <td>${instore}</td>
                            <td>${servicable}</td>
                            <td>${unservicable}</td>
                            <td>
                            <button class="edit-btn" data-key='${key}'>Edit</button>
                            </td>

                        </tr>`;
                serial += 1;
                datainfo.total+=total;
                datainfo.servicable+=servicable;
                datainfo.unservicable+=unservicable;
                datainfo.issue+=issue;
                datainfo.instore+=instore;
            }
        } else {
            html = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No inventory data available</td></tr>';
        }
        
        tableBody.innerHTML = html;
        document.getElementById('serial').textContent = serial-1;
        document.getElementById('totalItems').textContent = datainfo.total;
        document.getElementById('servicableItems').textContent = datainfo.servicable;
        document.getElementById('unservicableItems').textContent = datainfo.unservicable;
        document.getElementById('issuedItems').textContent = datainfo.issue;
        document.getElementById('inStoreItems').textContent = datainfo.instore;
            
        // Attach edit handlers
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(isSelectionMode) return;
                if(role === 'guest'){
                    showNotification('You do not have permission to edit items.', 'error', 'Access Denied');
                    return;
                }
                const key = btn.dataset.key;
                console.log("Edit button clicked for key:", key);
                openEditModal(key);
            });
        });

        tableBody.querySelectorAll('.row-data').forEach(row => {
            row.addEventListener('click', (e) => {
                if(isSelectionMode){
                    const checkbox = row.querySelector('.row-select');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        updateRowSelection(checkbox);
                        updatePrintButtonStates();
                    }
                }
                else{
                    if (e.target.classList.contains('edit-btn')) {
                        openEditModal(key);
                    }
                    if (e.target.classList.contains('row-select') || e.target.classList.contains('select-column')){
                        return;
                    }
                    const key = row.dataset.key;
                    console.log("Row clicked for key:", key);
                    window.location.href = `itemdetails.html?key=${key}&type=engr`;    
                }
            });
        });


        // Hide loading overlay after data is loaded
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
        
        // Update filter button states with counts
        updateFilterButtonStates();
    }, (error) => {
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
        
        // Update filter button states even on error
        updateFilterButtonStates();
    });
}


function pendingnewitemdata() {
    let dbRef =ref(db, 'officerapproval/new/bkncoinventory/');
    const newpendingitembody = document.getElementById('newpendingitem');
    const newitemTableBody = document.getElementById('newitemTableBody');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        newitemCache = data || {};
        let html = '';
        if (data) {
            let serial = 1;
            newpendingitembody.style.display='flex';
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
                            <td>
                            <button class="approve-btn" data-key='${key}'>Accept</button>
                            <button class="reject-btn" data-key='${key}'>Reject</button>
                            </td>

                        </tr>`;
                serial += 1;
            }

        }
        else {
            newpendingitembody.style.display='none';
        }
        newitemTableBody.innerHTML = html;

        newitemTableBody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                console.log('Approved new item with key:', key);
                approveNewItem(key); 
            });
        });
        newitemTableBody.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                console.log('Rejected new item with key:', key);
                rejectNewItem(key);
            });
        });


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
        newtotalitemCache = data || {};
        let html = '';
        if (data) {
            let serial = 1;
            newpendingtotalitem.style.display='flex';
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
                            <td>
                            <button class="approve-btn" data-key='${key}'>Accept</button>
                            <button class="reject-btn" data-key='${key}'>Reject</button>
                            </td>
                        </tr>`;
                serial += 1;
            }
            newitemtotalTableBody.innerHTML = html;
        }
        else {
            newpendingtotalitem.style.display='none';
        }

        newitemtotalTableBody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                console.log('Approved new item with key:', key);
                approveNewtotalItem(key); 
            });
        });
        newitemtotalTableBody.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                console.log('Rejected new item with key:', key);
                rejectNewtotalItem(key);
            });
        });


    },(error) => {
        console.error('Error loading pending new item data:', error);
    });
} 


function approveNewtotalItem(key) {
    const currentItem = newtotalitemCache[key] || {};
    if (!currentItem) return;
    
       const total = dataCache[key]?.issue || 0;
    const newinstore = currentItem.total - total;
    const newservicable = newinstore - (dataCache[key]?.unservicable || 0);

    update(ref(db, 'bkncoinventory/main/' + key), {
        name: currentItem.name || '',
        unit: currentItem.unit || '',
        authorized: currentItem.authorized || '',
        total: currentItem.total || 0,
        instore: newinstore,
        servicable: newservicable
    }).then(() => {
        console.log('New total item approved and updated in inventory');
        remove(ref(db, 'officerapproval/newtotal/bkncoinventory/' + key)).then(() => {
            console.log('New total item request removed from pending approvals');
            pendingnewtotalitemdata();
            loaditemdata();
            showNotification('New total inventory item approved and updated successfully.', 'success', 'Item Approved');
        }).catch((error) => {
            console.error('Error removing new total item request from pending approvals:', error);
        });
    }).catch((error) => {
        console.error('Error approving new total item:', error);
    });
    set(ref(db, 'clo_cc_notification/' + Date.now()), {
        from: 'BK NCO Inventory',
        msg: `BK NCO Inventory item "${currentItem.name || ''}" total has been updated by ${sessionStorage.getItem('username')} (BA Number: ${sessionStorage.getItem('baNumber')}).`,
        date: new Date().toLocaleString()
    }).then(() => {
        console.log('CLO/CC notified successfully about the update.');
    }).catch((error) => {
        console.error('Error notifying CLO/CC about the update:', error);
    });
    
    set(ref(db, 'clonotification'), true);
}



function rejectNewtotalItem(key) {
    remove(ref(db, 'officerapproval/newtotal/bkncoinventory/' + key)).then(() => {
        console.log('New total item request rejected and removed from pending approvals');
        pendingnewtotalitemdata();
        showNotification('New total inventory item request rejected successfully.', 'info', 'Item Rejected');
    }).catch((error) => { 
        console.error('Error rejecting new total item request:', error);
    });
}


function approveNewItem(key) {
    const newItem = newitemCache[key];
    if (!newItem) return;
    set(ref(db, 'bkncoinventory/main/' + key), newItem).then(() => {
        console.log('New item approved and added to inventory');
        remove(ref(db, 'officerapproval/new/bkncoinventory/' + key)).then(() => {
            console.log('New item request removed from pending approvals');
            pendingnewitemdata();
            loaditemdata();
            showNotification('New inventory item approved and added successfully.', 'success', 'Item Approved');
        }).catch((error) => {
            console.error('Error removing new item request from pending approvals:', error);
        });
    }).catch((error) => {
        console.error('Error approving new item:', error);
    });
    set(ref(db, 'clo_cc_notification/' + Date.now()), {
        from: 'BK NCO Inventory',
        msg: `New BK NCO Inventory item "${newItem.name || ''}" has been added by ${sessionStorage.getItem('username')} (BA Number: ${sessionStorage.getItem('baNumber')}).`,
        date: new Date().toLocaleString()
    }).then(() => {
        console.log('CLO/CC notified successfully about the new item.');
    }).catch((error) => {
        console.error('Error notifying CLO/CC about the new item:', error);
    });
    set(ref(db, 'clonotification'), true);
}

function rejectNewItem(key) {
    remove(ref(db, 'officerapproval/new/bkncoinventory/' + key)).then(() => {
        console.log('New item request rejected and removed from pending approvals');
        pendingnewitemdata();
        showNotification('New inventory item request rejected successfully.', 'info', 'Item Rejected');
    }).catch((error) => {
        console.error('Error rejecting new item request:', error);
    });
}


function newPendingItemNotification(){
    const fixedNotification = document.getElementById('fixednotification');
    fixedNotification.style.display = 'flex';

    onValue(ref(db, 'issuepending/bknco/'), (snapshot) => {
        if(snapshot.exists()){
            let html = fixedNotification.innerHTML;
            const id = Date.now();
            html += `<div class="notification-content" id="pending_${id}">
            <p id="notificationMessage"> You have a new <strong> Pending Issue item </strong>  From BK NCO.</p>
            <button class="notification-close" onclick="hidefixedNotification('pending_${id}')" aria-label="Close">&times;</button>
            <button class="notification-view" id="viewPendingBtn" onclick="window.location.href='pendingIssue.html'">View</button>
        </div>`
        fixedNotification.innerHTML = html;
        }
    });
    onValue(ref(db, 'issuepending/eo/'), (snapshot) => {
        if(snapshot.exists()){
            let html = fixedNotification.innerHTML;
            const id = Date.now();
            html += `<div class="notification-content" id="pending_${id}">
            <p id="notificationMessage"> You have a new <strong> Pending Issue item </strong>  to issue From Engr Inventory.</p>
            <button class="notification-close" onclick="hidefixedNotification('pending_${id}')" aria-label="Close">&times;</button>
            <button class="notification-view" id="viewPendingBtn" onclick="window.location.href='./../engr/pendingIssue.html'">View</button>
        </div>`
        fixedNotification.innerHTML = html;
        }
    });
    onValue(ref(db, 'unservicable_storeman/bknco/'), (snapshot) => {
        if(snapshot.exists()){
            let html = fixedNotification.innerHTML;
            const id = Date.now();
            html += `<div class="notification-content" id="pending_${id}">
            <p id="notificationMessage">You have a new <strong>Unserviceable</strong> item From BK NCO.</p>
            <button class="notification-close" onclick="hidefixedNotification('pending_${id}')" aria-label="Close">&times;</button>
            <button class="notification-view" id="viewPendingBtn" onclick="window.location.href='pendingunsvc.html'">View</button>
        </div>`
        fixedNotification.innerHTML = html;
        }
    });
    onValue(ref(db, 'unservicable_storeman/eo/'), (snapshot) => {
        if(snapshot.exists()){
            let html = fixedNotification.innerHTML;
            const id = Date.now();
            html += `<div class="notification-content" id="pending_${id}">
            <p id="notificationMessage">You have a new <strong>Unserviceable</strong> item From Engr Inventory.</p>
            <button class="notification-close" onclick="hidefixedNotification('pending_${id}')" aria-label="Close">&times;</button>
            <button class="notification-view" id="viewPendingBtn" onclick="window.location.href='./../engr/pendingunsvc.html'">View</button>
        </div>`
        fixedNotification.innerHTML = html;
        }
    });
    

}

function loadreturnnotification(){
    const returnnotification = document.getElementById('returnnotification');
    onValue(ref(db, 'notification/eo/'), (snapshot) => {
        const notificationData = snapshot.val();
        if(notificationData){
            let html = '';
            for(const key in notificationData){
                const notification = notificationData[key];
                const message = notification.msg || '';
                const date = notification.date || '';
                const form = notification.form || '';
                html += `<div class="msgbody" id="notification_${key}">
                            <h2> ${form}</h2>
                            <p> ${message}</p>
                            <p> ${date}</p>
                            <button class="ack-btn" onclick="acknowledgeNotification('${key}')"> Ack</button>
                        </div>`;   
            }
            returnnotification.innerHTML = html;
        }
    });
}
function acknowledgeNotification(key){
    remove(ref(db, `notification/eo/${key}`)).then(() => {
        console.log('Notification acknowledged and removed.');
        document.getElementById(`notification_${key}`).remove();
    }).catch((error) => {
        console.error('Error acknowledging notification:', error);
    });
}

window.acknowledgeNotification = acknowledgeNotification;


if(role==='eo'){
    pendingnewitemdata();
    setTimeout(() => {
        pendingnewtotalitemdata();
    }, 1000);
    newPendingItemNotification();
    loadreturnnotification();
}
else{
    document.getElementById('newpendingitem').style.display='none';
    document.getElementById('newpendingtotalitem').style.display='none';
}



loaditemdata();



// Filter state
let activeFilters = {
    showWithIssues: false,
    showWithUnserviceable: false
};

function filterItems(scrollToInput = true) {
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('itemTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const searchTerm = searchInput.value.toLowerCase();

    Array.from(rows).forEach(row => {
        const itemName = row.getAttribute('id');
        const key = row.getAttribute('data-key');
        
        // Check search term
        let matchesSearch = !searchTerm || (itemName && itemName.toLowerCase().includes(searchTerm));
        
        // Check filters if item exists in cache
        let matchesFilters = true;
        if (key && dataCache[key]) {
            const item = dataCache[key];
            const issue = item.issue ?? 0;
            const unserviceable = item.unservicable ?? 0;
            
            // Apply issue filter
            if (activeFilters.showWithIssues && issue <= 0) {
                matchesFilters = false;
            }
            
            // Apply unserviceable filter
            if (activeFilters.showWithUnserviceable && unserviceable <= 0) {
                matchesFilters = false;
            }
        }
        
        // Show/hide row based on search and filters
        if (matchesSearch && matchesFilters) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update filter button states
    updateFilterButtonStates();
    const targetElement = document.getElementById('searchInput');
    if (targetElement && scrollToInput) {
        targetElement.scrollIntoView({
        behavior: 'smooth' // Makes the scroll transition smooth
    });
    }
}

function updateFilterButtonStates() {
    const issueBtn = document.getElementById('filterIssued');
    const unserviceableBtn = document.getElementById('filterUnserviceable');
    const clearBtn = document.getElementById('clearFilters');
    const filterStatus = document.getElementById('filterStatus');
    
    // Count items
    const counts = countFilteredItems();
    const visibleCount = countVisibleItems();
    
    if (issueBtn) {
        if (activeFilters.showWithIssues) {
            issueBtn.classList.add('active');
            issueBtn.style.backgroundColor = '#4CAF50';
            issueBtn.style.color = 'white';
        } else {
            issueBtn.classList.remove('active');
            issueBtn.style.backgroundColor = '';
            issueBtn.style.color = '';
        }
    }
    
    if (unserviceableBtn) {
        if (activeFilters.showWithUnserviceable) {
            unserviceableBtn.classList.add('active');
            unserviceableBtn.style.backgroundColor = '#f44336';
            unserviceableBtn.style.color = 'white';
        } else {
            unserviceableBtn.classList.remove('active');
            unserviceableBtn.style.backgroundColor = '';
            unserviceableBtn.style.color = '';
        }
    }
    
    // Update filter status line
    if (filterStatus) {
        if (visibleCount === counts.total) {
            filterStatus.textContent = `Showing all ${counts.total} items`;
        } else {
            filterStatus.textContent = `Showing ${visibleCount} items out of ${counts.total} total`;
        }
    }
}

function countFilteredItems() {
    let total = 0;
    let withIssues = 0;
    let withUnserviceable = 0;
    
    // Count from dataCache to get accurate totals
    if (dataCache) {
        for (const key in dataCache) {
            const item = dataCache[key];
            total++;
            
            const issue = item.issue ?? 0;
            const unserviceable = item.unservicable ?? 0;
            
            if (issue > 0) {
                withIssues++;
            }
            
            if (unserviceable > 0) {
                withUnserviceable++;
            }
        }
    }
    
    return {
        total: total,
        withIssues: withIssues,
        withUnserviceable: withUnserviceable
    };
}

function countVisibleItems() {
    const tableBody = document.getElementById('itemTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let visibleCount = 0;
    
    Array.from(rows).forEach(row => {
        if (row.style.display !== 'none') {
            visibleCount++;
        }
    });
    
    return visibleCount;
}

function toggleIssueFilter() {
    activeFilters.showWithIssues = !activeFilters.showWithIssues;
    filterItems();

}

function toggleUnserviceableFilter() {
    activeFilters.showWithUnserviceable = !activeFilters.showWithUnserviceable;
    filterItems();
}

function clearAllFilters() {
    activeFilters.showWithIssues = false;
    activeFilters.showWithUnserviceable = false;
    document.getElementById('searchInput').value = '';
    filterItems();
}
function unservicableleFilter() {
    clearAllFilters();
    activeFilters.showWithUnserviceable = true;
    filterItems();
}
function issueFilter() {
    clearAllFilters();
    activeFilters.showWithIssues = true;
    filterItems();
}

// Event listeners
document.getElementById('searchInput')?.addEventListener('keyup', () => filterItems(false));
document.getElementById('filterIssued')?.addEventListener('click', toggleIssueFilter);
document.getElementById('filterUnserviceable')?.addEventListener('click', toggleUnserviceableFilter);
document.getElementById('clearFilters')?.addEventListener('click', clearAllFilters);
document.getElementById('totalItemsDiv')?.addEventListener('click', clearAllFilters);
document.getElementById('unservicableitemsDiv')?.addEventListener('click', unservicableleFilter);
document.getElementById('issuedItemsDiv')?.addEventListener('click', issueFilter);


function openEditModal(key) {
    const item = dataCache?.[key];
    if (!item) return;
    currentEditKey = key;
    inputs.name.value = item.name || '';
    inputs.authorized.value = item.authorized ?? '';
    inputs.unit.value = item.unit || '';
    inputs.total.value = item.total ?? 0;
    modal.classList.remove('hidden');
}

function closeEditModal() {
    modal.classList.add('hidden');
    currentEditKey = null;
    editForm.reset();
    inputs.total.value = '';
}

modalCloseBtn?.addEventListener('click', closeEditModal);
cancelEditBtn?.addEventListener('click', closeEditModal);
modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
});

editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentEditKey) return;
    const issue = dataCache[currentEditKey]?.issue || 0;
    const newinstore = (parseInt(inputs.total.value, 10) || 0) - issue;
    const newservicable = newinstore - (dataCache[currentEditKey]?.unservicable || 0);
    const updated = {
        ...dataCache[currentEditKey],
        name: inputs.name.value.trim(),
        authorized: parseInt(inputs.authorized.value, 10) || 0,
        unit: inputs.unit.value.trim(),
        total: parseInt(inputs.total.value, 10) || 0,
        instore: newinstore,
        servicable: newservicable
    };
    update(ref(db, 'bkncoinventory/main/' + currentEditKey), updated)
        .then(() => {
            console.log('Data updated successfully');
            showNotification('Inventory item updated successfully.', 'success', 'Update Successful');
            loaditemdata();
        })
        .catch((error) => {
            console.error('Error updating data:', error);
            showNotification('Error updating item. Please try again.', 'error', 'Update Failed');
        });

        set(ref(db, 'clo_cc_notification/' + Date.now()), {
            from: 'BK NCO Inventory',
            date: new Date().toLocaleString(),
            msg: `BK NCO Inventory item "${inputs.name.value.trim()}" has been updated by ${sessionStorage.getItem('username')} (BA Number: ${sessionStorage.getItem('baNumber')}).`
        }).then(() => {
            console.log('CLO/CC notified successfully about the update.');
        }).catch((error) => {
            console.error('Error notifying CLO/CC about the update:', error);
        });
        
    set(ref(db, 'clonotification'), true);
    closeEditModal();
});

deleteItemBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentEditKey) return;
    if (inputs.deleteitem.value.trim() !== 'CONFIRM') {
        showNotification("To delete the item, please type 'CONFIRM' in the delete field.", "error", "Deletion Failed");
        return;
    }
    
    remove(ref(db, 'bkncoinventory/main/' + currentEditKey))
    .then(() => {
        console.log('Data deleted successfully');
        showNotification('Inventory item is pending for deletion.', 'success', 'Deletion Successful');
        loaditemdata();
    })
    .catch((error) => {
        console.error('Error deleting data:', error);
        showNotification('Error deleting item. Please try again.', 'error', 'Deletion Failed');
    });
    closeEditModal();
    remove(ref(db, 'bkncoinventory/' + currentEditKey)).then(() => {
        console.log('Item deleted from inventory');
    }).catch((error) => {
        console.error('Error deleting item from inventory:', error);
    });
    set(ref(db, 'clo_cc_notification/' + Date.now()), {
        from: 'BK NCO Inventory',
        date: new Date().toLocaleString(),
        msg: `BK NCO Inventory item "${inputs.name.value.trim()}" has been deleted by ${sessionStorage.getItem('username')} (BA Number: ${sessionStorage.getItem('baNumber')}).`
    }).then(() => {
        console.log('CLO/CC notified successfully about the deletion.');
    }).catch((error) => {
        console.error('Error notifying CLO/CC about the deletion:', error);
    });   
});

const logoutButton = document.getElementById('logoutButton');

logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('baNumber');
    sessionStorage.removeItem('role_type');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('rank');
    window.location.href = './../index.html';
});

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


let isSelectionMode = false;


function initializePDFButtons() {
    const printAllBtn = document.getElementById('printAllTable');
    const printSelectedBtn = document.getElementById('printSelectedRows');
    const toggleSelectBtn = document.getElementById('toggleSelectMode');
    const selectAllCheckbox = document.getElementById('selectAll');

    if (printAllBtn) {
        printAllBtn.addEventListener('click', printAllTable);
    }
    
    if (printSelectedBtn) {
        printSelectedBtn.addEventListener('click', printSelectedRows);
    }
    
    if (toggleSelectBtn) {
        toggleSelectBtn.addEventListener('click', toggleSelectionMode);
    }
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.row-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateRowSelection(checkbox);
            });
            updatePrintButtonStates();
        });
    }
}

function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    const selectColumns = document.querySelectorAll('.select-column');
    const selectColumnHeader = document.getElementById('selectColumnHeader');
    const toggleBtn = document.getElementById('toggleSelectMode');
    const printSelectedBtn = document.getElementById('printSelectedRows');
    
    if (isSelectionMode) {
        selectColumns.forEach(col => col.style.display = 'table-cell');
        if (selectColumnHeader) selectColumnHeader.style.display = 'table-cell';
        toggleBtn.innerHTML = '<i data-lucide="x-square"></i> Cancel Select';
        printSelectedBtn.style.display = 'flex';
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateRowSelection(this);
                updatePrintButtonStates();
            });
        });
    } else {
        selectColumns.forEach(col => col.style.display = 'none');
        if (selectColumnHeader) selectColumnHeader.style.display = 'none';
        toggleBtn.innerHTML = '<i data-lucide="check-square"></i> Select Rows';
        printSelectedBtn.style.display = 'none';
        
        // Clear all selections
        document.querySelectorAll('.row-select').forEach(checkbox => {
            checkbox.checked = false;
            updateRowSelection(checkbox);
        });
        document.getElementById('selectAll').checked = false;
    }
    
    // Re-initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    updatePrintButtonStates();
}

function updateRowSelection(checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        row.classList.add('row-selected');
    } else {
        row.classList.remove('row-selected');
    }
}

function updatePrintButtonStates() {
    const selectedCheckboxes = document.querySelectorAll('.row-select:checked');
    const printSelectedBtn = document.getElementById('printSelectedRows');
    
    if (printSelectedBtn) {
        printSelectedBtn.disabled = selectedCheckboxes.length === 0;
    }
}

function printAllTable() {
    const baNumber = sessionStorage.getItem('baNumber');
    const tableBody = document.getElementById('itemTableBody');
    
    if (!tableBody || tableBody.rows.length === 0) {
        alert('No data available to print.');
        return;
    }
    
    // Get summary data
    const serial = document.getElementById('serial').textContent || '0';
    const totalItems = document.getElementById('totalItems').textContent || '0';
    const servicableItems = document.getElementById('servicableItems').textContent || '0';
    const unservicableItems = document.getElementById('unservicableItems').textContent || '0';
    const issuedItems = document.getElementById('issuedItems').textContent || '0';
    const inStoreItems = document.getElementById('inStoreItems').textContent || '0';
    
    // Build table rows
    let tableRows = '';
    for (let i = 0; i < tableBody.rows.length; i++) {
        const row = tableBody.rows[i];
        const cells = row.cells;
        
        // Skip the checkbox column (first column) if it exists
        const startIndex = cells[0].classList.contains('select-column') ? 1 : 0;
        
        tableRows += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 1].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 2].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 3].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 4].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 5].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 6].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 7].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 8].textContent}</td>
            </tr>
        `;
    }
    
    printReport(tableRows, 'All Inventory Items', {
        serial,
        totalItems,
        servicableItems,
        unservicableItems,
        issuedItems,
        inStoreItems
    });
}

function printSelectedRows() {
    const baNumber = sessionStorage.getItem('baNumber');
    const selectedCheckboxes = document.querySelectorAll('.row-select:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one row to print.');
        return;
    }
    
    let tableRows = '';
    let totals = {
        serial: 1,
        total: 0,
        servicable: 0,
        unservicable: 0,
        issued: 0,
        inStore: 0
    };
    
    selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const cells = row.cells;
        
        // Skip the checkbox column (first column)
        const startIndex = 1;
        
        // Add to totals
        totals.serial += 1;
        totals.total += parseInt(cells[startIndex + 3].textContent) || 0;
        totals.issued += parseInt(cells[startIndex + 4].textContent) || 0;
        totals.inStore += parseInt(cells[startIndex + 5].textContent) || 0;
        totals.servicable += parseInt(cells[startIndex + 6].textContent) || 0;
        totals.unservicable += parseInt(cells[startIndex + 7].textContent) || 0;
        
        tableRows += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 1].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 2].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 3].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 4].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 5].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 6].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 7].textContent}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${cells[startIndex + 8].textContent}</td>
            </tr>
        `;
    });
    
    printReport(tableRows, `Selected Inventory Items (${selectedCheckboxes.length} items)`, {
        serial: totals.serial,
        totalItems: totals.total,
        servicableItems: totals.servicable,
        unservicableItems: totals.unservicable,
        issuedItems: totals.issued,
        inStoreItems: totals.inStore
    });
}

function printReport(tableRows, title, summaryData) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Report - ${title}</title>
            <style>
                @media print {
                    @page {
                        margin: 0.5in;
                        size: landscape;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #333;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                    }
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    margin: 0;
                    color: #007bff;
                    font-size: 24px;
                }
                
                .header h2 {
                    margin: 10px 0;
                    color: #333;
                    font-size: 20px;
                }
                
                .header p {
                    margin: 10px 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .summary {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }
                
                .summary-item {
                    text-align: center;
                    padding: 10px;
                    background-color: white;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .summary-value {
                    font-weight: bold;
                    font-size: 18px;
                }
                
                .summary-label {
                    font-size: 12px;
                    color: #666;
                }
                
                .total { color: #007bff; }
                .servicable { color: #28a745; }
                .unservicable { color: #dc3545; }
                .issued { color: #ffc107; }
                .instore { color: #17a2b8; }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                
                th {
                    padding: 10px;
                    text-align: left;
                    border: 1px solid #ddd;
                    background-color: #007bff;
                    color: white;
                    font-weight: 600;
                }
                
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                
                tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 12px;
                    color: #666;
                }
                
                @media print {
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>BANRDB Store Management System</h1>
                <h2>${title}</h2>
                <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-value total">${summaryData.serial}</div>
                    <div class="summary-label">Total Type of Items</div>
                </div>

                <div class="summary-item">
                    <div class="summary-value total">${summaryData.totalItems}</div>
                    <div class="summary-label">Total Items</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value servicable">${summaryData.servicableItems}</div>
                    <div class="summary-label">Serviceable</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value unservicable">${summaryData.unservicableItems}</div>
                    <div class="summary-label">Unserviceable</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value issued">${summaryData.issuedItems}</div>
                    <div class="summary-label">Issued</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value instore">${summaryData.inStoreItems}</div>
                    <div class="summary-label">In Store</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Serial</th>
                        <th>Nomenclature/Name</th>
                        <th>Measurement Unit</th>
                        <th>Authorized</th>
                        <th>Held</th>
                        <th>Issued</th>
                        <th>In Store</th>
                        <th>Serviceable</th>
                        <th>Unserviceable</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="footer">
                <p>BANRDB Store Management System - Engineering Inventory Report</p>
                <p>This report was generated automatically on ${currentDate}</p>
            </div>
            
            <script>
                // Auto-print when page loads
                window.onload = function() {
                    window.print();
                    // Close window after printing (optional)
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Show success notification
    if (typeof showNotification === 'function') {
        showNotification('Print dialog opened successfully!', 'success', 'Print Ready');
    }
}

// Issue Item functionality
function initializeIssueButton() {
    const issueItemBtn = document.getElementById('issueItemBtn');
    
    if (issueItemBtn) {
        issueItemBtn.addEventListener('click', function() {
            console.log('Issue Item button clicked');
            window.location.href = 'issueitem.html';
        });
    }
}
