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

let inventoryData = {};
let itemCounter = 0;

window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const baNumber = sessionStorage.getItem('baNumber');
    const role_type = sessionStorage.getItem('role_type');
    
    if (!role_type || !baNumber) {
        alert('Session expired. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Logged in as BA Number:', baNumber);
    // Initialize the pa
    pendingitems();

    setTimeout(initializeEventListeners, 2000);
});



let itemskey={};
let pendingItemsDataCaches={};
function pendingitems(){
    const loadingOverlay = document.getElementById('loadingOverlay');
    itemCounter++;
    const pendingitemsContainer = document.getElementById('pendingsection');
    const dbRef = ref(db, 'issuepending/bknco/');
    let html='';
    get(dbRef).then((snapshot) => {
        pendingItemsDataCaches = snapshot.val() || {};
        console.log('Pending Items data loaded:', pendingItemsDataCaches);
        for (const key in pendingItemsDataCaches) {
            console.log('Processing pending item with key:', key);
            const pendingrequest = pendingItemsDataCaches[key];
            itemskey[key]=key;
            html+=`
            <div  class="pendingitems" id="${key}">
                <div class="recipient-section">
                    <h3>
                        <i data-lucide="user"></i> Recipient Information
                    </h3>
                    <div class="recipient-form">
                        <div class="form-group">
                            <label for="recipientLocation">Person/Location</label>
                            <input type="text" id="recipientLocation-${key}" name="recipientLocation" value="${pendingrequest.location}" >
                        </div>
                        <div class="form-group">
                            <label for="issuedate">Date</label>
                            <input type="date" id="issuedate-${key}" name="date" value="${pendingrequest.date}" >
                        </div>
                        <div class="form-group">
                            <label for="voucherNumber">Voucher Number</label>
                            <input type="text" id="voucherNumber-${key}" name="voucherNumber" value="${pendingrequest.voucherNumber}" disabled>
                        </div>
                    </div>
                </div>
                <div id="itemsContainer">
                    <div class="section-header">
                        <h3>
                            <i data-lucide="package"></i> Pending Items to Issue
                        </h3>
                    </div>
                    <div id="itemsContainer-pending-${key}">
                    `;
            for(const itemkey in pendingrequest.items){
                const item = pendingrequest.items[itemkey];
                // console.log('Adding item to HTML:', item);
                html+=`
                        <div class="item-row" id="item-pending-${key}-${itemkey}">
                            <button class="remove-item-btn" onclick="removeItemRow('item-pending-${key}-${itemkey}', 'itemsContainer-pending-${key}', '${key}', '${itemkey}')" title="Remove this item">X</button>
                            <div class="item-form">
                                <div class="form-group" style="grid-column: span 2;">
                                    <label for="itemSelect-${key}-${itemkey}">Item names</label>
                                    <input type="text" id="itemSelect-${key}-${itemkey}" name="itemSelect" value="${item.itemName}" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="itemSelect-${key}-${itemkey}">Instore & Serviceable</label>
                                    <input type="text" id="availableQty-${key}-${itemkey}" name="itemSelect" value="${item.availableQty}" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="quantity-${key}-${itemkey}">Quantity</label>
                                    <input type="number" id="quantity-${key}-${itemkey}" name="quantity" min="1" required oninput="validateQuantity('availableQty-${key}-${itemkey}', 'quantity-${key}-${itemkey}')" value="${item.quantity}">
                                </div>
                            </div>
                        </div>`;
            
            }
            html+=` </div>        
                        <div class="issue-actions">
                            <button class="btn-primary" id="processIssue-${key}" onclick="processIssueRequest('${key}')">
                                Accept Issue Request
                            </button>
                            <button class="btn-secondary" id="rejectIssue-${key}" onclick="rejectIssueRequest('${key}')">
                                Reject Issue Request
                            </button>
                        </div>`;
            html+=`
                </div>
            </div>
            `;
        }
        pendingitemsContainer.innerHTML=html;
                
        loadingOverlay.style.display = 'none'; 
    });
}


