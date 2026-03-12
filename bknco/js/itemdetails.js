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
    let userid = sessionStorage.getItem('userid');
    if (!userid) {
        console.error('BA Number not found in local storage.');
        window.location.href = 'index.html';
        return;
    }
});
 
import {showNotification} from '../../js/notification.js';

let dataCache = {};


function loaditemsdetails() {
    const urlparams = new URLSearchParams(window.location.search);
    itemKey = urlparams.get('key');
    typeKey = urlparams.get('type');
    console.log('Item Key:', itemKey);
    console.log('Type Key:', typeKey);
    let dbRef = ref(db, `bkncoinventory/main/`+ itemKey);
    const loadingOverlay = document.getElementById('loadingOverlay');
    onValue(dbRef, (snapshot) => {
        dataCache = snapshot.val();
        
        if (dataCache) {
            console.log('Vehicle Data:', dataCache);
            document.getElementById('typeofitem').textContent = dataCache.name || 'N/A';
            document.getElementById('unit').textContent = dataCache.unit || 'N/A';
            document.getElementById('authorized').textContent = dataCache.authorized;
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
    });
}



loaditemsdetails();

let itemhistoryCache = {};
function loaditemhistory() {
    let dbRef = ref(db, `bkncoinventory/`+ itemKey + `/history`);
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

loaditemhistory();
let itemunsvccache = {};
function loaditemunsvc() {
    let dbRef = ref(db, `bkncoinventory/`+ itemKey + `/unsvc`);
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




function returnItemToStore(recordKey) {
    if(role === 'guest'){
        showNotification('Error: You do not have permission to perform this action', 'error');
        return;
    }
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
    path = `bkncoinventory/main/`+ itemKey;  
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
    path = `bkncoinventory/${itemKey}/history/${recordKey}`;
    update(ref(db, path), { returned: true }).then(() => {
        console.log('History record updated successfully');
        showNotification('History record updated successfully', 'success');
    })
    .catch((error) => {
        console.error('Error updating history record:', error);
    });
    set(ref(db, 'clo_cc_notification/'+Date.now()), {
        from: 'BK NCO Inventory',
        date: new Date().toLocaleString(),
        msg: `Item Returned to Store: ${dataCache.name}, Quantity: ${quantity}, From Location: ${record.location}`,
    });
    set(ref(db, 'clonotification'), true);
    loaditemhistory();
    loaditemsdetails();
    if(role === 'bknco'){
        const notificationPath = `notification/eo/${Date.now()}`;
        set(ref(db, notificationPath), {
            from: 'BK NCO Inventory',
            date: new Date().toLocaleString(),
            msg: `Item Returned to Store: ${dataCache.name}, Quantity: ${quantity}, From Location: ${record.location}`,
        }).then(() => {
            // You can add any additional actions here if needed after the notification is set
        }).catch((error) => {
            console.error('Error sending notification to EO:', error);
        });
    }
}




function markAsServiceable(recordKey) {
    if(role === 'guest'){
        showNotification('Error: You do not have permission to perform this action', 'error');
        return;
    }
    const record = itemunsvccache[recordKey];
    if (!record) {
        showNotification('Error: History record not found', 'error');
        return;
    }
    const quantity = parseInt(record.quantity, 10);
    const newUnserviceable = (dataCache.unservicable || 0) - quantity;
    const newServiceable = (dataCache.servicable || 0) + quantity;
    let dbRef = ref(db, `bkncoinventory/main/`+ itemKey);
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
    const path = `bkncoinventory/${itemKey}/unsvc/${recordKey}`;
    update(ref(db, path), { markedsvc: true }).then(() => {
        console.log('Unserviceable history record updated successfully');
    })
    .catch((error) => {
        console.error('Error updating unservicable history record:', error);
    });
    set(ref(db, 'clo_cc_notification/'+Date.now()), {
        from: 'BK NCO Inventory',
        date: new Date().toLocaleString(),
        msg: `Item Marked as Serviceable: ${dataCache.name}, Quantity: ${quantity}`,
    });
    
    set(ref(db, 'clonotification'), true);
    loaditemhistory();
    loaditemunsvc();
    loaditemsdetails();
    if(role === 'bknco'){
        const notificationPath = `notification/eo/${Date.now()}`;
        set(ref(db, notificationPath), {
            from: 'BK NCO Inventory',
            date: new Date().toLocaleString(),
            msg: `Item Marked as Serviceable: ${dataCache.name}, Quantity: ${quantity}`,
        }).then(() => {
            // You can add any additional actions here if needed after the notification is set
        }).catch((error) => {
            console.error('Error sending notification to EO:', error);
        });
    }
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
    const unit = document.getElementById('unit').textContent || 'N/A';
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
        issueHistoryHTML += '<thead><tr style="background-color: #f8f9fa;"><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Voucher No</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Date</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Person/Location</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Quantity</th><th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Status</th></tr></thead><tbody>';
        
        issueHistoryRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            issueHistoryHTML += '<tr>';
            cells.forEach(cell => {
                if(cell.textContent === 'Return to Store'){
                    issueHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">Not Returned</td>`;
                }
                else{
                    issueHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">${cell.textContent}</td>`;
                }
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
                if(cell.textContent === 'Mark as Serviceable'){
                    unsvcHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">Not Serviceable</td>`;
                }
                else{
                    unsvcHistoryHTML += `<td style="border: 1px solid #dee2e6; padding: 8px;">${cell.textContent}</td>`;
                }
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
                <div class="report-title">BANRDB Management System</div>
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
                        <span class="summary-label">Measurement Unit:</span>
                        <span class="summary-value">${unit}</span>
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
                <p><strong>BANRDB Management System</strong></p>
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
