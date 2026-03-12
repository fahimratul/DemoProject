import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase,set,  get, ref, update , remove} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


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

let allowedRoles = ['mtjco', 'mtnco', 'mto','cc', 'clo'];

window.addEventListener('DOMContentLoaded', () => {
    let userid = sessionStorage.getItem('userid');
    let role = sessionStorage.getItem('role');
    if (!allowedRoles.includes(role)) {
        console.error('Unauthorized role for mto. Access denied.');
        window.location.href = 'index.html';
        return;
    }
    if (!userid) {
        console.error('BA Number not found in local storage.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', userid);
});
 


import {showNotification} from './notification.js';
console.log(" Script Loaded");

let dataCache = {};
let currentEditKey = null;
const modal = document.getElementById('editModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editForm = document.getElementById('editForm');
const inputs = {
    name: document.getElementById('editName'),
    authorized: document.getElementById('editAuthorized'),
    total: document.getElementById('edittotal'),
    servicable: document.getElementById('editServiceable'),
    unservicable: document.getElementById('editunservicable'),
    issue: document.getElementById('editIssue'),
    instore: document.getElementById('editInstore'),
};



inputs.issue.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentEditKey) return;   
    window.location.href = `itemdetails.html?key=${currentEditKey}&type=mtnco`;
});

inputs.unservicable.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentEditKey) return;
    window.location.href = `itemdetails.html?key=${currentEditKey}&type=mtnco`;
});

let ranklist ={
    snk:"Sainik",
    lcpl:"Lance Corporal",
    cpl:"Corporal",
    sgt:"Sergeant",
    wo:"Warrant Officer",
    swo:"Senior Warrant Officer",
    mwo:"Master Warrant Officer",
    lt:"Lieutenant",
    capt:"Captain",
    major:"Major",
    ltcol:"Lieutenant Colonel",
    col:"Colonel",
    brig:"Brigadier",
    majorgen:"Major General",
    ltgen:"Lieutenant General",
    gen:"General"
};

let conditionlist={
    alr:"A LR",
    asr:"A SR",
    inmaintenance:"In Maintenance",
    grounded:"Grounded"
};
let classlist={
    classA:"Class A",
    classB:"Class B",
    spl:"Spl Veh",
    sp:"SP Veh",
    watertrailer:"Water Trailer",
    lowbed:"Low Bed/Fuel /Water /Trailer"
};
let camplist={
    bayoo:"BAYOO",
    drodro:"DRODRO",
    rhoo:"RHOO",
    ndromo:"NDROMO"
};


const role = sessionStorage.getItem('role');


window.addEventListener('DOMContentLoaded', () => {
    const username=sessionStorage.getItem('username');
    const rank=sessionStorage.getItem('rank');
    const userid=sessionStorage.getItem('userid');
    document.getElementById('username').textContent='Name: ' + username;
    document.getElementById('rank').textContent=ranklist[rank] ? 'Rank: ' + ranklist[rank] : 'Rank: ' + rank;
    if(role === 'mtjco' || role === 'mtnco'){
    document.getElementById('userid').textContent='Army No: ' + userid;
    }
    else
    {
    document.getElementById('userid').textContent='BA Number: ' + userid;
    }
});



let vehicleDataCache = {};

    let vehicleinfoclass = { 
        classA:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        classB:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        spl:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        sp:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        watertrailer:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        lowbed:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        }
    };
    let vehicleinfo = {
        total:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        bayoo:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        drodro:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        rhoo:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        },
        ndromo:{
            total:0,
            alr:0,
            asr:0,
            inmaintenance:0,
            grounded:0
        }
    };


