import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";

import { getDatabase,set, get, ref, update , onValue} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";


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
let vehicleKey = null;
let role = sessionStorage.getItem('role');
let allowedRoles = ['mtjco', 'mtnco', 'mto','cc', 'clo'];
window.addEventListener('DOMContentLoaded', () => {
    let baNumber = sessionStorage.getItem('baNumber');
    if (!allowedRoles.includes(role)) {
        console.error('Unauthorized role for mto. Access denied.');
        window.location.href = 'index.html';
        return;
    }
    if (!baNumber) {
        console.error('BA Number not found in local storage.');
        window.location.href = 'index.html';
        return;
    }
    console.log('Logged in as BA Number:', baNumber);
    
    // Add print button event listener
    document.getElementById('printHistoryBtn').addEventListener('click', printVehicleHistory);
});
 


import {showNotification} from './notification.js';
console.log("Script Loaded");

let dataCache = {};
let currentEditKey = null;

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


function loadvehicledata() {
    const urlparams = new URLSearchParams(window.location.search);
    vehicleKey = urlparams.get('key');
    const dbRef = ref(db, `vehiclelist/` + vehicleKey);
    const loadingOverlay = document.getElementById('loadingOverlay');
    onValue(dbRef, (snapshot) => {
        dataCache = snapshot.val();
        
        if (dataCache) {
            console.log('Vehicle Data:', dataCache);
            document.getElementById('title').textContent = `Vehicle History - ${dataCache.vehicleNumber || ''}`;
            document.getElementById('vehicleNumber').textContent = dataCache.vehicleNumber || '';
            document.getElementById('typeofvehicle').textContent = dataCache.typeofvehicle || '';
            document.getElementById('unnumber').textContent = dataCache.unnumber || '';
            document.getElementById('classtype').textContent = classlist[dataCache.classtype] || dataCache.classtype || '';
            document.getElementById('condition').textContent = conditionlist[dataCache.condition] || dataCache.condition || '';
            // Disable buttons based on condition
            document.getElementById('campSelect').value = dataCache.camp || '';
            
            document.getElementById('sendformaintainace').disabled = false;
            document.getElementById('markasgrounded').disabled = false;
            document.getElementById('markasalr').disabled = false;
            document.getElementById('markasasr').disabled = false;

            if(dataCache.condition === 'inmaintenance'){
                document.getElementById('sendformaintainace').disabled = true;
            }
            if(dataCache.condition === 'grounded'){
                document.getElementById('markasgrounded').disabled = true;
            }
            if(dataCache.condition === 'alr'){
                document.getElementById('markasalr').disabled = true;
            }
            if(dataCache.condition === 'asr'){
                document.getElementById('markasasr').disabled = true;
            }
        } else {
            console.log('No vehicle data available');
        }      
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}



document.getElementById('campSelect').addEventListener('change', (e) => {
    if(role !== 'mto' && role !== 'cc' && role !== 'clo'){
        const newCamp = e.target.value;
        const dbref = ref(db, 'officerapproval/campchange/' + vehicleKey);
        set(dbref, {
            camp: newCamp,
            msg: 'BA-'+ vehicleKey+ ' Request for camp change to ' + camplist[newCamp]
        }).then(() => {
            showNotification('Camp change request sent successfully.');
            console.log('Camp change request sent successfully to officer approval');
        }).catch((error) => {
            console.error('Error sending camp change request:', error);
        });    
} else {
    const newCamp = e.target.value;
    const dbRef = ref(db, `vehiclelist/` + vehicleKey);
    update(dbRef, {camp: newCamp})
    .then(() => {
        showNotification('Camp updated successfully.');
        console.log('Camp updated successfully to', newCamp);
        loadvehicledata();
    })
    .catch((error) => {
        console.error('Error updating camp:', error);
    });
} 
});


loadvehicledata();

let vehiclehistoryCache = {};
function loadvehiclehistory() {

    const dbRef = ref(db, `vehiclelist/`+ vehicleKey +`/history`);
    const loadingOverlay = document.getElementById('loadingOverlay');
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        vehiclehistoryCache = data || {};
        const tableBody = document.getElementById('history-tbody');
        
        if (!tableBody) {
            console.error('VehicleTableBody element not found');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }
        
        let html = '';
        
        // Build table rows
        if (data) {
            for (const key in data) {
                const record = data[key];
                console.log('History Record:', record, key);
                html += `<tr>
                    <td>${key}</td>
                    <td>${record.date || ''}</td>
                    <td>${record.event || ''}</td>
                    <td>${record.details || ''}</td>
                </tr>`;
                
                // Format date 
            }
        } else {
            html = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No history data available</td></tr>';
        }
        tableBody.innerHTML = html;    
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    }, (error) => {
        console.error('Error loading data:', error);
        const tableBody = document.getElementById('history-tbody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #e53e3e;">Error loading data. Please refresh the page.</td></tr>';
        }
        // Hide loading overlay even on error
        if (loadingOverlay) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 100);
        }
    });
}


