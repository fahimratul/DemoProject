import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase,set, get, ref, update , onValue} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


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
let itemKey = null;
let typeKey = null;
let role = sessionStorage.getItem('role');

window.addEventListener('DOMContentLoaded', () => {
    let baNumber = sessionStorage.getItem('baNumber');
    if (!baNumber) {
        console.error('BA Number not found in local storage.');
        window.location.href = 'index.html';
        return;
    }

    console.log('Logged in as BA Number:', baNumber);
});
 


import {showNotification} from './notification.js';
console.log("Script Loaded");

let dataCache = {};
let currentEditKey = null;



function loaditemsdetails() {
    const urlparams = new URLSearchParams(window.location.search);
    itemKey = urlparams.get('key');
    typeKey = urlparams.get('type');
    console.log('Item Key:', itemKey);
    console.log('Type Key:', typeKey);
    let dbRef ;
    if(typeKey === 'engrnco'){
        dbRef = ref(db, `engrinventory/`+ itemKey);
    }
    else if(typeKey === 'signco'){
        dbRef = ref(db, `siginventory/`+ itemKey);
    }
    else if(typeKey === 'bknco'){
        dbRef = ref(db, `bkncoinventory/`+ itemKey);
    }
    else if (typeKey === 'bqms'){
        dbRef = ref(db, `bqmsinventory/`+ itemKey);
    }
    else if( typeKey === 'mtnco' || typeKey === 'mtjco'){
        dbRef = ref(db, `mtinventory/`+ itemKey);
    }
    else{
        console.error('Invalid type key:', typeKey);
        return;
    }
    const loadingOverlay = document.getElementById('loadingOverlay');
    get(dbRef).then((snapshot) => {
        dataCache = snapshot.val();
        
        if (dataCache) {
            console.log('Vehicle Data:', dataCache);
            document.getElementById('typeofitem').textContent = dataCache.name || 'N/A';
            document.getElementById('authorized').textContent = dataCache.authorized || 'N/A';
            document.getElementById('held').textContent = dataCache.total;
            document.getElementById('issued').textContent = dataCache.issue;
            document.getElementById('instore').textContent = dataCache.instore;
            document.getElementById('servicable').textContent = dataCache.servicable;
            document.getElementById('unservicable').textContent = dataCache.unservicable;
        } else {
            console.log('No vehicle data available');
        }      
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}



loaditemsdetails();

let itemhistoryCache = {};
function loaditemhistory() {
let dbRef ;
    if(typeKey === 'engrnco'){
        dbRef = ref(db, `engrinventory/`+ itemKey + `/history`);
    }
    else if(typeKey === 'signco'){
        dbRef = ref(db, `siginventory/`+ itemKey + `/history`);
    }
    else if(typeKey === 'bknco'){
        dbRef = ref(db, `bkncoinventory/`+ itemKey + `/history`);
    }
    else if (typeKey === 'bqms'){
        dbRef = ref(db, `bqmsinventory/`+ itemKey + `/history`);
    }
    else if( typeKey === 'mtnco' || typeKey === 'mtjco'){
        dbRef = ref(db, `mtinventory/`+ itemKey + `/history`);
    }
    else{
        console.error('Invalid type key:', typeKey);
        return;
    }
    const loadingOverlay = document.getElementById('loadingOverlay');
        onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        itemhistoryCache = data || {};
        const tableBody = document.getElementById('history-tbody');
        
        if (!tableBody) {
            console.error('History TableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const record = data[key];
                console.log('History Record:', record, key);
                html += `<tr>
                    <td>${key}</td>
                    <td>${record.date || ''}</td>
                    <td>${record.location || ''}</td>
                    <td>${record.quantity || ''}</td>`
                if(record.returned){
                    html += `<td>Returned</td>`;
                }
                else{
                    html += `<td><button class="edit-btn" data-key="${key}">Return to Store</button></td>`;
                }
                html += `</tr>`;
            }
        } else {
            html = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No history data available</td></tr>';
            console.log('No history data available');
        }
        tableBody.innerHTML = html; 
        // Attach event listeners to edit buttons
        const editButtons = tableBody.querySelectorAll('.edit-btn');
        editButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                const recordKey = e.target.getAttribute('data-key');
                returnItemToStore(recordKey);
            });
        });   
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}