function loadvehicledata() {


    const dbRef = ref(db, `vehiclelist/`);
    const loadingOverlay = document.getElementById('loadingOverlay');
    get(dbRef).then((snapshot) => {
        const data = snapshot.val();
        vehicleDataCache = data || {};
        let serial = 1;
        const tableBody = document.getElementById('VehicleTableBody');
        
        if (!tableBody) {
            console.error('VehicleTableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const vehicle = data[key];
                const vehiclenumber = vehicle.vehicleNumber || ''; 
                const unnumber = vehicle.unnumber ?? '';
                const typeofvehicle = vehicle.typeofvehicle ?? '';
                const classtype = vehicle.classtype || '';
                const condition = vehicle.condition || '';
                const camp = vehicle.camp || '';
                // console.log(vehicle);

                html += `<tr id="${key}"data-key="${key}">
                            <td>${serial}</td>
                            <td>${vehiclenumber}</td>
                            <td>${unnumber}</td>
                            <td>${typeofvehicle}</td>
                            <td>${classlist[classtype] || classtype}</td>
                            <td>${conditionlist[condition] || condition}</td>
                            <td>${camplist[camp] || camp}</td>
                            <td><button class="edit-btn" data-key='${key}'>Take Action</button></td>
                        </tr>`;
                serial += 1;
                vehicleinfo.total.total+=1;
                if (vehicleinfo.total[condition] !== undefined) vehicleinfo.total[condition]+=1;
                if (vehicleinfo[camp]) {
                    vehicleinfo[camp].total+=1;
                    if (vehicleinfo[camp][condition] !== undefined) vehicleinfo[camp][condition]+=1;
                }
                if (vehicleinfoclass[classtype]) {
                    vehicleinfoclass[classtype].total+=1;
                    if (vehicleinfoclass[classtype][condition] !== undefined) vehicleinfoclass[classtype][condition]+=1;
                }
            }
        } else {
            html = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No inventory data available</td></tr>';
        }
        
        tableBody.innerHTML = html;
        document.getElementById('totalVehicles').textContent = vehicleinfo.total.total;
        document.getElementById('ALRVehicles').textContent = vehicleinfo.total.alr;
        document.getElementById('ASRVehicles').textContent = vehicleinfo.total.asr;
        document.getElementById('inMaintenanceVehicles').textContent = vehicleinfo.total.inmaintenance;
        document.getElementById('groundedVehicles').textContent = vehicleinfo.total.grounded;

        for (const camp in camplist) {
            document.getElementById(`totalVehicles${camp}`).innerHTML = `<span>Total</span> ${vehicleinfo[camp].total}`;
            document.getElementById(`ALRVehicles${camp}`).innerHTML = `<span>A LR</span> ${vehicleinfo[camp].alr}`;
            document.getElementById(`ASRVehicles${camp}`).innerHTML = `<span>A SR</span> ${vehicleinfo[camp].asr}`;
            document.getElementById(`inMaintenanceVehicles${camp}`).innerHTML = `<span>Maintenance</span> ${vehicleinfo[camp].inmaintenance}`;
            document.getElementById(`groundedVehicles${camp}`).innerHTML = `<span>Grounded</span> ${vehicleinfo[camp].grounded}`;
            
        }
        for (const classtype in classlist) {
            document.getElementById(`totalVehicles${classtype}`).innerHTML = `<span>Total</span> ${vehicleinfoclass[classtype].total}`;
            document.getElementById(`ALRVehicles${classtype}`).innerHTML = `<span>A LR</span> ${vehicleinfoclass[classtype].alr}`;
            document.getElementById(`ASRVehicles${classtype}`).innerHTML = `<span>A SR</span> ${vehicleinfoclass[classtype].asr}`;
            document.getElementById(`inMaintenanceVehicles${classtype}`).innerHTML = `<span>In Maintenance</span> ${vehicleinfoclass[classtype].inmaintenance}`;
            document.getElementById(`groundedVehicles${classtype}`).innerHTML = `<span>Grounded</span> ${vehicleinfoclass[classtype].grounded}`;    
        }
        // Attach edit handlers
        tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                vehiclehistoryload(key);
            });
        });
        
        // Hide loading overlay after data is loaded
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    }).catch((error) => {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById('VehicleTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #e53e3e;">Error loading data. Please refresh the page.</td></tr>';
        }
        // Hide loading overlay even on error
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}
let notificationDataCache = {};

const notificationbody = document.getElementById('officer_notification');
function loadnotifactions() {
    const dbRef = ref(db, 'officernotification/mto/notifications');
    get(dbRef).then((snapshot) => {
        notificationDataCache = snapshot.val();
        let html = '';
        notificationbody.style.display='flex';
        if (notificationDataCache) {
            for (const key in notificationDataCache) {
                const notification = notificationDataCache[key];
                const message = notification.msg || '';
                html += `<div class="msg">
                        <p class="content">${message}<br><br> </p>
                        <button class="accept-btn" data-key="${key}">Accept</button>
                        <button class="reject-btn" data-key="${key}">Reject</button> 
                    </div>`;
            }
            notificationbody.innerHTML = html;
            notificationbody.style.minHeight='max-content';
            console.log("Notifications Loaded");
            console.log(notificationDataCache);
            // Attach accept/reject handlers
            notificationbody.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    acceptNotificationMTO(key);
                    console.log('Accepted notification with key:', key);
                });
            });
            notificationbody.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    rejectNotificationMTO(key);
                    console.log('Rejected notification with key:', key);
                });
            });
        }
    }).catch((error) => {
        console.error('Error loading notifications:', error);
    });
}
let campchangeNotificationDataCache = {};
function loadcampchangeNotifications() {
    const dbRef = ref(db, 'officerapproval/campchange/');
    get(dbRef).then((snapshot) => {
        campchangeNotificationDataCache = snapshot.val();
        let html = '';
        notificationbody.style.display='flex';
        if (campchangeNotificationDataCache) {
            for (const key in campchangeNotificationDataCache) {
                const notification = campchangeNotificationDataCache[key];
                const message = notification.msg || '';
                html += `<div class="msg">
                        <p class="content">${message}<br><br> </p>
                        <button class="accept-btn" data-key="${key}">Accept</button>
                        <button class="reject-btn" data-key="${key}">Reject</button> 
                    </div>`;
            }
            notificationbody.innerHTML = html;
            notificationbody.style.minHeight='max-content';
            console.log("Notifications Loaded");
            console.log(campchangeNotificationDataCache);
            // Attach accept/reject handlers
            notificationbody.querySelectorAll('.accept-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    acceptCampchange(key);
                    console.log('Accepted notification with key:', key);
                });
            });
            notificationbody.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    rejectCampchange(key);
                    console.log('Rejected notification with key:', key);
                });
            });
        }
    }).catch((error) => {
        console.error('Error loading notifications:', error);
    });
}

