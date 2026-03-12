import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, get, ref, set, push, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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
    document.getElementById('issuedate').valueAsDate = new Date();
    // Initialize the page
    loadInventoryData();
    initializeEventListeners();
});

function loadInventoryData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const dbRef = ref(db, 'bkncoinventory/main/');
    
    inventoryData = {};
    get(dbRef).then((snapshot) => {
        inventoryData = snapshot.val() || {};
        console.log('Inventory data loaded:', inventoryData);
        
        // Hide loading overlay
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 500);
        }
    }).catch((error) => {
        console.error('Error loading inventory data:', error);
        showNotification('Error loading inventory data. Please refresh the page.', 'error', 'Load Failed');
        
        // Hide loading overlay even on error
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 500);
        }
    });
}

function initializeEventListeners() {
    const addMoreItemsBtn = document.getElementById('addMoreItems');
    const processIssueBtn = document.getElementById('processIssue');
    const clearFormBtn = document.getElementById('clearForm');
    
    if (addMoreItemsBtn) {
        addMoreItemsBtn.addEventListener('click', addItemRow);
    }
    
    if (processIssueBtn) {
        processIssueBtn.addEventListener('click', processIssueRequest);
    }
    
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
}

function addItemRow() {
    itemCounter++;
    const itemsContainer = document.getElementById('itemsContainer');
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.id = `item-${itemCounter}`;
    
    itemRow.innerHTML = `
        <button class="remove-item-btn" onclick="removeItemRow('item-${itemCounter}')" title="Remove this item">
            <i data-lucide="x"></i>
        </button>
        <div class="item-form" style="grid-template-columns: 2fr 1fr 1fr;">
            <div class="form-group">
                <label for="itemSelect-${itemCounter}">Select Item</label>
                <select id="itemSelect-${itemCounter}" name="itemSelect" required onchange="updateAvailableQuantity('${itemCounter}')">
                    <option value="">Choose an item...</option>
                </select>
            </div>
            <div class="form-group">
                <label for="availableQty-${itemCounter}">Held & Serviceable</label>
                <input type="text" id="availableQty-${itemCounter}" name="availableQty" value="Available: 0" readonly>
            </div>
            <div class="form-group">
                <label for="quantity-${itemCounter}">Quantity</label>
                <input type="number" id="quantity-${itemCounter}" name="quantity" min="1" required oninput="validateQuantity('${itemCounter}')">
            </div>
            <div class="form-group" style="grid-column: span 3;">
                <label for="reason-${itemCounter}">Reason</label>
                <input type="text" id="reason-${itemCounter}" name="reason" required placeholder="Reason for unservicable">
            </div>
        </div>
    `;
    
    itemsContainer.appendChild(itemRow);
    
    // Populate the select dropdown with inventory items
    populateItemSelect(itemCounter);
    
    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function populateItemSelect(rowId) {
    const select = document.getElementById(`itemSelect-${rowId}`);
    if (!select) return;
    // Clear existing options except the first one
    select.innerHTML = '<option value="">Choose an item...</option>';
    
    // Add inventory items to the dropdown
    for (const key in inventoryData) {
        const item = inventoryData[key];
        const availableQty = (item.instore || 0) - (item.unservicable || 0);
        
        // Only show items that have available quantity
        if (availableQty > 0) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${item.name || 'Unnamed Item'} `;
            select.appendChild(option);
        }
    }
    
}
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateAvailableQuantity(rowId) {
    const select = document.getElementById(`itemSelect-${rowId}`);
    const availableQtyDiv = document.getElementById(`availableQty-${rowId}`);
    const quantityInput = document.getElementById(`quantity-${rowId}`);
    
    if (select.value && inventoryData[select.value]) {
        const item = inventoryData[select.value];
        const availableQty = (item.instore || 0) - (item.unservicable || 0);
        availableQtyDiv.value = availableQty;
        quantityInput.max = availableQty;
        quantityInput.value = '';
    } else {
        availableQtyDiv.value = 0;
        quantityInput.max = 0;
        quantityInput.value = '';
    }
}

function validateQuantity(rowId) {
    const select = document.getElementById(`itemSelect-${rowId}`);
    const quantityInput = document.getElementById(`quantity-${rowId}`);
    
    if (select.value && inventoryData[select.value]) {
        const item = inventoryData[select.value];
        const availableQty = (item.instore || 0) - (item.unservicable || 0);
        const requestedQty = parseInt(quantityInput.value);
        
        if (requestedQty > availableQty) {
            quantityInput.value = availableQty;
            showNotification(`Maximum available quantity for this item is ${availableQty}`, 'warning', 'Quantity Adjusted');
        }
    }
}

function removeItemRow(rowId) {
    const itemRow = document.getElementById(rowId);
    if (itemRow) {
        itemRow.remove();
    }
    
    // Ensure at least one item row exists
    const itemsContainer = document.getElementById('itemsContainer');
    if (itemsContainer.children.length === 0) {
        addItemRow();
    }
}

function processIssueRequest() {
    const voucherNumber = Date.now(); 
    const issueDate = formatDate(document.getElementById('issuedate').value);
    
    const itemsToIssue = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    for (const row of itemRows) {
        const rowId = row.id.split('-')[1];
        const itemKey = document.getElementById(`itemSelect-${rowId}`).value;
        const quantity = parseInt(document.getElementById(`quantity-${rowId}`).value);
        const reason = document.getElementById(`reason-${rowId}`).value.trim() || 'No reason provided';
        
        if (!itemKey || !quantity || quantity <= 0) {
            showNotification('Please select items and specify valid quantities for all rows.', 'error', 'Validation Failed');
            return;
        }
        
        // Validate against available quantity
        const item = inventoryData[itemKey];
        const availableQty = (item.instore || 0) - (item.unservicable || 0);
        
        if (quantity > availableQty) {
            showNotification(`Insufficient quantity available for ${item.name}. Available: ${availableQty}`, 'error', 'Insufficient Stock');
            return;
        }
        itemsToIssue.push({
            itemKey,
            itemName: item.name,
            availableQty,
            quantity,
            reason
        });
    }
    if (itemsToIssue.length === 0) {
        showNotification('No items to mark as unservicable. Please add items.', 'error', 'No Items');
        return;
    }
    // Create issue request
    const issueRequest = {
        items: itemsToIssue,
        voucherNumber,
        issueDate
    };
    const dbref = ref(db, `unservicable_storeman/bknco/${voucherNumber}`);
    set(dbref, issueRequest).then(() => {
        showNotification('Unserviceable request submitted successfully.', 'success', 'Request Submitted');
        printUnserviceableVoucher(voucherNumber, issueDate, itemsToIssue);
        clearForm();
        loadInventoryData(); // Refresh inventory data to reflect changes
    }).catch((error) => {
        console.error('Error submitting unservicable request:', error);
        showNotification('Error submitting request. Please try again.', 'error', 'Submission Failed');
    });
    
}

function clearForm() {
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = '';
    itemCounter = 0;
    
    showNotification('Form cleared successfully.', 'info', 'Form Reset');
}

// Make functions globally available
window.removeItemRow = removeItemRow;
window.updateAvailableQuantity = updateAvailableQuantity;
window.validateQuantity = validateQuantity;

function printUnserviceableVoucher(voucherNumber, issueDate, itemsToIssue) {
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
                <td style="padding: 8px; border: 1px solid #ddd;">${item.reason}</td>
          </tr>
        `;
    });
    
    const printContent = `
            <!DOCTYPE html>
        <html>
        <head>
            <title> Unserviceable Items Voucher-${voucherNumber}</title>
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
            </style>
        </head>
        <body>
            <div class="header">
                <h1>BANRDB Store Management System</h1>
                <h2> Unserviceable Items Voucher</h2>
                <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="info-section">
                <h3 class="section-title">Request Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Voucher No:</span>
                        <span class="info-value">${voucherNumber}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date:</span>
                        <span class="info-value">${issueDate}</span>
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
                            <th style="text-align: left;">Purpose/Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsTableRows}
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right;">Total Quantity:</td>
                            <td style="text-align: center;" class="total-quantity">${totalQuantity}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="approval-section">
                <h3 class="section-title">Approval Section</h3>
                <div class="signature-grid">
                    <div class="signature-field">
                        <p class="signature-label">Approved By:</p>
                        <div class="signature-line"></div>
                        <p class="signature-note">Signature & Date</p>
                    </div>
                    <div class="signature-field">
                        <p class="signature-label">Issued By:</p>
                        <p class="signature-username"><strong>${sessionStorage.getItem('username')}</strong></p>
                        <p  class="signature-username">${sessionStorage.getItem('rank_proper')}</p>
                        <p class="signature-username">${sessionStorage.getItem('baNumber')}</p>
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
