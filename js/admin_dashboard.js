import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, get, onValue, ref, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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
    stores: [],
    roles: [],
    pendingLoads: 2
};

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
        storemanRole: value?.storemanRole || ""
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
                name: value?.name || key,
                underCommand: value?.underCommand || {}
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
    const totalStores = state.stores.length;
    const totalRoles = state.roles.length;

    const totalStoresEl = document.getElementById("totalStores");
    const totalRolesEl = document.getElementById("totalRoles");

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
                        <div class="status-pill assigned">${toLabel(store.officerRole) || "Pending"} </div>
                    </div>
                    <div class="assignment-box">
                        <span>Storeman</span>
                        <div class="status-pill assigned">${toLabel(store.storemanRole) || "Pending"}</div>
                    </div>
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

    rolesList.innerHTML = state.roles.map((role) => {
        const underCommandKeys = Object.keys(role.underCommand || {}).filter((key) => role.underCommand[key]);
        const underCommandCount = underCommandKeys.length;

        return `
            <article class="role-card">
                <div class="role-card-header">
                    <div>
                        <h3>${role.name}</h3>
                        <p class="role-key">${role.key}</p>
                    </div>
                    <span class="role-category ${role.category}">${toLabel(role.category)}</span>
                </div>
                <p class="role-description">This role is available under the ${toLabel(role.category)} category.</p>
                ${role.category === "officer" ? `<p class="command-summary">Under Command: ${underCommandCount} storeman role(s)</p>` : ""}
                ${role.category === "officer" ? `<div class="role-actions"><button class="store-action primary" type="button" onclick="openUnderCommandModal('${role.key}')">Add Under Command</button></div>` : ""}
            </article>
        `;
    }).join("");
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

function openUnderCommandModal(officerRoleKey) {
    const officerRole = state.roles.find((role) => role.category === "officer" && role.key === officerRoleKey);
    const list = document.getElementById("underCommandRoleList");
    const title = document.getElementById("underCommandTitle");
    const hiddenKey = document.getElementById("underCommandOfficerKey");

    if (!officerRole || !list || !title || !hiddenKey) {
        return;
    }

    const selectedMap = officerRole.underCommand || {};
    const storemanRoles = state.roles.filter((role) => role.category === "storeman");

    title.textContent = `Under Command: ${officerRole.name}`;
    hiddenKey.value = officerRoleKey;

    if (!storemanRoles.length) {
        list.innerHTML = `<p class="field-hint">No storeman roles available. Create storeman roles first.</p>`;
        openModal("underCommandModal");
        return;
    }

    list.innerHTML = storemanRoles.map((role) => `
        <label class="under-command-item">
            <input type="checkbox" value="${role.key}" ${selectedMap[role.key] ? "checked" : ""}>
            <span>${role.name}</span>
        </label>
    `).join("");

    openModal("underCommandModal");
}

async function saveUnderCommand() {
    const officerRoleKey = document.getElementById("underCommandOfficerKey")?.value || "";
    const list = document.getElementById("underCommandRoleList");

    if (!officerRoleKey || !list) {
        showNotification("Officer role is not selected.", "error", "Save Failed");
        return;
    }

    const checked = Array.from(list.querySelectorAll("input[type='checkbox']:checked"));
    const map = {};
    checked.forEach((input) => {
        map[input.value] = true;
    });

    await set(ref(db, `roles/officer/${officerRoleKey}/underCommand`), map);

    closeModal("underCommandModal");
    showNotification("Under command roles updated successfully.", "success", "Saved");
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

function subscribeStores() {
    onValue(ref(db, "stores"), (snapshot) => {
        state.stores = normalizeStores(snapshot.val());
        console.log(state.stores);
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
window.openUnderCommandModal = openUnderCommandModal;
window.closeModal = closeModal;
window.createStore = async () => {
    try {
        await createStore();
    } catch (error) {
        console.error("Failed to create store", error);
        showNotification("Could not create the store. Please try again.", "error", "Store Error");
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

window.saveUnderCommand = async () => {
    try {
        await saveUnderCommand();
    } catch (error) {
        console.error("Failed to save under command", error);
        showNotification("Could not save under command mapping. Please try again.", "error", "Save Error");
    }
};

window.addEventListener("DOMContentLoaded", () => {
    if (!ensureAdminAccess()) {
        return;
    }

    bindEvents();
    subscribeStores();
    subscribeRoles();

    const firstTab = document.querySelector(".tab-btn[data-tab='stores']");
    firstTab?.classList.add("active");

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }
});