if(role==='mto'){
    loadnotifactions();
    loadcampchangeNotifications();
}
function acceptCampchange(key) {
    const notification = campchangeNotificationDataCache?.[key];
    if (!notification) {
        console.error('Notification data not found for key:', key);
        return;
    }
    const vehiclekey = key;
    const newCamp = notification.camp;
    const dbRef = ref(db, `vehiclelist/` + vehiclekey);
    update(dbRef, {camp: newCamp})
    .then(() => {
        console.log('Vehicle camp updated successfully.');
        showNotification('Vehicle camp updated successfully.', 'success', 'Update Successful');
    })
    .catch((error) => {
        console.error('Error updating vehicle camp:', error);
        showNotification('Failed to update vehicle camp. Please try again later.', 'error', 'Update Failed');
    });
    const notificationKey = key;
    const dbref = ref(db, 'officerapproval/campchange/' + notificationKey);
    remove(dbref)
    .then(() => {
        console.log('Notification removed successfully after accepting camp change.');
    })
    .catch((error) => {
        console.error('Error removing notification:', error);
    });


    set(ref(db, `clo_cc_notification/${Date.now()}`), {
        msg: 'BA-'+ vehiclekey+ ' has been approved for camp change to ' + camplist[newCamp],
        from: 'MTO',
        date: new Date().toLocaleString()
     }).then(() => {
        console.log('Notification sent to CLOC successfully.');
    }).catch((error) => {
        console.error('Error sending notification to CLOC:', error);
        });    
    set(ref(db, 'clonotification'), true);
    setTimeout(() => {
        window.location.reload();
        showNotification('Camp change request accepted successfully.', 'success', 'Acceptance Successful');
    }, 500);
}
function rejectCampchange(key) {
    const notificationKey = key;
    const dbref = ref(db, 'officerapproval/campchange/' + notificationKey);
    remove(dbref)
    .then(() => {
        console.log('Notification removed successfully after rejecting camp change.');
        showNotification('Camp change request rejected successfully.', 'success', 'Rejection Successful');
        loadcampchangeNotifications();
    })
    .catch((error) => {
        console.error('Error removing notification:', error);
        showNotification('Failed to reject camp change request. Please try again later.', 'error', 'Rejection Failed');
    });

    setTimeout(() => {
        window.location.reload();
    }, 500);
}        

