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
    // Initialize the pending items
    pendingitems();

    setTimeout(initializeEventListeners, 2000);
});



let itemskey={};
let pendingItemsDataCaches={};
function pendingitems(){
    const loadingOverlay = document.getElementById('loadingOverlay');
    itemCounter++;
    const issueItemkey = new URLSearchParams(window.location.search).get('key');
    const dbRef = ref(db, 'issuepending/bknco/'+issueItemkey);
    let html='';
    get(dbRef).then((snapshot) => {
        pendingItemsDataCaches = snapshot.val() || {};
        console.log('Pending Items data loaded:', pendingItemsDataCaches);
        document.getElementById('recipientLocation').value = pendingItemsDataCaches.location || '';
        document.getElementById('issuedate').value = pendingItemsDataCaches.date || '';
        const itemsContainer = document.getElementById('itemsContainer');
        if (pendingItemsDataCaches.items) {
            Object.keys(pendingItemsDataCaches.items).forEach((key, index) => {
                const item = pendingItemsDataCaches.items[key];
                html += `
                    <div class="item-row" id="itemRow-${index}">
                        <div class="item-name">Items Name:<h2>${item.itemName}</h2></div>
                        <div class="item-quantity">Issued Quantity<h3>${item.quantity}</h3></div>
                    </div>
                `;
                itemskey[index]=key;
            });
            itemsContainer.innerHTML = html;
        } else {
            itemsContainer.innerHTML = '<p>No items found in this request.</p>';
        }
    });
    setTimeout(() => {
        loadingOverlay.style.display = 'none';
    }, 500);
}

document.getElementById('cancelRequestBtn').addEventListener('click', () => {
    const issueItemkey = new URLSearchParams(window.location.search).get('key');
    if (confirm('Are you sure you want to cancel this request?')) {
        const dbRef = ref(db, 'issuepending/bknco/' + issueItemkey);
        remove(dbRef)
            .then(() => {
                showNotification('Request cancelled successfully.', 'success');
                setTimeout(() => {
                    window.location.href = 'storeman_pending_overview.html';
                }, 1500);
            }
            )
            .catch((error) => {
                console.error('Error cancelling request:', error);
                showNotification('Error cancelling request. Please try again.', 'error');
            });
    }
});


