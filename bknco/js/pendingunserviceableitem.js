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
    // Initialize the pending items
    pendingitems();

    setTimeout(initializeEventListeners, 2000);
});



let itemskey={};
let pendingItemsDataCaches={};
function pendingitems(){
    const loadingOverlay = document.getElementById('loadingOverlay');
    const pendingitemsContainer = document.getElementById('pendingsection');
    const dbRef = ref(db, 'unservicable_storeman/bknco/');
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
                            <label for="issuedate">Date</label>
                            <input type="date" id="issuedate-${key}" name="date" value="${pendingrequest.issueDate}" disabled>
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
                console.log('Adding item to HTML:', item);
                html+=`
                        <div class="item-row" id="item-pending-${key}-${itemkey}">
                            <button class="remove-item-btn" onclick="removeItemRow('item-pending-${key}-${itemkey}', 'itemsContainer-pending-${key}', '${key}', '${itemkey}')" title="Remove this item">X</button>
                            <div class="item-form">
                                <div class="form-group" style="grid-column: span 2;">
                                    <label for="itemSelect-${key}-${itemkey}">Item names</label>
                                    <input type="text" id="itemSelect-${key}-${itemkey}" name="itemSelect" value="${item.itemName}" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="itemSelect-${key}-${itemkey}">Held & Serviceable</label>
                                    <input type="text" id="availableQty-${key}-${itemkey}" name="itemSelect" value="${item.availableQty}" disabled>
                                </div>
                                <div class="form-group">
                                    <label for="quantity-${key}-${itemkey}">Quantity</label>
                                    <input type="number" id="quantity-${key}-${itemkey}" name="quantity" min="1" required oninput="validateQuantity('availableQty-${key}-${itemkey}', 'quantity-${key}-${itemkey}')" value="${item.quantity}">
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label for="reason-${key}-${itemkey}">Reason</label>
                                    <input type="text" id="reason-${key}-${itemkey}" name="reason" value="${item.reason}" > 
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
    }).catch((error) => {
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

    remove(ref(db, `unservicable_storeman/bknco/${parentSectionId}/items/${itemID}`));
    
    const itemsContainer = document.getElementById(sectionId);
    if (itemsContainer.children.length === 0) {
        const pendingitemsContainer = document.getElementById(parentSectionId);
        pendingitemsContainer.remove();
        const key = parentSectionId;
        remove(ref(db, `unservicable_storeman/bknco/${key}`));
        showNotification('All items removed. Pending request is deleted automatically.', 'info', 'Request Deleted Automatically');
    }
}

function processIssueRequest(key) {
    console.log('Processing issue request for key:', key);
    let msgforclo='Items Unserviceable: ';
    const dateInput = document.getElementById(`issuedate-${key}`);
    const voucherInput = document.getElementById(`voucherNumber-${key}`);

    const issueDate = dateInput ? formatDate(dateInput.value) : '';
    const voucherNumber = voucherInput ? voucherInput.value.trim() : '';
    console.log('Issue Date:', issueDate); 
    console.log('Voucher Number:', voucherNumber);

    const itemRows = document.querySelectorAll(`#itemsContainer-pending-${key} .item-row`);
    console.log('Found item rows:', itemRows.length);
    console.log('Item rows details:', itemRows);

    for (const row of itemRows) {
        const rowIdParts = row.id.split('-');
        const itemkey = pendingItemsDataCaches[key].items[rowIdParts[3]].itemKey;
        console.log('Processing item with key:', itemkey);

        const quantityInput = document.getElementById(`quantity-${key}-${rowIdParts[3]}`);
        const quantity = parseInt(quantityInput.value);
        const reasonInput = document.getElementById(`reason-${key}-${rowIdParts[3]}`);
        const reason = reasonInput.value.trim();
        
        if (!quantity || quantity <= 0) {
            showNotification('Please specify valid quantities for all items.', 'error', 'Validation Failed');
            return;
        }
        const mainitem = get(ref(db, `engrinventory/main/${itemkey}`));
        mainitem.then((snapshot) => {
            const itemData = snapshot.val();
            const availableQty = (itemData.instore || 0) - (itemData.unservicable || 0);
            if (quantity > availableQty) {
                showNotification(`Insufficient quantity available for ${itemData.name}. Available: ${availableQty}`, 'error', 'Insufficient Stock');
                return;
            }
            console.log(`Issuing ${quantity} of item ${itemData.name}`);
            msgforclo+=`${quantity} X ${itemData.name} for ${reason} ,; `;
            set(ref(db, `bkncoinventory/${itemkey}/unsvc/${voucherNumber}`), {
                date: issueDate,
                quantity: quantity,
                reason: reason,

            });
            update(ref(db, `bkncoinventory/main/${itemkey}`), {
                unservicable: (itemData.unservicable || 0) + quantity,
                servicable: (itemData.servicable || 0) - quantity
            });
        });
    }
    remove(ref(db, `unservicable_storeman/bknco/${key}`))
    .then(() => {
        console.log('Pending issue request removed from database.');
    })
    .catch((error) => {
        console.error('Error removing pending issue request:', error);
    });
    const issueRef = push(ref(db, 'clo_cc_notification/'));
    set(issueRef, {
        msg: msgforclo,
        from: 'BK NCO Inventory',
        time: formatDate(new Date())   
    }).then(() => {
        showNotification('Items marked as unserviceable successfully! Opening print dialog...', 'success', 'Request Submitted');
    }).catch((error) => {
        console.error('Error submitting issue request:', error);
        showNotification('Error submitting issue request. Please try again.', 'error', 'Submission Failed');
    });
    
        set(ref(db, 'clonotification'), true);
    const pendingitemsContainer = document.getElementById(key);
    pendingitemsContainer.remove();
        

}

function rejectIssueRequest(key) {
    remove(ref(db, `unservicable_storeman/bknco/${key}`))
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
}


// Make functions globally available
window.removeItemRow = removeItemRow;
window.validateQuantity = validateQuantity;
window.rejectIssueRequest = rejectIssueRequest;
window.processIssueRequest = processIssueRequest;
