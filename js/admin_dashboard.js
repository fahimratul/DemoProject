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

const MAX_STORE_IMAGE_BYTES = 40 * 1024;

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getDatabase(app);

const state = {
    users: [],
    stores: [],
    roles: [],
    activeAssignType: "storeman",
    pendingLoads: 3
};

function looksLikeUser(value) {
    return Boolean(value) && typeof value === "object" && ("userid" in value || "baNumber" in value || "name" in value || "role" in value);
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
                userid: String(value.userid || value.baNumber || key),
                name: value.name || "Unknown User",
                role: value.role || "",
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
        description: value?.description || `Store for ${value?.name || code}`,
        imageDataUrl: value?.imageDataUrl || value?.image?.dataUrl || "",
        image: value?.image || null,
        officerRole: value?.officerRole || "",
        storemanRole: value?.storemanRole || "",
        assignedOfficer: value?.assignedOfficer || null,
        assignedStoreman: value?.assignedStoreman || null
    })).sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeRoles(snapshotValue) {
    if (!snapshotValue || typeof snapshotValue !== "object") {
        return [];
    }

    const roles = [];

    Object.entries(snapshotValue).forEach(([category, categoryRoles]) => {
        if (!categoryRoles || typeof categoryRoles !== "object") {
            return;
        }

        Object.entries(categoryRoles).forEach(([key, value]) => {
            roles.push({
                key,
                category,
                name: value?.name || key
            });
        });
    });

    return roles.sort((left, right) => {
        const byCategory = left.category.localeCompare(right.category);
        if (byCategory !== 0) {
            return byCategory;
        }
        return left.name.localeCompare(right.name);
    });
}

function toLabel(value) {
    if (!value) {
        return "N/A";
    }

    return String(value)
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function hideLoadingOverlay() {
    state.pendingLoads -= 1;
    if (state.pendingLoads <= 0) {
        document.getElementById("loadingOverlay")?.classList.add("hidden");
    }
}

function ensureAdminAccess() {
    const roleType = sessionStorage.getItem("role_type");
    const role = sessionStorage.getItem("role");

    if (roleType && roleType !== "admin" && role !== "admin") {
        showNotification("Unauthorized access. Please sign in as admin.", "error", "Access Denied");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);
        return false;
    }

    return true;
}

