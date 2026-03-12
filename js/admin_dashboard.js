import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, get, onValue, ref, set, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { showNotification } from "./notification.js";

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
getAnalytics(app);
const db = getDatabase(app);

const rankLabels = {
    snk: "Sainik",
    lcpl: "Lance Corporal",
    cpl: "Corporal",
    sgt: "Sergeant",
    wo: "Warrant Officer",
    swo: "Senior Warrant Officer",
    mwo: "Master Warrant Officer",
    lt: "Lieutenant",
    capt: "Captain",
    major: "Major",
    ltcol: "Lieutenant Colonel",
    col: "Colonel",
    brig: "Brigadier",
    majorgen: "Major General",
    ltgen: "Lieutenant General",
    gen: "General"
};

const roleLabels = {
    admin: "Admin",
    cc: "Contingent Commander",
    clo: "Chief Logistics Officer",
    lo: "Logistics Officer",
    so: "Signal Officer",
    eo: "Engineer Officer",
    mto: "Military Transport Officer",
    workshop: "Workshop Officer",
    medical: "Medical Officer",
    stationary: "Adjutant",
    cimic: "Cimic Officer",
    guest: "Guest",
    signco: "Storeman (Signal)",
    engrnco: "Storeman (Engineer)",
    bqms: "BQMS",
    bknco: "Barrack NCO",
    mtnco: "MT NCO",
    mtjco: "MT JCO",
    ammonco: "Ammo NCO",
    workshopnco: "Workshop NCO",
    medicalnco: "Storeman (Medical)",
    stationarynco: "Storeman (Stationary)",
    cimicnco: "Storeman (Cimic)"
};

const officerRoles = new Set(["cc", "clo", "lo", "so", "eo", "mto", "workshop", "medical", "stationary", "cimic"]);
const storemanRoles = new Set(["signco", "engrnco", "bqms", "bknco", "mtnco", "mtjco", "ammonco", "workshopnco", "medicalnco", "stationarynco", "cimicnco"]);

const state = {
    users: [],
    filteredUsers: [],
    stores: [],
    activeAssignType: "storeman",
    pendingLoads: 2
};

function looksLikeUser(value) {
    return Boolean(value) && typeof value === "object" && ("userid" in value || "name" in value || "role" in value);
}

function flattenUsers(node, currentPath = "users") {
    if (!node || typeof node !== "object") {
        return [];
    }

    const users = [];

    Object.entries(node).forEach(([key, value]) => {
        const nextPath = `${currentPath}/${key}`;
        if (looksLikeUser(value)) {
            users.push({
                key,
                dbPath: nextPath,
                userid: String(value.userid || key),
                name: value.name || "Unknown User",
                rank: value.rank || "",
                role: value.role || "",
                store: value.store || value.storeCode || "",
                raw: value
            });
            return;
        }

        if (value && typeof value === "object") {
            users.push(...flattenUsers(value, nextPath));
        }
    });

    return users;
}

function normalizeStores(snapshotValue) {
    if (!snapshotValue || typeof snapshotValue !== "object") {
        return [];
    }

    return Object.entries(snapshotValue).map(([code, value]) => ({
        code,
        name: value?.name || code,
        description: value?.description || "No description provided.",
        assignedOfficer: value?.assignedOfficer || null,
        assignedStoreman: value?.assignedStoreman || null
    })).sort((left, right) => left.name.localeCompare(right.name));
}

function getRoleLabel(role) {
    return roleLabels[role] || role || "Unassigned";
}

function getRankLabel(rank) {
    return rankLabels[rank] || rank || "-";
}

function isOfficer(user) {
    return officerRoles.has(user.role);
}

function isStoreman(user) {
    return storemanRoles.has(user.role);
}

function hideLoadingOverlay() {
    state.pendingLoads -= 1;
    if (state.pendingLoads <= 0) {
        document.getElementById("loadingOverlay")?.classList.add("hidden");
    }
}

function ensureAdminAccess() {
    // const roleType = sessionStorage.getItem("role_type");
    // const role = sessionStorage.getItem("role");

    // if (roleType !== "admin" && role !== "admin") {
    //     showNotification("Unauthorized access. Please sign in as admin.", "error", "Access Denied");
    //     setTimeout(() => {
    //         window.location.href = "index.html";
    //     }, 800);
    //     return false;
    // }

    return true;
}