function updateVehicleHistoryRecord(vehicleKey, event, details, date, notificationKey) {
    const newKey = Date.now().toString();
    const updates = {};
    updates[`vehiclelist/${vehicleKey}/history/${newKey}`] = {
        event: event,
        details: details,
        date: date
    };

    update(ref(db), updates)
        .then(() => {
            let dbref = ref(db, `officernotification/mto/notifications/${notificationKey}`);
            remove(dbref)
            .then(() => {
                console.log('Notification removed successfully after updating history.');    
            })
            .catch((error) => {
                console.error('Error removing notification:', error);
            });
        })
        .catch((error) => {
            console.error('Error adding maintenance record:', error);
        });
    
}
function acceptNotificationMTO(key) {
    let dbref = ref(db, `clo_cc_notification/${Date.now()}`); 
    const notification = notificationDataCache?.[key];
    notificationbody.innerHTML = '';
    console.log(notification);
    const event = notification?.event;
    const details = notification?.details;
    const date = notification?.date;
    const vehiclekey = notification?.vehicleKey;
    const msg = event === 'Maintenance' ? 'has been accepted for Maintenance.' : event === 'Grounded' ? 'has been accepted to be Grounded.' : event === 'Marking as A LR' ? 'has been accepted to be marked as A LR.' : event === 'Marking as A SR' ? 'has been accepted to be marked as A SR.' : '';
    if (!notification) {
        console.error('Notification data not found for key:', key);
        return;
    }   
    updateVehicleHistoryRecord(vehiclekey, event, details, date, key);
    const notificationData = {
        msg: 'Vehicle Number ' + vehiclekey + ' '+ msg + ' Details: ' + details,
    };
    update(dbref, notificationData)
    .then(() => {
        console.log('Notification sent to CLOC successfully.');
    })
    .catch((error) => {
        console.error('Error sending notification to CLOC:', error);
    });
    dbref = ref(db, `vehiclelist/`+vehiclekey);
    update(dbref, {condition: event === 'Maintenance' ? 'inmaintenance' : event === 'Grounded' ? 'grounded' : event === 'Marking as A LR' ? 'alr' : event === 'Marking as A SR' ? 'asr' : dataCache.condition})
    .then(() => {
        console.log('Vehicle condition updated to In Maintenance.');
    })
    .catch((error) => {
        console.error('Error updating vehicle condition:', error);
    });
    loadvehicledata();
    setTimeout(() => {
        loadnotifactions();
        showNotification('Vehicle history updated successfully.', 'success', 'Update Successful');
    }, 500);
}

function rejectNotificationMTO(key) {
    let dbref = ref(db, `officernotification/mto/notifications/${key}`);
    remove(dbref).then(() => {
        console.log('Notification rejected and removed successfully.');
    }).catch((error) => {
        console.error('Error removing notification:', error);
    });
    setTimeout(() => {
        loadnotifactions();
        showNotification('Notification rejected successfully.', 'success', 'Rejection Successful');
    }, 500);
}


loadvehicledata();

