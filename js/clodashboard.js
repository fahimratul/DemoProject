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
    let userid = sessionStorage.getItem('userid');
    let role_type = sessionStorage.getItem('role_type');
    if (!role_type) { 
        console.error('Role type not found in session storage.');
        alert('Session expired or unauthorized access. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    if( role_type !== 'cc' && role_type !== 'clo' && role_type !== 'guest' ) { 
        console.error('Unauthorized role type:', role_type);
        alert('Unauthorized access. Please log in with the correct credentials.');
        window.location.href = 'index.html';
        return;
    }
    if (!userid) {
        console.error('BA Number not found in local storage.');
        alert('Session expired. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', userid);
});



// Clear sessionStorage when the site is closed
 
const role = sessionStorage.getItem('role');


window.addEventListener('DOMContentLoaded', () => {
    const titleElement = document.getElementById('title');
    if(role === 'cc'){
        
        titleElement.textContent = 'Welcome , Contingent Commander';
    }
    else if(role === 'clo'){
        
        titleElement.textContent = 'Welcome , Chief Logistic Officer';
    }
    else if(role === 'guest'){
        titleElement.textContent = 'Welcome, Guest';
    }
    else {
        console.error('Invalid role:', role);
        showNotification("Invalid role. Cannot load inventory data.", "error", "Load Failed");
        window.location.href = 'index.html';
        return;
    }
    
});


import {showNotification} from './notification.js';

console.log("Officer Script Loaded");



// Per-store realtime listener handles (for cleanup when stores list changes)
const storeItemListeners = {};

/**
 * Subscribes to the `stores/` node in Firebase.
 * For each store entry it builds a card and subscribes to that store's
 * inventory path so the item count updates in realtime.
 *
 * Expected Firebase structure for each store:
 *   stores/{key}/name          — display name
 *   stores/{key}/image         — image URL (optional)
 *   stores/{key}/inventoryPath — DB path to count items (e.g. "engrinventory/main")
 *   stores/{key}/link          — page to navigate on click (optional)
 *   stores/{key}/order         — sort order (optional, default 999)
 */
function subscribeStores() {
    const grid = document.getElementById('storesGrid');
    const noStores = document.getElementById('noStores');
    const loadingOverlay = document.getElementById('loadingOverlay');

    onValue(ref(db, 'stores'), (snapshot) => {
        // Cancel any existing per-store item count listeners
        Object.values(storeItemListeners).forEach(unsub => unsub());
        Object.keys(storeItemListeners).forEach(k => delete storeItemListeners[k]);

        grid.innerHTML = '';

        if (!snapshot.exists()) {
            noStores.style.display = 'block';
            if (loadingOverlay) setTimeout(() => loadingOverlay.classList.add('hidden'), 200);
            return;
        }

        noStores.style.display = 'none';

        const stores = snapshot.val();
        const sorted = Object.entries(stores)
            .sort(([, a], [, b]) => (a.order ?? 999) - (b.order ?? 999));
        
        
        
        sorted.forEach(([key, store]) => {
            grid.appendChild(buildStoreCard(key, store));
            storeItemListeners[key] = onValue(ref(db, `${store.code}/main/`), (snap) => {
                    const el = document.getElementById(`store-count-${key}`);
                    if (el) el.textContent = snap.exists() ? snap.size : '0';
                });
        });
        console.log('Loaded stores:', sorted.map(([k, s]) => ({ key: k, ...s })));
        if (loadingOverlay) setTimeout(() => loadingOverlay.classList.add('hidden'), 200);
    });
}

function resolveStoreImage(store) {
    if (!store || typeof store !== 'object') {
        return '';
    }

    // Keep parity with officer homepage image handling and support common variants.
    return (
        store.imageDataUrl ||
        (store.image && store.image.dataUrl) ||
        (store.image && store.image.url) ||
        store.imageUrl ||
        store.image ||
        ''
    );
}

function buildStoreCard(key, store) {
    const card = document.createElement('article');
    card.className = 'store-card';

    const imageSource = resolveStoreImage(store);
    let imageNode;

    // Image section
    if (imageSource) {
        const img = document.createElement('img');
        img.className = 'store-image';
        img.src = imageSource;
        img.alt = `${store.name || key} image`;
        img.addEventListener('error', () => {
            img.replaceWith(createImagePlaceholder());
        });
        imageNode = img;
    } else {
        imageNode = createImagePlaceholder();
    }

    // Body section
    const body = document.createElement('div');
    body.className = 'store-body';

    const nameEl = document.createElement('h3');
    nameEl.textContent = store.name || key;

    const codeEl = document.createElement('p');
    codeEl.className = 'store-meta';
    codeEl.innerHTML = `<strong>Code:</strong> ${key}`;

    const countDiv = document.createElement('p');
    countDiv.className = 'store-meta';

    const countNum = document.createElement('span');
    countNum.className = 'store-count-num';
    countNum.id = `store-count-${key}`;
    countNum.textContent = store.inventoryPath ? '—' : 'N/A';

    const countLabel = document.createElement('span');
    countLabel.className = 'store-count-label';
    countLabel.textContent = 'Total Items';

    const countPrefix = document.createElement('strong');
    countPrefix.textContent = 'Items: ';
    countDiv.append(countPrefix, countNum, document.createTextNode(' '), countLabel);

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'open-btn';
    openBtn.textContent = 'Open Inventory';
    openBtn.addEventListener('click', () => { 
            const storeCode = store.code || key;
            const storeName = store.name || key;
            sessionStorage.setItem("selected_store_code", storeCode);
            sessionStorage.setItem("selected_store_name", storeName);
            window.location.href = 'dashboard/officer_dashboard.html';
    });
    

    body.append(nameEl, codeEl, countDiv, openBtn);
    card.append(imageNode, body);

    return card;
}

function createImagePlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'store-image placeholder';
    placeholder.textContent = 'No Image';
    return placeholder;
}

subscribeStores();


const logoutButton = document.getElementById('logoutButton');

logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('userid');
    sessionStorage.removeItem('role_type');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('rank');
    window.location.href = 'index.html';
});


window.addEventListener('DOMContentLoaded', () => {
    if(role=== 'clo'){
        onValue(ref(db, 'clonotification'), (snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('notificationCount').style.display='block';
            }
        }, (error) => {
            console.error(error);
        });
    }  
});

document.getElementById('notification_menu').addEventListener('click', () => {
    if(role=== 'clo'){
        remove(ref(db, 'clonotification')).then(() => {
            document.getElementById('notificationCount').style.display='none';
            console.log("Notification count reset");
        }).catch((error) => {
            console.error(error);
        });
    }
});
