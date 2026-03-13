import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase, set, get, ref} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
console.log("Firebase Initialized");

import {showNotification} from './notification.js';

console.log("Add Item Script Loaded");

const role = sessionStorage.getItem('role');
const store = sessionStorage.getItem('selected_store_code');
const role_type = sessionStorage.getItem('role_type');

window.addEventListener('DOMContentLoaded', () => {
    let userid = sessionStorage.getItem('userid');
    let roleType = sessionStorage.getItem('role_type');
    console.log('Role Type from sessionStorage:', roleType);
    
    if (!userid) {
        console.error('BA Number not found in session storage.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', userid);
});

console.log('User Role:', role);
console.log('Selected Store Code:', store);
console.log('Role Type:', role_type);


const form = document.getElementById('addItemForm');
const total = document.getElementById('total');
const authorized = document.getElementById('authorized');
const unit = document.getElementById('unit');

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    let totalValue = toNumber(form.total.value);
    const payload = {
        name: form.name.value.trim(),
        authorized: toNumber(form.authorized.value),
        unit: form.unit.value,
        total: totalValue,
        servicable: totalValue,
        unservicable: 0,
        issue: 0,
        instore: totalValue
    };
    console.table(payload);
    writeInventoryItem(payload.name, payload);
    form.reset();
    total.value = 0;
    authorized.value = 0;
    unit.value = "";
});

function checkInventoryItem(name) {
    const newname = name.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
    let dbRef = ref(db, `${store}/main/${newname}`);
    return get(dbRef).then((snapshot) => {
        return snapshot.exists();
    }).catch((error) => {
        console.error(error);
        return false;
    });
}

function writeInventoryItem(name, data) {
    const newname = name.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
    checkInventoryItem(newname).then((exists) => {
        if (exists) {
            console.log("Item with this name already exists:", newname);
            showNotification("Item with this name already exists. Please choose a different name.", "error", "Error");
        } else {    
            if(role_type === 'storeman') {
                set(ref(db, `officerapproval/new/${store}/${newname}`),{
                    name: name,
                    unit: data.unit,
                    authorized: data.authorized,
                    total: data.total,
                    servicable: data.servicable,
                    unservicable: data.unservicable,
                    issue: data.issue,
                    instore: data.instore
                });
            }
            else if(role_type === 'officer' || role_type === 'clo' || role_type === 'cc') {
                set(ref(db, `${store}/main/${newname}`),{
                    name: name,
                    unit: data.unit,
                    authorized: data.authorized,
                    total: data.total,
                    servicable: data.servicable,
                    unservicable: data.unservicable,
                    issue: data.issue,
                    instore: data.instore
                });
                set(ref(db, 'clo_cc_notification/' + Date.now()),{
                    from: 'Signal Inventory',
                    date: new Date().toISOString(),
                    msg: `New inventory item "${name}" has been added by Signal Officer.`
                });
            }
            else {
                console.error('Invalid role:', role);
                showNotification("Invalid role. Cannot load inventory data.", "error", "Load Failed");
                window.location.href = 'index.html';
                return;
            }
            console.log("Inventory item added:", newname);
            showNotification("Item added successfully!", "success", "Success");
        }   
        }).catch((error) => {   
            console.error("Error checking item existence:", error);
            showNotification("Error adding item. Please try again.", "error", "Error");
        });
}