function searchItems() {
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('itemTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const searchTerm = searchInput.value.toLowerCase();

    Array.from(rows).forEach(row => {
        const itemName = row.getAttribute('id');
        if (itemName && itemName.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        } 
    });
}

function searchVehicles() {
    const searchInput = document.getElementById('searchInputVehicle');
    const tableBody = document.getElementById('VehicleTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const searchTerm = searchInput.value.toLowerCase();
    Array.from(rows).forEach(row => {
        const vehicleNumber = row.cells[1]?.textContent || '';
        if (vehicleNumber.toLowerCase().includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}


 
document.getElementById('searchInputVehicle')?.addEventListener('keyup', searchVehicles);

function openEditModal(key) {
    const item = dataCache?.[key];
    if (!item) return;
    currentEditKey = key;

    inputs.name.value = item.name || '';
    inputs.authorized.value = item.authorized ?? 'NOS';
    inputs.total.value = item.total ?? 0;
    inputs.servicable.value = item.servicable ?? 0;
    inputs.unservicable.value = item.unservicable ?? 0;
    inputs.issue.value = item.issue ?? 0;
    inputs.instore.value = item.instore ?? 0;
    recalcModalTotals();

    modal.classList.remove('hidden');
}

function closeEditModal() {
    modal.classList.add('hidden');
    currentEditKey = null;
    editForm.reset();
    inputs.total.value = '';
    inputs.servicable.value = '';
    inputs.unservicable.value = '';
    inputs.issue.value = '';
    inputs.instore.value = '';
}

function recalcModalTotals() {
    if(Number(inputs.servicable.value) > Number(inputs.total.value)) {
        showNotification('Serviceable quantity cannot exceed Total quantity. Adjusting Serviceable to match Total.', 'warning', 'Input Adjusted');
        inputs.servicable.value = inputs.total.value;
    }
    if(Number(inputs.issue.value) > Number(inputs.servicable.value)) {
        showNotification('Issued quantity cannot exceed Serviceable quantity. Adjusting Issued to match Serviceable.', 'warning', 'Input Adjusted');
        inputs.issue.value = inputs.servicable.value;
    }
    const unservicable = (Number(inputs.total.value) || 0) - (Number(inputs.servicable.value) || 0);
    const instore = (Number(inputs.total.value) || 0) - (Number(inputs.issue.value) || 0);
    inputs.unservicable.value = Math.max(unservicable, 0);
    inputs.instore.value = Math.max(instore, 0);
}

[inputs.total, inputs.servicable, inputs.issue].forEach(el => {
    el.addEventListener('input', recalcModalTotals);
});

modalCloseBtn?.addEventListener('click', closeEditModal);
cancelEditBtn?.addEventListener('click', closeEditModal);
modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
});

editForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentEditKey) return;

    const updated = {
        ...dataCache[currentEditKey],
        name: inputs.name.value.trim(),
        authorized: inputs.authorized.value,
        total: Number(inputs.total.value) || 0,
        servicable: Number(inputs.servicable.value) || 0,
        issue: Number(inputs.issue.value) || 0,
        unservicable: Number(inputs.unservicable.value) || 0,
        instore: Number(inputs.instore.value) || 0
    };
    updated.unservicable = updated.total - updated.servicable;
    updated.instore = Math.max(updated.total - updated.issue, 0);

    console.table({ key: currentEditKey, updated });
    update(ref(db, 'mtinventory/' + currentEditKey), updated)
    .then(() => {
        console.log('Data updated successfully');
        showNotification('Inventory item updated successfully.', 'success', 'Update Successful');
    })
    .catch((error) => {
        console.error('Error updating data:', error);
    });

    closeEditModal();
});

const logoutButton = document.getElementById('logoutButton');

logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem('userid');
    window.location.href = 'index.html';
});


