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
        set(ref(db, `bkncoinventory/${itemKey}/unsvc/${voucherNumber}`), {
            date: issueDate,
            issued_by: sessionStorage.getItem('baNumber'),
            quantity: quantity,
            reason: reason
        });
        update(ref(db, `bkncoinventory/main/${itemKey}`), {
            unservicable: (item.unservicable || 0) + quantity,
            servicable: (item.servicable || 0) - quantity
        });
        console.log(`Item to mark unservicable: ${item.name}, Quantity: ${quantity}, Reason: ${reason}`);
    }

    // Create issue request
    const issueRequest = {
        items: itemsToIssue
    };
    
    // Save issue request to database
    set(ref(db, 'clo_cc_notification/'+ Date.now()), {
        msg: `New unservicable request processed with Voucher No: ${voucherNumber}`,
        date: new Date().toLocaleString(),
        from: "BK NCO Inventory"
    }).then(() => {
        showNotification(`Unserviceable request processed successfully with Voucher No: ${voucherNumber}`, 'success', 'Request Processed');
        clearForm();
        loadInventoryData(); // Refresh inventory data to reflect changes
    }).catch((error) => {
        console.error('Error processing unservicable request:', error);
        showNotification('Error processing unservicable request. Please try again.', 'error', 'Request Failed');
    });
    
    set(ref(db, 'clonotification'), true);

}

function clearForm() {
    // Clear recipient information
    document.getElementById('issuedate').valueAsDate = new Date();
    // Clear all item rows and add a fresh one
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = '';
    itemCounter = 0;
    addItemRow();
    
    showNotification('Form cleared successfully.', 'info', 'Form Reset');
}

// Make functions globally available
window.removeItemRow = removeItemRow;
window.updateAvailableQuantity = updateAvailableQuantity;
window.validateQuantity = validateQuantity;