loadvehiclehistory();


const modal = document.getElementById('editModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editForm = document.getElementById('editForm');
const sendmaintenancebtn = document.getElementById('sendformaintainace');
const markasgroundedbtn = document.getElementById('markasgrounded');
const markasalrbtn = document.getElementById('markasalr');
const markasasrbtn = document.getElementById('markasasr');
markasgroundedbtn.addEventListener('click', () => {
    openEditModal("Grounded");
});
markasalrbtn.addEventListener('click', () => {
    openEditModal("Marking as A LR");
});
markasasrbtn.addEventListener('click', () => {
    openEditModal("Marking as A SR");
});
sendmaintenancebtn.addEventListener('click', () => {
    openEditModal("Maintenance");
});



function openEditModal(event) {
    document.getElementById('editevent').value = event || '';
    document.getElementById('editdate').valueAsDate = new Date();
    modal.classList.remove('hidden');
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function updateVehicleHistoryRecord(event, details, date) {
    const newKey = Date.now().toString();
    const updates = {};
    updates[`vehiclelist/${vehicleKey}/history/${newKey}`] = {
        event: event,
        details: details,
        date: date
    };

    update(ref(db), updates)
        .then(() => {
            showNotification('Maintenance record added successfully.');
            closeEditModal();
            loadvehiclehistory();
        })
        .catch((error) => {
            console.error('Error adding maintenance record:', error);
        });
}

function updaterecord(event, details, date, msg) {
    const voucherNo = Date.now().toString();
    if(role==='mtjco' || role==='mtnco'){
        const baNumber = sessionStorage.getItem('baNumber');
        let dbref = ref(db, `officernotification/mto/notifications/${voucherNo}`);
        const notificationData = {
            vehicleKey: vehicleKey,
            event: event,
            details: details,
            date: date,
            msg: 'Vehicle Number ' + vehicleKey + ' '+ msg + ' Details: ' + details,
        };
        update(dbref, notificationData)
        .then(() => {
            console.log('Notification sent to MTO successfully.');
            showNotification('Request sent to MTO successfully.');
            closeEditModal();
        })
        .catch((error) => {
            console.error('Error sending notification to MTO:', error);
        });
    }
    if(role==='mto' || role==='cc' || role==='clo'){
        if(role ==='mto'){
            let dbref = ref(db, `clo_cc_notification/${voucherNo}`);    
            updateVehicleHistoryRecord(event, details, date);
            const notificationData = {
                from: 'MTO',
                date: new Date().toISOString(),
                msg: 'Vehicle Number ' + vehicleKey + ' '+ msg + ' Details: ' + details,
            };
            update(dbref, notificationData)
            .then(() => {
                console.log('Notification sent to CLOC successfully.');
            })
            .catch((error) => {
                console.error('Error sending notification to CLOC:', error);
            });
            
                set(ref(db, 'clonotification'), true);
        }
        const dbref = ref(db, `vehiclelist/`+vehicleKey);
        update(dbref, {condition: event === 'Maintenance' ? 'inmaintenance' : event === 'Grounded' ? 'grounded' : event === 'Marking as A LR' ? 'alr' : event === 'Marking as A SR' ? 'asr' : dataCache.condition})
        .then(() => {
            loadvehicledata();
            console.log('Vehicle condition updated to In Maintenance.');
        })
        .catch((error) => {
            console.error('Error updating vehicle condition:', error);
        });
    }
   // printVehicleReciept(date, event, details, voucherNo);
}


document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const event = document.getElementById('editevent').value;
    const details = document.getElementById('editdetails').value;
    const date = document.getElementById('editdate').value;
    if(event === 'Maintenance'){
        updaterecord(event, details, date, "has request for maintenance.");
    } else if(event === 'Grounded'){
        updaterecord(event, details, date, "has request for to be marked as Grounded.");
    } else if(event === 'Marking as A LR'){
        updaterecord(event, details, date, "has request for to be marked as A LR.");
    } else if(event === 'Marking as A SR'){
        updaterecord(event, details, date, "has request for to be marked as A SR.");
    }
    closeEditModal();
});


function closeEditModal() {
    modal.classList.add('hidden');
}

modalCloseBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);