function changePassword() {
    const userid = sessionStorage.getItem('userid');
    if (!userid) {
        console.error('BA Number not found in session storage.');
        window.location.href = 'index.html';
        return;
    }
    const currentPassword = document.getElementById('password').value;
    const newPassword = document.getElementById('new-password').value;    
    const confirmPassword = document.getElementById('confirm-password').value;
    if (newPassword !== confirmPassword) {
        showNotification("New passwords do not match", "error", "Validation Error");
        return;
    }
    if (newPassword.length < 6) {
        showNotification("New password must be at least 6 characters long", "error", "Validation Error");
        return;
    }
    const userRef = ref(db, 'users/' + userid);
    get(userRef).then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            if (userData.password !== currentPassword) {
                showNotification("Current password is incorrect", "error", "Validation Error");
                return;
            }
            update(userRef, { password: newPassword })
                .then(() => {
                    showNotification("Password changed successfully", "success", "Success");
                    sessionStorage.clear();
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error updating password:", error);
                    showNotification("Error updating password", "error", "Update Failed");
                });
        } else {
            showNotification("User data not found", "error", "Error");
        }
    }).catch((error) => {
        console.error("Error fetching user data:", error);
        showNotification("Error fetching user data", "error", "Error");
    });
}

document.getElementById('passwordChangeSubmitBtn')?.addEventListener('click', changePassword);


function filterVehicles() {
    const classFilter = document.getElementById('classFilter')?.value || '';
    const conditionFilter = document.getElementById('conditionFilter')?.value || '';
    const campFilter = document.getElementById('campFilter')?.value || '';
    const tableBody = document.getElementById('VehicleTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const classtype = cells[4]?.textContent || '';
        const condition = cells[5]?.textContent || '';
        const camp = cells[6]?.textContent || '';

        const matchClass = !classFilter || classtype === classlist[classFilter];
        const matchCondition = !conditionFilter || condition === conditionlist[conditionFilter];
         const matchCamp = !campFilter || camp === camplist[campFilter];

        row.style.display = (matchClass && matchCondition && matchCamp) ? '' : 'none';
    });
}

document.getElementById('classFilter')?.addEventListener('change', filterVehicles);
document.getElementById('conditionFilter')?.addEventListener('change', filterVehicles);
document.getElementById('campFilter')?.addEventListener('change', filterVehicles);

function vehiclehistoryload(key) {
    const vehicle = vehicleDataCache?.[key];
    if (!vehicle) return;
    window.location.href = `vehiclehistory.html?key=${key}`;
}


function filterVehiclesbyclick(classFilter, conditionFilter, campFilter) {
    const tableBody = document.getElementById('VehicleTableBody');
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const cells = row.getElementsByTagName('td');
        const classtype = cells[4]?.textContent || '';
        const condition = cells[5]?.textContent || '';
        const camp = cells[6]?.textContent || '';

        const matchClass = !classFilter || classtype === classlist[classFilter];
        const matchCondition = !conditionFilter || condition === conditionlist[conditionFilter];
         const matchCamp = !campFilter || camp === camplist[campFilter];

        row.style.display = (matchClass && matchCondition && matchCamp) ? '' : 'none';
    });

    const targetElement = document.getElementById('searchInputVehicle');
    if (targetElement) {
        targetElement.scrollIntoView({
        behavior: 'smooth' // Makes the scroll transition smooth
    });
    }
}



document.getElementById('Allvehicles').addEventListener('click', () => {
    filterVehiclesbyclick('', '', '');
    showNotification('Showing all vehicles', 'info', 'Filter Applied');
});