loaditemhistory();
let itemunsvccache = {};
function loaditemunsvc() {
let dbRef ;
    if(typeKey === 'engrnco'){
        dbRef = ref(db, `engrinventory/`+ itemKey + `/unsvc`);
    }
    else if(typeKey === 'signco'){
        dbRef = ref(db, `siginventory/`+ itemKey + `/unsvc`);
    }
    else if(typeKey === 'bknco'){
        dbRef = ref(db, `bkncoinventory/`+ itemKey + `/unsvc`);
    }
    else if (typeKey === 'bqms'){
        dbRef = ref(db, `bqmsinventory/`+ itemKey + `/unsvc`);
    }
    else if( typeKey === 'mtnco' || typeKey === 'mtjco'){
        dbRef = ref(db, `mtinventory/`+ itemKey + `/unsvc`);
    }
    else{
        console.error('Invalid type key:', typeKey);
        return;
    }
    const loadingOverlay = document.getElementById('loadingOverlay');
        onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        itemunsvccache = data || {};
        const tableBody = document.getElementById('unsvc-history-tbody');
        
        if (!tableBody) {
            console.error('History TableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const record = data[key];
                console.log('History Record:', record, key);
                html += `<tr>
                    <td>${key}</td>
                    <td>${record.date || ''}</td>
                    <td>${record.reason || ''}</td>
                    <td>${record.quantity || ''}</td>`
                if(record.markedsvc){
                    html += `<td>Serviceable now</td>`;
                }
                else{
                    html += `<td><button class="edit-btn" data-key="${key}">Mark as Serviceable</button></td>`;
                }
                html += `</tr>`;
            }
        } else {
            html = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No history data available</td></tr>';
        }
        tableBody.innerHTML = html; 
        // Attach event listeners to edit buttons
        const editButtons = tableBody.querySelectorAll('.edit-btn');
        editButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                const recordKey = e.target.getAttribute('data-key');
                markAsServiceable(recordKey);
            });
        });   
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}


loaditemunsvc();

const issuemodal = document.getElementById('issueModal');
const issueModalCloseBtn = document.getElementById('issueModalCloseBtn');
const cancelIssueBtn = document.getElementById('cancelIssueBtn');
const issueForm = document.getElementById('issueForm');
const issueitembtn = document.getElementById('issueitem');


function openIssueModal() {
    document.getElementById('issuedate').valueAsDate = new Date();
    issuemodal.classList.remove('hidden');
}

issueitembtn.addEventListener('click', () => {
    openIssueModal();
});

function closeIssueModal() {
    issuemodal.classList.add('hidden');
}

issueModalCloseBtn.addEventListener('click', closeIssueModal);
cancelIssueBtn.addEventListener('click', closeIssueModal);


function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

issueForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = formatDate(document.getElementById('issuedate').value);
    const person = document.getElementById('issueperson').value;
    const location = document.getElementById('issuelocation').value;
    const quantity = parseInt(document.getElementById('issuequantity').value, 10);
    if (quantity > dataCache.instore) {
        showNotification('Error: Quantity exceeds instore amount', 'error');
        return;
    }
    const newissue = (dataCache.issue || 0) + quantity;
    const newInstore = (dataCache.instore || 0) - quantity;
    let dbRef ;
    let path;
    if(typeKey === 'engrnco'){
        path = `engrinventory/`+ itemKey;
    }
    else if(typeKey === 'signco'){
        path = `siginventory/`+ itemKey;
    }
    else if(typeKey === 'bknco'){
        path = `bkncoinventory/`+ itemKey;
    }
    else if (typeKey === 'bqms'){
        path = `bqmsinventory/`+ itemKey;
    }
    else if( typeKey === 'mtnco' || typeKey === 'mtjco'){
        path = `mtinventory/`+ itemKey;
    }
    const updates = {};
    updates['issue'] = newissue;
    updates['instore'] = newInstore;
    const history = {
        date: date,
        person: person,
        location: location,
        quantity: quantity,
        issued_by: sessionStorage.getItem('baNumber')
    };
    if(quantity <=0 || quantity > dataCache.servicable){
        showNotification('Error: Invalid quantity', 'error');
        return;
    }
    const role_type = sessionStorage.getItem('role_type' );
    if(role_type=== 'officer' || role_type === 'cc' || role_type === 'clo'){
        update(ref(db, path), updates).then(() => {
            showNotification('Item issued successfully', 'success');
            closeIssueModal();
            loaditemhistory();
            loaditemsdetails();
        })
        .catch((error) => {
            console.error('Error issuing item:', error);
            showNotification('Error issuing item. Please try again.', 'error');
        });
        const historypath = `${path}/history/${Date.now()}`;
        set(ref(db, historypath), history).then(() => {
            console.log('History record added successfully');
        })
        .catch((error) => {
            console.error('Error adding history record:', error);
        });         
        set(ref(db, 'clo_cc_notification/'+Date.now()), {
            msg: `Item Issued: ${dataCache.name}, Quantity: ${quantity}  Location: ${location}`,
        });
        set(ref(db, 'clonotification'), true);
    }
    else{
        path= '';
        if(role === 'engrnco'){
            path = `issuepending/eo/`+ itemKey;
        }
        else if(role === 'signco'){
            path = `issuepending/so/`+ itemKey;
        }
        else if(role === 'bknco'){
            path = `issuepending/lo/`+ itemKey;
        }
        else if (role === 'bqms'){
            path = `issuepending/eo/`+ itemKey;
        }
        else if( role === 'mtnco' || role === 'mtjco'){
            path = `issuepending/mto/`+ itemKey;
        }

        history['msg'] = `Request to issue item: ${dataCache.name}, Quantity: ${quantity} , Location: ${location}`;
        set(ref(db, path), history).then(() => {
            showNotification('Issue request submitted for approval', 'success');            
            closeIssueModal();
            loaditemhistory();
            loaditemsdetails();
        })
        .catch((error) => {
            console.error('Error submitting issue request:', error);
            showNotification('Error submitting issue request. Please try again.', 'error');
        });
    }
});



function returnItemToStore(recordKey) {
    console.log(recordKey);
    const record = itemhistoryCache[recordKey];
    console.log('Return Record:', record); 
    if (!record) {
        showNotification('Error: History record not found in ' + recordKey, 'error');
        return;
    }
    const quantity = parseInt(record.quantity, 10);
    const newissue = (dataCache.issue || 0) - quantity;
    const newInstore = (dataCache.instore || 0) + quantity;
    let path;
    console.log(itemKey);
    if(typeKey === 'engrnco' || role === 'engrnco'){
        path = `engrinventory/`+ itemKey;
    }
    else if(typeKey === 'signco' || role === 'signco'){
        path = `siginventory/`+ itemKey;  
    }
    else if(typeKey === 'bknco' || role === 'bknco'){
        path = `bkncoinventory/`+ itemKey;
    }
    else if (typeKey === 'bqms' || role === 'bqms'){
        path = `bqmsinventory/`+ itemKey;
    }
    else if( typeKey === 'mt ' || typeKey === 'mtjco' || role === 'mtjco'){
        path = `mtinventory/`+ itemKey;
    }
    const updates = {};
    updates['issue'] = newissue;
    updates['instore'] = newInstore;
    update(ref(db, path), updates).then(() => {
        showNotification('Item returned to store successfully', 'success');
    })
    .catch((error) => {
        console.error('Error returning item to store:', error);
        showNotification('Error returning item to store. Please try again.', 'error');
    });
    path = `${path}/history/${recordKey}`;
    update(ref(db, path), { returned: true }).then(() => {
        console.log('History record updated successfully');
        showNotification('History record updated successfully', 'success');
    })
    .catch((error) => {
        console.error('Error updating history record:', error);
    });
    set(ref(db, 'clo_cc_notification/'+Date.now()), {
        msg: `Item Returned to Store: ${dataCache.name}, Quantity: ${quantity}  Location: ${record.location}`,
    });
    
        set(ref(db, 'clonotification'), true);
    loaditemhistory();
    loaditemsdetails();
}