// Print function for vehicle history
function printVehicleHistory() {
    // Get vehicle details
    const vehicleType = document.getElementById('typeofvehicle').textContent;
    const vehicleNumber = document.getElementById('vehicleNumber').textContent;
    const unnumber = document.getElementById('unnumber').textContent;
    const classType = document.getElementById('classtype').textContent;
    const camp = document.getElementById('camp').value;
    const condition = document.getElementById('condition').textContent;
    
    // Get history table data
    const historyTableBody = document.getElementById('history-tbody');
    let historyRows = '';
    
    // Build table rows from tbody
    for (let row of historyTableBody.rows) {
        historyRows += `
            <tr>
                <td>${row.cells[0].textContent}</td>
                <td>${row.cells[1].textContent}</td>
                <td>${row.cells[2].textContent}</td>
                <td>${row.cells[3].textContent}</td>
            </tr>
        `;
    }
    
    // Create PDF content
    const pdfContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; color: #007bff;">Vehicle History Report</h1>
                <p style="margin: 10px 0; color: #666;">Generated on ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Type of Vehicle:</span>
                    <span style="color: #666;">${vehicleType}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">BA Number:</span>
                    <span style="color: #666;">${vehicleNumber}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">UN Number:</span>
                    <span style="color: #666;">${unnumber}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Class:</span>
                    <span style="color: #666;">${classType}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Camp:</span>
                    <span style="color: #666;">${camp}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Condition:</span>
                    <span style="color: #666;">${condition}</span>
                </div>
            </div>
            
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #007bff;">Vehicle History</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #007bff; color: white; font-weight: 600;">Voucher No</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #007bff; color: white; font-weight: 600;">Date</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #007bff; color: white; font-weight: 600;">Event</th>
                        <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #007bff; color: white; font-weight: 600;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyRows}
                </tbody>
            </table>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>BD Army Store Management System - Vehicle History Report</p>
            </div>
        </div>
    `;
    
    // Create temporary element for PDF generation
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    
    // Configure PDF options
    const opt = {
        margin: 0.5,
        filename: `Vehicle_History_${vehicleNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    // Generate and download PDF
    html2pdf().set(opt).from(element).save().then(() => {
        console.log('PDF downloaded successfully');
    }).catch((error) => {
        console.error('Error generating PDF:', error);
    });
}




function printVehicleReciept(date, maintenanceType, description, voucherNo) {
    // Get vehicle details
    const vehicleType = document.getElementById('typeofvehicle').textContent;
    const vehicleNumber = document.getElementById('vehicleNumber').textContent;
    const unnumber = document.getElementById('unnumber').textContent;
    const classType = document.getElementById('classtype').textContent;
    const camp = document.getElementById('camp').value;
    const condition = document.getElementById('condition').textContent;
    
    // Create PDF content
    const pdfContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; color: #007bff;">Maintenance Report</h1>
                <p style="margin: 10px 0; color: #666;">Generated on ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Type of Vehicle:</span>
                    <span style="color: #666;">${vehicleType}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">BA Number:</span>
                    <span style="color: #666;">${vehicleNumber}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">UN Number:</span>
                    <span style="color: #666;">${unnumber}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Class:</span>
                    <span style="color: #666;">${classType}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Camp:</span>
                    <span style="color: #666;">${camp}</span>
                </div>
                <div style="display: flex;">
                    <span style="font-weight: 600; margin-right: 10px; min-width: 120px;">Condition:</span>
                    <span style="color: #666;">${condition}</span>
                </div>
            </div>
            <p style=" text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Voucher No:  <span style="font-weight: 400; color: #666;">  ${voucherNo}</span></p>
            <div style="text-align: left;margin-top: 20px;">
                <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px; padding-bottom: 5px;">Date: <span style="font-size: 14px; font-weight: 400; color: #666;"> ${date}</span></p>
                <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px; padding-bottom: 5px; margin-top: 20px;">Maintenance Type: <span style="font-size: 14px; font-weight: 400; color: #666;">${maintenanceType}</span></p>
                <p style="font-size: 16px; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px;">Description of Maintenance:</p>
                <p style="font-size: 14px; color: #666;">${description}</p>
                <p style="text-align:right; font-size: 16px; font-weight: 600; margin-bottom: 10px; margin-top: 150px; ">Performed By:</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p>BANRDB Store Management System - Vehicle Maintenance Report</p>
            </div>
        </div>`;
    
    // Create temporary element for PDF generation
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    
    // Configure PDF options
    const opt = {
        margin: 0.5,
        filename: `Maintenance_Report_${vehicleNumber}_${voucherNo}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'in', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    // Generate and download PDF
    html2pdf().set(opt).from(element).save().then(() => {
        console.log('PDF downloaded successfully');
    }).catch((error) => {
        console.error('Error generating PDF:', error);
    });
}