document.getElementById('alrvehicles').addEventListener('click', () => {
    filterVehiclesbyclick('', 'alr', '');
    showNotification('Showing ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('asrvehicles').addEventListener('click', () => {
    filterVehiclesbyclick('', 'asr', '');
    showNotification('Showing ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('MaintenanceVehicles').addEventListener('click', () => {
    filterVehiclesbyclick('', 'inmaintenance', '');
    showNotification('Showing Maintenance vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('GroundedVehicles').addEventListener('click', () => {
    filterVehiclesbyclick('', 'grounded', '');
    showNotification('Showing Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesclassA').addEventListener('click', () => {
    filterVehiclesbyclick('classA', '', '');
    showNotification('Showing Class A vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesclassB').addEventListener('click', () => {
    filterVehiclesbyclick('classB', '', '');
    showNotification('Showing Class B vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesspl').addEventListener('click', () => {
    filterVehiclesbyclick('spl', '', '');
    showNotification('Showing SPL vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclessp').addEventListener('click', () => {
    filterVehiclesbyclick('sp', '', '');
    showNotification('Showing SP vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehicleswatertrailer').addEventListener('click', () => {
    filterVehiclesbyclick('watertrailer', '', '');
    showNotification('Showing Water Trailer vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehicleslowbed').addEventListener('click', () => { 
    filterVehiclesbyclick('lowbed', '', '');
    showNotification('Showing Low Bed vehicles', 'info', 'Filter Applied');
});

document.getElementById('ALRVehiclesclassA')?.addEventListener('click', () => {
    filterVehiclesbyclick('classA', 'alr', '');
    showNotification('Showing Class A ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('ASRVehiclesclassA')?.addEventListener('click', () => {
    filterVehiclesbyclick('classA', 'asr', '');
    showNotification('Showing Class A ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesclassA')?.addEventListener('click', () => {  
    filterVehiclesbyclick('classA', 'inmaintenance', '');
    showNotification('Showing Class A Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehiclesclassA')?.addEventListener('click', () => {  
    filterVehiclesbyclick('classA', 'grounded', '');
    showNotification('Showing Class A Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehiclesclassB')?.addEventListener('click', () => {
    filterVehiclesbyclick('classB', 'alr', '');
    showNotification('Showing Class B ALR vehicles', 'info', 'Filter Applied');
}); 

document.getElementById('ASRVehiclesclassB')?.addEventListener('click', () => {
    filterVehiclesbyclick('classB', 'asr', '');
    showNotification('Showing Class B ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesclassB')?.addEventListener('click', () => {
    filterVehiclesbyclick('classB', 'inmaintenance', '');
    showNotification('Showing Class B Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehiclesclassB')?.addEventListener('click', () => {
    filterVehiclesbyclick('classB', 'grounded', '');
    showNotification('Showing Class B Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehiclesspl')?.addEventListener('click', () => {
    filterVehiclesbyclick('spl', 'alr', '');
    showNotification('Showing SPL ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('ASRVehiclesspl')?.addEventListener('click', () => {
    filterVehiclesbyclick('spl', 'asr', '');
    showNotification('Showing SPL ASR vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('inMaintenanceVehiclesspl')?.addEventListener('click', () => {
    filterVehiclesbyclick('spl', 'inmaintenance', '');
    showNotification('Showing SPL Maintenance vehicles', 'info', 'Filter Applied');
});

document.getElementById('groundedVehiclesspl')?.addEventListener('click', () => {
    filterVehiclesbyclick('spl', 'grounded', '');
    showNotification('Showing SPL Grounded vehicles', 'info', 'Filter Applied');
});

document.getElementById('ALRVehiclessp')?.addEventListener('click', () => {
    filterVehiclesbyclick('sp', 'alr', '');
    showNotification('Showing SP ALR vehicles', 'info', 'Filter Applied');
});

document.getElementById('ASRVehiclessp')?.addEventListener('click', () => {
    filterVehiclesbyclick('sp', 'asr', '');
    showNotification('Showing SP ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclessp')?.addEventListener('click', () => {
    filterVehiclesbyclick('sp', 'inmaintenance', '');
    showNotification('Showing SP Maintenance vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('groundedVehiclessp')?.addEventListener('click', () => {
    filterVehiclesbyclick('sp', 'grounded', '');
    showNotification('Showing SP Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehicleswatertrailer')?.addEventListener('click', () => {   
    filterVehiclesbyclick('watertrailer', 'alr', '');
    showNotification('Showing Water Trailer ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('ASRVehicleswatertrailer')?.addEventListener('click', () => {    
    filterVehiclesbyclick('watertrailer', 'asr', '');
    showNotification('Showing Water Trailer ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehicleswatertrailer')?.addEventListener('click', () => {    
    filterVehiclesbyclick('watertrailer', 'inmaintenance', '');
    showNotification('Showing Water Trailer Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehicleswatertrailer')?.addEventListener('click', () => {    
    filterVehiclesbyclick('watertrailer', 'grounded', '');
    showNotification('Showing Water Trailer Grounded vehicles', 'info', 'Filter Applied');
});

document.getElementById('ALRVehicleslowbed')?.addEventListener('click', () => {    
    filterVehiclesbyclick('lowbed', 'alr', '');
    showNotification('Showing Low Bed ALR vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('ASRVehicleslowbed')?.addEventListener('click', () => {    
    filterVehiclesbyclick('lowbed', 'asr', '');
    showNotification('Showing Low Bed ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehicleslowbed')?.addEventListener('click', () => {    
    filterVehiclesbyclick('lowbed', 'inmaintenance', '');
    showNotification('Showing Low Bed Maintenance vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('groundedVehicleslowbed')?.addEventListener('click', () => {    
    filterVehiclesbyclick('lowbed', 'grounded', '');
    showNotification('Showing Low Bed Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesbayoo')?.addEventListener('click', () => {    
    filterVehiclesbyclick('', '', 'bayoo');
    showNotification('Showing Bayoo vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesdrodro')?.addEventListener('click', () => {    
    filterVehiclesbyclick('', '', 'drodro');
    showNotification('Showing Drodro vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesrhoo')?.addEventListener('click', () => {    
    filterVehiclesbyclick('', '', 'rhoo');
    showNotification('Showing Rhoo vehicles', 'info', 'Filter Applied');
});
document.getElementById('totalVehiclesndromo')?.addEventListener('click', () => {    
    filterVehiclesbyclick('', '', 'ndromo');
    showNotification('Showing Ndromo vehicles', 'info', 'Filter Applied');
});

document.getElementById('ALRVehiclesbayoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'alr', 'bayoo');
    showNotification('Showing Bayoo ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('ASRVehiclesbayoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'asr', 'bayoo');
    showNotification('Showing Bayoo ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesbayoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'inmaintenance', 'bayoo');
    showNotification('Showing Bayoo Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehiclesbayoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'grounded', 'bayoo');
    showNotification('Showing Bayoo Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehiclesdrodro')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'alr', 'drodro');
    showNotification('Showing Drodro ALR vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('ASRVehiclesdrodro')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'asr', 'drodro');     
    showNotification('Showing Drodro ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesdrodro')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'inmaintenance', 'drodro');
    showNotification('Showing Drodro Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehiclesdrodro')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'grounded', 'drodro');
    showNotification('Showing Drodro Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehiclesrhoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'alr', 'rhoo');
    showNotification('Showing Rhoo ALR vehicles', 'info', 'Filter Applied');
});
document.getElementById('ASRVehiclesrhoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'asr', 'rhoo');
    showNotification('Showing Rhoo ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesrhoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'inmaintenance', 'rhoo'); 
    showNotification('Showing Rhoo Maintenance vehicles', 'info', 'Filter Applied');
});
document.getElementById('groundedVehiclesrhoo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'grounded', 'rhoo');
    showNotification('Showing Rhoo Grounded vehicles', 'info', 'Filter Applied');
});
document.getElementById('ALRVehiclesndromo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'alr', 'ndromo');
    showNotification('Showing Ndromo ALR vehicles', 'info', 'Filter Applied');
}); 
document.getElementById('ASRVehiclesndromo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'asr', 'ndromo');
    showNotification('Showing Ndromo ASR vehicles', 'info', 'Filter Applied');
});
document.getElementById('inMaintenanceVehiclesndromo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'inmaintenance', 'ndromo');
    showNotification('Showing Ndromo Maintenance vehicles', 'info', 'Filter Applied');
}   );  
document.getElementById('groundedVehiclesndromo')?.addEventListener('click', () => {
    filterVehiclesbyclick('', 'grounded', 'ndromo');
    showNotification('Showing Ndromo Grounded vehicles', 'info', 'Filter Applied');
});