const unsvcModal = document.getElementById('unsvcModal');
const unsvcModalCloseBtn = document.getElementById('unsvcModalCloseBtn');
const cancelUnsvcBtn = document.getElementById('cancelUnsvcBtn');
const unsvcForm = document.getElementById('unsvcForm');
const markasunservicable = document.getElementById('markasunservicable');


function openUnsvcModal() {
    document.getElementById('unsvcdate').valueAsDate = new Date();
    unsvcModal.classList.remove('hidden');
}
markasunservicable.addEventListener('click', () => {
    openUnsvcModal();
});

function closeUnsvcModal() {
    unsvcModal.classList.add('hidden');
}
unsvcModalCloseBtn.addEventListener('click', closeUnsvcModal);
cancelUnsvcBtn.addEventListener('click', closeUnsvcModal);

unsvcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = formatDate(document.getElementById('unsvcdate').value);
    const reason = document.getElementById('unsvcreason').value;
    const quantity = parseInt(document.getElementById('unsvcquantity').value, 10);
    if (quantity <= 0 || quantity > dataCache.servicable || quantity > dataCache.instore) {
        showNotification('Error: Invalid quantity', 'error');
        return;
    }
    const newUnserviceable = (dataCache.unservicable || 0) + quantity;
    const newServiceable = (dataCache.servicable || 0) - quantity;
    let path;
    const role_type = sessionStorage.getItem('role_type' );
    const updates = {};
    updates['unservicable'] = newUnserviceable;
    updates['servicable'] = newServiceable;
    const historyKey= {
        date: date,
        reason: reason,
        quantity: quantity,
        marked_by: sessionStorage.getItem('baNumber')
    };

    if(role_type === 'officer' || role_type === 'cc' || role_type === 'clo'){
        let path;
        if(typeKey === 'engrnco'){
            path = `engrinventory/`+ itemKey;
        }
        else if(typeKey === 'signco'){
            path = `siginventory/`+ itemKey;
        }
        else if(typeKey === 'bknco'){
            path = `bkncoinventory/`+ itemKey;
        }
        else if (typeKey === 'bqms'){
            path = `bqmsinventory/`+ itemKey;
        }
        else if( typeKey === 'mtnco' || typeKey === 'mtjco'){
            path = `mtinventory/`+ itemKey;
        }

        update(ref(db, path), updates).then(() => {
            showNotification('Item marked as unservicable successfully', 'success');
            loaditemhistory();
            loaditemsdetails();
            closeUnsvcModal();
        })
        .catch((error) => {
            console.error('Error marking item as unservicable:', error);
            showNotification('Error marking item as unservicable. Please try again.', 'error');
        });
        const historypath = `${path}/unsvc/${Date.now()}`;
        set(ref(db, historypath), historyKey).then(() => {
            console.log('Unserviceable history record added successfully');
        })
        .catch((error) => {
            console.error('Error adding unservicable history record:', error);
        });
        set(ref(db, 'clo_cc_notification/'+Date.now()), {
            msg: `Item Marked as Unserviceable: ${dataCache.name}, Quantity: ${quantity}, Reason: ${reason}`,
        });
        
            set(ref(db, 'clonotification'), true);
    }
    else{
        if(role === 'engrnco'){
            path = `unsvcpending/eo/`+ itemKey;
        }
        else if(role === 'signco'){
            path = `unsvcpending/so/`+ itemKey;
        }
        else if(role === 'bknco'){
            path = `unsvcpending/lo/`+ itemKey;
        }
        else if (role === 'bqms'){
            path = `unsvcpending/eo/`+ itemKey;
        }
        else if( role === 'mtnco' || role === 'mtjco'){
            path = `unsvcpending/mto/`+ itemKey;
        }
        historyKey['msg'] = `Request to mark item as unservicable: ${dataCache.name}, Quantity: ${quantity}, Reason: ${reason}`;
        set(ref(db, path),historyKey).then(() => {
            showNotification('Unserviceable request submitted for approval', 'success');
            loaditemhistory();
            loaditemsdetails();
            closeUnsvcModal();
        })
        .catch((error) => {
            console.error('Error submitting unservicable request:', error);
            showNotification('Error submitting unservicable request. Please try again.', 'error');
        });
    }
    loaditemhistory();
    loaditemunsvc();
    loaditemsdetails();
});