function updateStats() {
    const totalUsers = state.users.length;
    const totalStores = state.stores.length;
    const totalRoles = state.roles.length;

    const totalUsersEl = document.getElementById("totalUsers");
    const totalStoresEl = document.getElementById("totalStores");
    const totalRolesEl = document.getElementById("totalRoles");

    if (totalUsersEl) totalUsersEl.textContent = String(totalUsers);
    if (totalStoresEl) totalStoresEl.textContent = String(totalStores);
    if (totalRolesEl) totalRolesEl.textContent = String(totalRoles);
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
                        ${store.imageDataUrl ? `<img class="store-cover" src="${store.imageDataUrl}" alt="${store.name} image">` : ""}
                    </div>
                    <span class="store-code">${store.code}</span>
                </div>
                <div class="assignment-panel">
                    <div class="assignment-box">
                        <span>Officer</span>
                        <strong>${officer ? `${officer.name} (${officer.userid})` : "Not assigned"}</strong>
                        <div class="status-pill ${officer ? "" : "unassigned"}">${officer ? toLabel(officer.role) : (store.officerRole ? toLabel(store.officerRole) : "Pending")}</div>
                    </div>
                    <div class="assignment-box">
                        <span>Storeman</span>
                        <strong>${storeman ? `${storeman.name} (${storeman.userid})` : "Not assigned"}</strong>
                        <div class="status-pill ${storeman ? "" : "unassigned"}">${storeman ? toLabel(storeman.role) : (store.storemanRole ? toLabel(store.storemanRole) : "Pending")}</div>
                    </div>
                </div>
                <div class="store-card-actions">
                    <button class="store-action primary" type="button" onclick="openAssignModal('${store.code}', 'officer')">Assign Officer</button>
                    <button class="store-action secondary" type="button" onclick="openAssignModal('${store.code}', 'storeman')">Assign Storeman</button>
                </div>
            </article>
        `;
    }).join("");
}

function renderRoles() {
    const rolesList = document.getElementById("rolesList");
    if (!rolesList) {
        return;
    }

    if (!state.roles.length) {
        rolesList.innerHTML = `
            <div class="empty-state">
                <h3>No roles available</h3>
                <p>Create a role to organize officer and storeman access.</p>
            </div>
        `;
        return;
    }

    rolesList.innerHTML = state.roles.map((role) => `
        <article class="role-card">
            <div class="role-card-header">
                <div>
                    <h3>${role.name}</h3>
                    <p class="role-key">${role.key}</p>
                </div>
                <span class="role-category ${role.category}">${toLabel(role.category)}</span>
            </div>
            <p class="role-description">This role is available under the ${toLabel(role.category)} category.</p>
        </article>
    `).join("");
}

function populateAssignUserOptions(type) {
    const select = document.getElementById("assignUser");
    const storeCode = document.getElementById("assignStoreCode")?.value || "";

    if (!select) {
        return;
    }

    const store = state.stores.find((entry) => entry.code === storeCode);
    const expectedRole = type === "officer" ? (store?.officerRole || "") : (store?.storemanRole || "");

    let eligibleUsers = state.users.filter((user) => {
        if (type === "officer") {
            return ["cc", "clo", "lo", "so", "eo", "mto", "workshop", "medical", "stationary", "cimic"].includes(user.role);
        }

        return ["signco", "engrnco", "bqms", "bknco", "mtnco", "mtjco", "ammonco", "workshopnco", "medicalnco", "stationarynco", "cimicnco"].includes(user.role);
    });

    if (expectedRole) {
        eligibleUsers = eligibleUsers.filter((user) => user.role === expectedRole);
    }

    select.innerHTML = `<option value="">-- Select a user --</option>${eligibleUsers.map((user) => `
        <option value="${user.userid}">${user.userid} - ${user.name} (${toLabel(user.role)})</option>
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
    const officerRoleSelect = document.getElementById("officerRole");
    const storemanRoleSelect = document.getElementById("storemanRole");

    if (officerRoleSelect && storemanRoleSelect) {
        officerRoleSelect.innerHTML = `<option value="">-- Select an officer role --</option>${state.roles
            .filter((role) => role.category === "officer")
            .map((role) => `<option value="${role.key}">${role.name}</option>`)
            .join("")}`;

        storemanRoleSelect.innerHTML = `<option value="">-- Select a storeman role --</option>${state.roles
            .filter((role) => role.category === "storeman")
            .map((role) => `<option value="${role.key}">${role.name}</option>`)
            .join("")}`;
    }

    const storeImage = document.getElementById("storeImage");
    const storeImageHint = document.getElementById("storeImageHint");

    if (storeImage) {
        storeImage.value = "";
    }

    if (storeImageHint) {
        storeImageHint.textContent = "Allowed: image files only, up to 40 KB.";
    }

    openModal("createStoreModal");
}

function openCreateRoleModal() {
    openModal("createRoleModal");
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

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
    });
}

async function createRole() {
    const roleName = document.getElementById("roleName")?.value.trim() || "";
    const category = document.getElementById("roleCategory")?.value || "";

    if (!roleName || !category) {
        showNotification("Role name and category are required.", "warning", "Validation Error");
        return;
    }

    const roleKey = roleName.toLowerCase().replace(/\s+/g, "_");
    const roleRef = ref(db, `roles/${category}/${roleKey}`);
    const existing = await get(roleRef);

    if (existing.exists()) {
        showNotification("A role with this name already exists.", "error", "Duplicate Role");
        return;
    }

    await set(roleRef, {
        name: roleName,
        category
    });

    document.getElementById("roleName").value = "";
    document.getElementById("roleCategory").value = "";
    closeModal("createRoleModal");
    showNotification("Role created successfully.", "success", "Role Created");
}

async function createStore() {
    const name = document.getElementById("storeName")?.value.trim() || "";
    const officerRole = document.getElementById("officerRole")?.value.trim() || "";
    const storemanRole = document.getElementById("storemanRole")?.value.trim() || "";
    const imageInput = document.getElementById("storeImage");
    const imageFile = imageInput?.files?.[0] || null;

    if (!name || !officerRole || !storemanRole) {
        showNotification("Store name and assigned roles are required.", "warning", "Validation Error");
        return;
    }

    let imageDataUrl = "";
    let imageMeta = null;

    if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
            showNotification("Only image files are allowed.", "warning", "Validation Error");
            return;
        }

        if (imageFile.size > MAX_STORE_IMAGE_BYTES) {
            showNotification("Image must be 40 KB or smaller.", "warning", "Validation Error");
            return;
        }

        imageDataUrl = await readFileAsDataUrl(imageFile);
        imageMeta = {
            fileName: imageFile.name,
            contentType: imageFile.type,
            sizeBytes: imageFile.size,
            dataUrl: imageDataUrl
        };
    }

    const storeCode = sanitizeStoreCode(name);
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
        description: `Store for ${name}`,
        officerRole,
        storemanRole,
        imageDataUrl,
        image: imageMeta,
        assignedOfficer: null,
        assignedStoreman: null,
        createdAt: new Date().toISOString()
    });

    document.getElementById("storeName").value = "";
    document.getElementById("officerRole").value = "";
    document.getElementById("storemanRole").value = "";
    if (imageInput) {
        imageInput.value = "";
    }

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

    await update(ref(db, `stores/${storeCode}`), {
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
        state.users = flattenUsers(snapshot.val()).sort((left, right) => left.name.localeCompare(right.name));
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

function subscribeRoles() {
    onValue(ref(db, "roles"), (snapshot) => {
        state.roles = normalizeRoles(snapshot.val());
        renderRoles();
        updateStats();
        hideLoadingOverlay();
    }, (error) => {
        console.error("Failed to load roles", error);
        showNotification("Failed to load roles from the database.", "error", "Load Error");
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

    document.getElementById("storeImage")?.addEventListener("change", (event) => {
        const input = event.target;
        const file = input?.files?.[0] || null;
        const hint = document.getElementById("storeImageHint");

        if (!hint) {
            return;
        }

        if (!file) {
            hint.textContent = "Allowed: image files only, up to 40 KB.";
            return;
        }

        hint.textContent = `Selected: ${file.name} (${file.size} bytes)`;
        if (file.size > MAX_STORE_IMAGE_BYTES) {
            hint.textContent = `Selected file is too large (${file.size} bytes). Max allowed is ${MAX_STORE_IMAGE_BYTES} bytes.`;
        }
    });
}

window.openCreateStoreModal = openCreateStoreModal;
window.openCreateRoleModal = openCreateRoleModal;
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
window.createRole = async () => {
    try {
        await createRole();
    } catch (error) {
        console.error("Failed to create role", error);
        showNotification("Could not create the role. Please try again.", "error", "Role Error");
    }
};

window.addEventListener("DOMContentLoaded", () => {
    if (!ensureAdminAccess()) {
        return;
    }

    bindEvents();
    subscribeUsers();
    subscribeStores();
    subscribeRoles();

    const firstTab = document.querySelector(".tab-btn[data-tab='stores']");
    firstTab?.classList.add("active");

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }
});
