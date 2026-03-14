import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, get, ref, set, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { showNotification } from '../../js/notification.js';

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
const db = getDatabase(app);

let itemCounter = 0;

const role = sessionStorage.getItem('role');
const store = sessionStorage.getItem('selected_store_code');
const role_type = sessionStorage.getItem('role_type');
const selectedStoreName = sessionStorage.getItem('selected_store_name');



window.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userid = sessionStorage.getItem('userid');
    const role_type = sessionStorage.getItem('role_type');
    
    if (!role_type || !userid) {
        alert('Session expired. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('Logged in as BA Number:', userid);
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
    const dbRef = ref(db, `issuepending/${store}/${issueItemkey}`);
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
        const dbRef = ref(db, `issuepending/${store}/${issueItemkey}`);
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