function markAsServiceable(recordKey) {
    const record = itemunsvccache[recordKey];
    if (!record) {
        showNotification('Error: History record not found', 'error');
        return;
    }
    const quantity = parseInt(record.quantity, 10);
    const newUnserviceable = (dataCache.unservicable || 0) - quantity;
    const newServiceable = (dataCache.servicable || 0) + quantity;
    let dbRef ;
    if(typeKey === 'engrnco' || role === 'engrnco'){
        dbRef = ref(db, `engrinventory/`+ itemKey);
    }
    else if(typeKey === 'signco' || role === 'signco'){
        dbRef = ref(db, `siginventory/`+ itemKey);
    }
    else if(typeKey === 'bknco' || role === 'bknco'){
        dbRef = ref(db, `bkncoinventory/`+ itemKey);
    }
    else if (typeKey === 'bqms' || role === 'bqms'){
        dbRef = ref(db, `bqmsinventory/`+ itemKey);
    }
    else if( typeKey === 'mt' || role === 'mtnco' || role === 'mtjco'){
        dbRef = ref(db, `mtinventory/`+ itemKey);
    }
    const updates = {};
    updates['unservicable'] = newUnserviceable;
    updates['servicable'] = newServiceable;
    update(dbRef, updates).then(() => {
        showNotification('Item marked as servicable successfully', 'success');
    })
    .catch((error) => {
        console.error('Error marking item as servicable:', error);
        showNotification('Error marking item as servicable. Please try again.', 'error');
    });
    const path = `${dbRef._path}/unsvc/${recordKey}`;
    update(ref(db, path), { markedsvc: true }).then(() => {
        console.log('Unserviceable history record updated successfully');
    })
    .catch((error) => {
        console.error('Error updating unservicable history record:', error);
    });
    set(ref(db, 'clo_cc_notification/'+Date.now()), {
        msg: `Item Marked as Serviceable: ${dataCache.name}, Quantity: ${quantity}`,
    });
    
        set(ref(db, 'clonotification'), true);
    loaditemhistory();
    loaditemunsvc();
    loaditemsdetails();
}


loaditemunsvc();