function initializeEventListeners() {
    for(const key in itemskey){
        const RejectBtn = document.getElementById(`rejectIssue-${key}`);
        if (RejectBtn) {
            RejectBtn.addEventListener('click', () => {
                rejectIssueRequest(key);
            });
        }
    }
    console.log('Event listeners initialized for reject buttons.');
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function validateQuantity(availableQtyId, quantityId) {
    const availableQtyElement = document.getElementById(availableQtyId);
    const quantityInput = document.getElementById(quantityId);
    const availableQty = parseInt(availableQtyElement.value);
    const requestedQty = parseInt(quantityInput.value);
    if (requestedQty > availableQty) {
        showNotification(`Requested quantity (${requestedQty}) exceeds available quantity (${availableQty}).`, 'error', 'Invalid Quantity');
        quantityInput.value = availableQty; 
    } else if (requestedQty < 1) {
        showNotification(`Quantity must be at least 1.`, 'error', 'Invalid Quantity'); 
        quantityInput.value = 1;
    }
}

function removeItemRow(rowId, sectionId, parentSectionId, itemID) {
    const itemRow = document.getElementById(rowId);
    if (itemRow) {
        itemRow.remove();
    }
    console.log('Removed item with ID:', itemID);

    remove(ref(db, `issuepending/bknco/${parentSectionId}/items/${itemID}`));
    
    const itemsContainer = document.getElementById(sectionId);
    if (itemsContainer.children.length === 0) {
        const pendingitemsContainer = document.getElementById(parentSectionId);
        pendingitemsContainer.remove();
        const key = parentSectionId;
        remove(ref(db, `issuepending/bknco/${key}`));
        showNotification('All items removed. Pending request is deleted automatically.', 'info', 'Request Deleted Automatically');
    }
}

function processIssueRequest(key) {
    console.log('Processing issue request for key:', key);
    let msg='Items Issue: ';
    const locationInput = document.getElementById(`recipientLocation-${key}`);
    const dateInput = document.getElementById(`issuedate-${key}`);
    const voucherInput = document.getElementById(`voucherNumber-${key}`);

    const recipientLocation = locationInput ? locationInput.value.trim() : '';
    const issueDate = dateInput ? formatDate(dateInput.value) : '';
    const voucherNumber = voucherInput ? voucherInput.value.trim() : '';
    console.log('Recipient Location:', recipientLocation);
    console.log('Issue Date:', issueDate); 
    console.log('Voucher Number:', voucherNumber);

    const itemRows = document.querySelectorAll(`#itemsContainer-pending-${key} .item-row`);
    console.log('Found item rows:', itemRows.length);
    console.log('Item rows details:', itemRows);

    for (const row of itemRows) {
        const rowIdParts = row.id.split('-');
        const itemkey = pendingItemsDataCaches[key].items[rowIdParts[3]].key;
        console.log('Processing item with key:', itemkey);

        const quantityInput = document.getElementById(`quantity-${key}-${rowIdParts[3]}`);
        const quantity = parseInt(quantityInput.value);
        
        if (!quantity || quantity <= 0) {
            showNotification('Please specify valid quantities for all items.', 'error', 'Validation Failed');
            return;
        }
        const mainitem = get(ref(db, `bkncoinventory/main/${itemkey}`));
        mainitem.then((snapshot) => {
            const itemData = snapshot.val();
            const availableQty = (itemData.servicable || 0) - (itemData.issue || 0);
            if (quantity > availableQty) {
                showNotification(`Insufficient quantity available for ${itemData.name}. Available: ${availableQty}`, 'error', 'Insufficient Stock');
                return;
            }
            console.log(`Issuing ${quantity} of item ${itemData.name}`);
            msg= msg + quantity+ 'X' + itemData.name + ', ';
            set(ref(db, `bkncoinventory/${itemkey}/history/${voucherNumber}`), {
                date: issueDate,
                location: recipientLocation,
                quantity: quantity
            });
            update(ref(db, `bkncoinventory/main/${itemkey}`), {
                issue: (itemData.issue || 0) + quantity,
                instore: (itemData.instore || 0) - quantity
            });
        });
    }

    printIssueRequest(pendingItemsDataCaches[key], Object.values(pendingItemsDataCaches[key].items), voucherNumber, issueDate, recipientLocation, pendingItemsDataCaches[key].issuedBy);
    remove(ref(db, `issuepending/bknco/${key}`))
    .then(() => {
        console.log('Pending issue request removed from database.');
    })
    .catch((error) => {
        console.error('Error removing pending issue request:', error);
    });
    const issueRef = push(ref(db, 'clo_cc_notification/'));
    set(issueRef, {
        msg: msg,
        from: 'BK NCO Inventory',
        time: new Date().toLocaleString()   
    }).then(() => {
        showNotification('Items issued successfully! Opening print dialog...', 'success', 'Request Submitted');
        const pendingitemsContainer = document.getElementById(key);
        pendingitemsContainer.remove();
    }).catch((error) => {
        console.error('Error submitting issue request:', error);
        showNotification('Error submitting issue request. Please try again.', 'error', 'Submission Failed');
    });

    set(ref(db, 'clonotification'), true);
}

function rejectIssueRequest(key) {
    remove(ref(db, `issuepending/bknco/${key}`))
    .then(() => {
        showNotification('Issue request rejected successfully.', 'success', 'Request Rejected');
        // Remove the corresponding pending item section from the DOM
        const pendingItemSection = document.getElementById(key);
        if (pendingItemSection) {
            pendingItemSection.remove();
        }
    })
    .catch((error) => {
        console.error('Error rejecting issue request:', error);
        showNotification('Error rejecting issue request. Please try again.', 'error', 'Rejection Failed');
    });
    if( document.getElementById('pendingsection').children.length===0){
        const pendingitemsContainer = document.getElementById('pendingsection');
        pendingitemsContainer.innerHTML='<p>No pending issue requests.</p>';
        console.log('No pending issue requests remaining.');
    }
}


function printIssueRequest(issueRequest, itemsToIssue, voucherNo, issueDate, location, issuedByInformation = {}) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Build items table rows
    let itemsTableRows = '';
    let totalQuantity = 0;
    
    itemsToIssue.forEach((item, index) => {
        totalQuantity += item.quantity;
        itemsTableRows += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.itemName}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          </tr>
        `;
    });
    
    const printContent = `
            <!DOCTYPE html>
        <html>
        <head>
            <title>Issue Request - ${issueRequest.recipientName}</title>
            <style>
                @media print {
                    @page {
                        margin: 0.5in;
                        size: portrait;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #333;
                        line-height: 1.6;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                }
                
                body {
                    font-family: 'Arial', sans-serif;
                    color: #333;
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 5px;
                }
                
                .header h1 {
                    margin: 0;
                    color: #000000;
                    font-size: 24px;
                    font-weight: bold;
                }
                
                .header h2 {
                    margin: 10px 0 5px 0;
                    color: #333;
                    font-size: 20px;
                }
                
                .header p {
                    margin: 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .info-section {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border: 1px solid #000000;
                    border-left: 5px solid #007bff;
                }
                
                .recipient-section {
                    background-color: #e8f4fd;
                    padding: 20px;
                    border: 1px solid #000000;
                    border-left: 5px solid #17a2b8;
                }
                
                .section-title {
                    margin: 0 0 15px 0;
                    color: #333;
                    font-size: 18px;
                    border-bottom: 2px solid #dee2e6;
                    padding-bottom: 8px;
                    font-weight: bold;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .info-item {
                    display: flex;
                }
                
                .info-label {
                    font-weight: bold;
                    color: #495057;
                    min-width: 120px;
                }
                
                .info-value {
                    color: #333;
                }
                .table-section {
                    margin-top: 25px;
                }
                .table-section h3 {
                    text-align: center;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: white;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 25px;
                }
                
                th {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    background-color: #ffffff;
                    color: rgb(0, 0, 0);
                    font-weight: bold;
                }
                
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                
                tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                
                .total-row {
                    background-color: #f8f9fa !important;
                    font-weight: bold;
                }
                
                .total-quantity {
                    color: #007bff;
                    font-size: 16px;
                }
                
                .approval-section {
                    padding: 5px 20px;
                    margin-bottom: 25px;
                    border: 1px solid #000000;
                    border-left: 5px solid #ffc107;
                }
                
                .signature-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .signature-label {
                    margin: 0 0 10px 0;
                    font-weight: bold;
                    color: #495057;
                }
                
                .signature-line {
                    border-bottom: 1px solid #333;
                    height: 80px;
                    margin-bottom: 5px;
                }
                .signature-line2 {
                    border-bottom: 1px solid #333;
                    height: 5px;
                    margin-bottom: 5px;
                }
                .signature-username {
                    font-size: 14px;
                    margin: 0 0 2px 0;
                }
                .signature-note {
                    margin: 0;
                    font-size: 12px;
                    color: #666;
                }
                
                .footer {
                    text-align: center;
                    padding-top: 5px;
                    font-size: 12px;
                    color: #666;
                }
                
                .footer p {
                    margin: 0 0 5px 0;
                }
                
                .footer .system-name {
                    font-weight: bold;
                }
                
.footer .retention-note {
                    font-style: italic;
                    margin-top: 5px;
                }
                .fromcode {
                    position: absolute;
                    top: 0px;
                    right: 20px;
                    font-size: 12px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="fromcode">
                <p>In lieu of BAFZ 2096</p>
            </div>
            <div class="header">
                <h1>BANRDB Store Management System</h1>
                <h2>Issue Request Form</h2>
                <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="info-section">
                <h3 class="section-title">Request Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Voucher No:</span>
                        <span class="info-value">${voucherNo}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Issue Date:</span>
                        <span class="info-value">${issueDate}</span>
                    </div>
                </div>
            </div>
            
            <div class="recipient-section">
                <h3 class="section-title">Recipient Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Location/Person:</span>
                        <span class="info-value">${issueRequest.location}</span>
                    </div>
                </div>
            </div>
            
            <div class="table-section">
                <h3 class="section-title">Items to Issue</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: center;">S/N</th>
                            <th style="text-align: left;">Item Name</th>
                            <th style="text-align: center;">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsTableRows}
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right;">Total Quantity:</td>
                            <td style="text-align: center;" class="total-quantity">${totalQuantity}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="approval-section">
                <h3 class="section-title">Approval Section</h3>
                <div class="signature-grid">
                    <div class="signature-field">
                        <p class="signature-label">Approved By:</p>
                        <p class="signature-username"><strong>${sessionStorage.getItem('username')}</strong></p>
                        <p  class="signature-username">${sessionStorage.getItem('rank_proper')}</p>
                        <p class="signature-username">BA No-${sessionStorage.getItem('baNumber')}</p>
                        <div class="signature-line2"></div>
                        <p class="signature-note">Signature & Date</p>
                    </div>
                    <div class="signature-field">
                        <p class="signature-label">Issued By:</p>
                        <p class="signature-username"><strong>${issuedByInformation.username}</strong></p>
                        <p  class="signature-username">${issuedByInformation.rank}</p>
                        <p class="signature-username">Army No-${issuedByInformation.baNumber}</p>
                        <div class="signature-line2"></div>
                        <p class="signature-note">Signature & Date</p>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p class="system-name">BANRDB Store Management System</p>
                <p>This document was generated automatically on ${currentDate}</p>
                <p class="retention-note">Please retain this copy for your records</p>
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
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Show success notification
    if (typeof showNotification === 'function') {
        showNotification('Print dialog opened successfully!', 'success', 'Print Ready');
    }
}




// Make functions globally available
window.removeItemRow = removeItemRow;
window.validateQuantity = validateQuantity;
window.rejectIssueRequest = rejectIssueRequest;
window.processIssueRequest = processIssueRequest;
window.printIssueRequest = printIssueRequest;