function updateStats() {
    const totalUsers = state.users.length;
    const totalStores = state.stores.length;
    const totalOfficers = state.users.filter(isOfficer).length;
    const totalStoremen = state.users.filter(isStoreman).length;

    document.getElementById("totalUsers").textContent = totalUsers;
    document.getElementById("totalStores").textContent = totalStores;
    document.getElementById("totalOfficers").textContent = totalOfficers;
    document.getElementById("totalStoremen").textContent = totalStoremen;
}

function renderUsersTable(users) {
    const tableBody = document.getElementById("usersTableBody");
    if (!tableBody) {
        return;
    }

    if (!users.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color:#5d7388; padding:2rem;">No users found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${user.userid}</td>
            <td>${getRankLabel(user.rank)}</td>
            <td>${user.name}</td>
            <td>${getRoleLabel(user.role)}</td>
            <td>${user.store || "-"}</td>
        </tr>
    `).join("");
}

function renderStores() {
    const storesGrid = document.getElementById("storesGrid");
    if (!storesGrid) {
        return;
    }

    if (!state.stores.length) {
        storesGrid.innerHTML = `
            <div class="empty-state">
                <h3>No stores available</h3>
                <p>Create your first store to start assigning officers and storemen.</p>
            </div>
        `;
        return;
    }

    storesGrid.innerHTML = state.stores.map((store) => {
        const officer = store.assignedOfficer;
        const storeman = store.assignedStoreman;

        return `
            <article class="store-card">
                <div class="store-card-header">
                    <div>
                        <h3>${store.name}</h3>
                        <p class="store-description">${store.description}</p>
                    </div>
                    <span class="store-code">${store.code}</span>
                </div>
                <div class="assignment-panel">
                    <div class="assignment-box">
                        <span>Officer</span>
                        <strong>${officer ? `${officer.name} (${officer.userid})` : "Not assigned"}</strong>
                        <div class="status-pill ${officer ? "" : "unassigned"}">${officer ? getRoleLabel(officer.role) : "Pending"}</div>
                    </div>
                    <div class="assignment-box">
                        <span>Storeman</span>
                        <strong>${storeman ? `${storeman.name} (${storeman.userid})` : "Not assigned"}</strong>
                        <div class="status-pill ${storeman ? "" : "unassigned"}">${storeman ? getRoleLabel(storeman.role) : "Pending"}</div>
                    </div>
                </div>
                <div class="store-card-actions">
                    <button class="store-action primary" type="button" onclick="openAssignModal('${store.code}', 'officer')">Assign Officer</button>
                    <button class="store-action secondary" type="button" onclick="openAssignModal('${store.code}', 'storeman')">Assign Storeman</button>
                </div>
            </article>
        `;
    }).join("");

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }
}

function filterUsers() {
    const searchValue = document.getElementById("userSearchInput")?.value.trim().toLowerCase() || "";

    state.filteredUsers = state.users.filter((user) => {
        const haystack = [user.userid, user.name, getRankLabel(user.rank), getRoleLabel(user.role), user.store]
            .join(" ")
            .toLowerCase();
        return haystack.includes(searchValue);
    });

    renderUsersTable(state.filteredUsers);
}

function populateAssignUserOptions(type) {
    const select = document.getElementById("assignUser");
    if (!select) {
        return;
    }

    const eligibleUsers = state.users.filter((user) => type === "officer" ? isOfficer(user) : isStoreman(user));

    select.innerHTML = `<option value="">-- Select a user --</option>${eligibleUsers.map((user) => `
        <option value="${user.userid}">${user.userid} - ${user.name} (${getRoleLabel(user.role)})</option>
    `).join("")}`;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    modal.style.display = "flex";
    modal.classList.add("open");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }

    modal.classList.remove("open");
    modal.style.display = "none";
}

function openCreateStoreModal() {
    openModal("createStoreModal");
}

function openAssignModal(storeCode, type = "storeman") {
    state.activeAssignType = type;

    document.getElementById("assignStoreCode").value = storeCode;
    document.getElementById("assignType").value = type;
    document.getElementById("assignModalTitle").textContent = `Assign ${type === "officer" ? "Officer" : "Storeman"}`;

    populateAssignUserOptions(type);
    openModal("assignModal");
}

function sanitizeStoreCode(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function createStore() {
    const name = document.getElementById("storeName")?.value.trim() || "";
    const rawCode = document.getElementById("storeCode")?.value.trim() || "";
    const description = document.getElementById("storeDescription")?.value.trim() || "";

    if (!name || !rawCode) {
        showNotification("Store name and code are required.", "warning", "Validation Error");
        return;
    }

    const storeCode = sanitizeStoreCode(rawCode);
    if (!storeCode) {
        showNotification("Store code must contain letters or numbers.", "warning", "Validation Error");
        return;
    }

    const storeRef = ref(db, `stores/${storeCode}`);
    const existing = await get(storeRef);

    if (existing.exists()) {
        showNotification("A store with this code already exists.", "error", "Duplicate Store");
        return;
    }

    await set(storeRef, {
        name,
        code: storeCode,
        description: description || "No description provided.",
        assignedOfficer: null,
        assignedStoreman: null,
        createdAt: new Date().toISOString()
    });

    document.getElementById("storeName").value = "";
    document.getElementById("storeCode").value = "";
    document.getElementById("storeDescription").value = "";
    closeModal("createStoreModal");
    showNotification("Store created successfully.", "success", "Store Created");
}

async function assignPersonnel() {
    const assignType = document.getElementById("assignType")?.value || state.activeAssignType;
    const userid = document.getElementById("assignUser")?.value || "";
    const storeCode = document.getElementById("assignStoreCode")?.value || "";

    if (!storeCode || !userid) {
        showNotification("Select a user before assigning personnel.", "warning", "Validation Error");
        return;
    }

    const user = state.users.find((entry) => entry.userid === userid);
    if (!user) {
        showNotification("Selected user could not be found.", "error", "Assignment Failed");
        return;
    }

    const storeField = assignType === "officer" ? "assignedOfficer" : "assignedStoreman";
    const storeRef = ref(db, `stores/${storeCode}`);
    await update(storeRef, {
        [storeField]: {
            userid: user.userid,
            name: user.name,
            role: user.role
        }
    });

    await update(ref(db, user.dbPath), {
        store: storeCode
    });

    closeModal("assignModal");
    showNotification(`${user.name} assigned successfully.`, "success", "Assignment Complete");
}

function subscribeUsers() {
    onValue(ref(db, "users"), (snapshot) => {
        const users = flattenUsers(snapshot.val())
            .filter((user) => user.role !== "admin")
            .sort((left, right) => left.name.localeCompare(right.name));

        state.users = users;
        filterUsers();
        updateStats();
        hideLoadingOverlay();
    }, (error) => {
        console.error("Failed to load users", error);
        showNotification("Failed to load users from the database.", "error", "Load Error");
        hideLoadingOverlay();
    });
}

function subscribeStores() {
    onValue(ref(db, "stores"), (snapshot) => {
        state.stores = normalizeStores(snapshot.val());
        renderStores();
        updateStats();
        hideLoadingOverlay();
    }, (error) => {
        console.error("Failed to load stores", error);
        showNotification("Failed to load stores from the database.", "error", "Load Error");
        hideLoadingOverlay();
    });
}

function bindEvents() {
    document.getElementById("assignType")?.addEventListener("change", (event) => {
        state.activeAssignType = event.target.value;
        populateAssignUserOptions(state.activeAssignType);
    });

    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            document.querySelectorAll(".modal-overlay.open").forEach((modal) => closeModal(modal.id));
        }
    });
}

window.filterUsers = filterUsers;
window.openCreateStoreModal = openCreateStoreModal;
window.openAssignModal = openAssignModal;
window.closeModal = closeModal;
window.createStore = async () => {
    try {
        await createStore();
    } catch (error) {
        console.error("Failed to create store", error);
        showNotification("Could not create the store. Please try again.", "error", "Store Error");
    }
};
window.assignPersonnel = async () => {
    try {
        await assignPersonnel();
    } catch (error) {
        console.error("Failed to assign personnel", error);
        showNotification("Could not assign personnel. Please try again.", "error", "Assignment Error");
    }
};

window.addEventListener("DOMContentLoaded", () => {
    if (!ensureAdminAccess()) {
        return;
    }

    bindEvents();
    subscribeUsers();
    subscribeStores();

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }
});