// Print functionality - Generate Report
function printItemDetails() {
    // Get current date and time
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-GB');
    const reportTime = now.toLocaleTimeString('en-GB');
    
    // Get item data
    const itemName = document.getElementById('typeofitem').textContent || 'N/A';
    const authorized = document.getElementById('authorized').textContent || 'N/A';
    const held = document.getElementById('held').textContent || 'N/A';
    const issued = document.getElementById('issued').textContent || 'N/A';
    const instore = document.getElementById('instore').textContent || 'N/A';
    const servicable = document.getElementById('servicable').textContent || 'N/A';
    const unservicable = document.getElementById('unservicable').textContent || 'N/A';
    
    // Get issue history data
    const issueHistoryRows = document.querySelectorAll('#history-tbody tr');
    let issueHistoryHTML = '';
    if (issueHistoryRows.length > 0) {
        issueHistoryHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        issueHistoryHTML += '<thead><tr style="background-color: #f8f9fa;"><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Voucher No</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Date</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Person/Unit</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Location</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Quantity</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Status</th></tr></thead><tbody>';
        
        issueHistoryRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            issueHistoryHTML += '<tr>';
            cells.forEach(cell => {
                issueHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">${cell.textContent}</td>`;
            });
            issueHistoryHTML += '</tr>';
        });
        issueHistoryHTML += '</tbody></table>';
    } else {
        issueHistoryHTML = '<p style="margin-top: 10px; font-style: italic; color: #666;">No issue history records found.</p>';
    }
    
    // Get unservicable history data
    const unsvcHistoryRows = document.querySelectorAll('#unsvc-history-tbody tr');
    let unsvcHistoryHTML = '';
    if (unsvcHistoryRows.length > 0) {
        unsvcHistoryHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
        unsvcHistoryHTML += '<thead><tr style="background-color: #f8f9fa;"><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Voucher No</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Date</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Reasons</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Quantity</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Status</th></tr></thead><tbody>';
        
        unsvcHistoryRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            unsvcHistoryHTML += '<tr>';
            cells.forEach(cell => {
                unsvcHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">${cell.textContent}</td>`;
            });
            unsvcHistoryHTML += '</tr>';
        });
        unsvcHistoryHTML += '</tbody></table>';
    } else {
        unsvcHistoryHTML = '<p style="margin-top: 10px; font-style: italic; color: #666;">No unservicable history records found.</p>';
    }
    
    // Create report HTML
    const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Item Details Report - ${itemName}</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 30px;
                    background: white;
                    color: #000;
                    line-height: 1.4;
                }
                .report-header {
                    text-align: center;
                    border-bottom: 3px solid #000;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .report-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }
                .report-subtitle {
                    font-size: 18px;
                    margin: 5px 0;
                    color: #333;
                }
                .report-meta {
                    display: flex;
                    justify-content: space-between;
                    margin: 20px 0;
                    font-size: 12px;
                    color: #666;
                }
                .item-summary {
                    background: #f8f9fa;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .item-summary h2 {
                    margin: 0 0 15px 0;
                    font-size: 18px;
                    color: #000;
                    border-bottom: 1px solid #dee2e6;
                    padding-bottom: 8px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px dotted #ccc;
                }
                .summary-label {
                    font-weight: bold;
                    color: #000;
                }
                .summary-value {
                    color: #333;
                    text-align: right;
                }
                .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    font-size: 16px;
                    margin: 0 0 15px 0;
                    color: #000;
                    border-bottom: 2px solid #000;
                    padding-bottom: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 12px;
                }
                th {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    text-align: left;
                    padding: 8px;
                    border: 1px solid #dee2e6;
                }
                td {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                }
                .report-footer {
                    margin-top: 50px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .report-header { page-break-after: avoid; }
                    .section { page-break-inside: avoid; }
                    table { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">Bangladesh Army Store Management System</div>
                <div class="report-subtitle">Item Details Report</div>
                <div class="report-meta">
                    <span>Generated on: ${reportDate} at ${reportTime}</span>
                    <span>Report Type: Item Inventory Summary</span>
                </div>
            </div>

            <div class="item-summary">
                <h2>Item Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">Type of Item:</span>
                        <span class="summary-value">${itemName}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Authorized Unit:</span>
                        <span class="summary-value">${authorized}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Held:</span>
                        <span class="summary-value">${held}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Issued:</span>
                        <span class="summary-value">${issued}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">In Store:</span>
                        <span class="summary-value">${instore}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Serviceable:</span>
                        <span class="summary-value">${servicable}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Unserviceable:</span>
                        <span class="summary-value">${unservicable}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Issue History</h2>
                ${issueHistoryHTML}
            </div>

            <div class="section">
                <h2>Unserviceable History</h2>
                ${unsvcHistoryHTML}
            </div>

            <div class="report-footer">
                <p><strong>Bangladesh Army Store Management System</strong></p>
                <p>This is a computer-generated report. No signature is required.</p>
                <p>For any queries, please contact the Store Management Department.</p>
            </div>
        </body>
        </html>
    `;
    
    // Open report in new window and print
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.open();
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        // Close window after printing (optional)
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
}

// Add event listener for print button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printItemDetails);
    }
});
