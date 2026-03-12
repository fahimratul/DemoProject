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

window.addEventListener('DOMContentLoaded', () => {
    let userid = sessionStorage.getItem('userid');
    let role = sessionStorage.getItem('role');
    if(role !== 'mtjco' && role!== 'mtnco' && role !== 'mto'){
        console.error('Unauthorized access. Redirecting to login.');
        window.location.href = 'index.html';
        return;
    }

    if (!userid) {
        console.error('BA Number not found in session storage.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', userid);
});


const form = document.getElementById('addvehicleForm');
const vehicleNumber = document.getElementById('vehiclenumber');
const classtype = document.getElementById('classtype');
const typeofvehicle = document.getElementById('typeofvehicle');
const condition = document.getElementById('condition');
const unnumber = document.getElementById('unnumber');
const camp = document.getElementById('camp');

function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}



form.addEventListener('submit', (event) => {
    event.preventDefault();
    const number = toNumber(vehicleNumber.value);
    const classtypeValue = classtype.value;
    const conditionValue = condition.value;
    const typeofvehicleValue = typeofvehicle.value;
    const unnumberValue = toNumber(unnumber.value);
    const campValue = camp.value;

    console.log("Form submitted with values:", {
        number,
        classtype: classtypeValue,
        typeofvehicle: typeofvehicleValue,
        condition: conditionValue,
        unnumber: unnumberValue,
        camp: campValue
    });
    showNotification("Adding vehicle...", "info", "Please wait");
    writeInventoryItem(number,classtypeValue, conditionValue, typeofvehicleValue, unnumberValue, campValue);
    form.reset();
    vehicleNumber.focus();
});


function checkInventoryItem(number) {
    const dbRef = ref(db, `vehiclelist/` + number);
    return get(dbRef).then((snapshot) => {
        return snapshot.exists();
    }).catch((error) => {
        console.error(error);
        return false;
    });
}


function writeInventoryItem(userid, classtype, conditionValue, typeofvehicleValue, unnumberValue, campValue) {
    checkInventoryItem(userid).then((exists) => {
        if (exists) {
            console.log("Vehicle with this name already exists:", userid);
            showNotification(`Vehicle with ${userid} number already exists. Please choose a different number.`, "error", "Error");
        } else {    
                set(ref(db, `vehiclelist/` + userid),{
                vehicleNumber: userid,
                unnumber: unnumberValue,
                typeofvehicle: typeofvehicleValue,
                classtype: classtype,
                condition: conditionValue,
                camp: campValue
            });
            console.log("Vehicle added:", userid);
            showNotification("Vehicle added successfully!", "success", "Success");
        }   
        }).catch((error) => {   
            console.error("Error checking item existence:", error);
            showNotification("Error adding item. Please try again.", "error", "Error");
        });
}

console.log("Add Vehicle Script Executed");
