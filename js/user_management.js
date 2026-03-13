import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, onValue, ref, remove, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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


const state = {
    mode: "all",
    rawUsers: [],
    rawPendingUsers: [],
    users: [],
    pendingUsers: [],
    visibleRows: [],
    underCommand: null
};

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function showLoading() {
    document.getElementById("loadingOverlay")?.classList.remove("hidden");
 }

function hideLoading() {
    document.getElementById("loadingOverlay")?.classList.add("hidden");
}

function looksLikeUser(value) {
    return Boolean(value) && typeof value === "object" && ("userid" in value || "baNumber" in value || "name" in value || "role" in value);
}

function normalizeUser(value, key, dbPath) {
    const userid = String(value.userid || value.baNumber || key || "").trim();
    return {
        userid,
        name: value.name || "",
        rank: value.rank || "",
        role: value.role || "",
        store: value.store || value.storeCode || "",
        dbPath,
        raw: value
    };
}

function flattenUsersNode(node, currentPath = "users") {
    if (!node || typeof node !== "object") {
        return [];
    }

    const users = [];

    Object.entries(node).forEach(([key, value]) => {
        const dbPath = `${currentPath}/${key}`;

        if (looksLikeUser(value)) {
            users.push(normalizeUser(value, key, dbPath));
            return;
        }

        if (value && typeof value === "object") {
            users.push(...flattenUsersNode(value, dbPath));
        }
    });

    return users;
}

function flattenPendingNode(node, currentPath, sourceRoot, results) {
    if (!node || typeof node !== "object") {
        return;
    }

    Object.entries(node).forEach(([key, value]) => {
        const dbPath = `${currentPath}/${key}`;

        if (looksLikeUser(value)) {
            const pathParts = dbPath.split("/");
            const category = sourceRoot === "approval" ? pathParts[1] || "users" : "users";
            results.push({
                ...normalizeUser(value, key, dbPath),
                sourceRoot,
                category
            });
            return;
        }

        if (value && typeof value === "object") {
            flattenPendingNode(value, dbPath, sourceRoot, results);
        }
    });
}

function extractUnderCommandRoles(rawData) {
    const underCommandSet = new Set();
    if (!rawData) {
        return underCommandSet;
    }

    for (const key in rawData) {
        underCommandSet.add(rawData[key]);
    }

    return underCommandSet;
}

function shouldIncludeUserForRole(user, underCommand) {
    if (!user.userid || user.role === "cc" || user.role === "clo") {
        return false;
    }

    if (!underCommand) {
        return true;
    }

    return underCommand.has(user.role);
}

function shouldIncludePendingUserForRole(user, underCommand) {
    if (!user.userid) {
        return false;
    }

    if (!underCommand) {
        return true;
    }

    return underCommand.has(user.role);
}

function recomputeAndRender() {
    const underCommand = state.underCommand;

    state.users = state.rawUsers
        .filter((user) => shouldIncludeUserForRole(user, underCommand))
        .sort((a, b) => a.name.localeCompare(b.name));

    state.pendingUsers = state.rawPendingUsers
        .filter((user) => shouldIncludePendingUserForRole(user, underCommand))
        .sort((a, b) => a.name.localeCompare(b.name));

    applySearchAndRender();
}

function subscribeToRealtimeData() {
    const role = sessionStorage.getItem("role");
    const loadState = {
        users: false,
        approval: false,
        underCommand: role === "admin" || role === "clo" || role === "cc"
    };

    showLoading();

    const markLoaded = (key) => {
        if (loadState[key]) {
            return;
        }

        loadState[key] = true;
        if (Object.values(loadState).every(Boolean)) {
            hideLoading();
        }
    };

    onValue(ref(db, "users"), (snapshot) => {
        state.rawUsers = flattenUsersNode(snapshot.val());
        recomputeAndRender();
        markLoaded("users");
    }, (error) => {
        console.error("Failed to subscribe users", error);
        showNotification("Failed to load users in realtime.", "error", "Load Error");
        markLoaded("users");
    });

    onValue(ref(db, "approval"), (snapshot) => {
        const pending = [];
        flattenPendingNode(snapshot.val(), "approval", "approval", pending);
        state.rawPendingUsers = pending;
        recomputeAndRender();
        markLoaded("approval");
    }, (error) => {
        console.error("Failed to subscribe pending users", error);
        showNotification("Failed to load pending users in realtime.", "error", "Load Error");
        markLoaded("approval");
    });

    if (role === "admin" || role === "clo" || role === "cc") {
        state.underCommand = null;
        recomputeAndRender();
        return;
    }

    onValue(ref(db, `roles/officer/${role}/underCommand`), (snapshot) => {
        state.underCommand = extractUnderCommandRoles(snapshot.val());
        recomputeAndRender();
        markLoaded("underCommand");
    }, (error) => {
        console.error("Failed to subscribe under command roles", error);
        showNotification("Failed to load command roles in realtime.", "error", "Load Error");
        state.underCommand = new Set();
        recomputeAndRender();
        markLoaded("underCommand");
    });
}

function canViewPending() {
    const roleType = sessionStorage.getItem("role_type");
    const role = sessionStorage.getItem("role");
    // return roleType === "clo" || roleType === "cc" || role === "clo" || role === "cc";
    return true;
}

function ensureAccess() {
    const userid = sessionStorage.getItem("userid");
    const roleType = sessionStorage.getItem("role_type");

    if (!userid || !roleType) {
        showNotification("Session expired. Please log in again.", "error", "Unauthorized");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 600);
        return false;
    }

    if (!["officer", "clo", "cc", "admin"].includes(roleType)) {
        showNotification("Unauthorized access.", "error", "Unauthorized");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 600);
        return false;
    }

    return true;
}

function userMatchesSearch(user, query) {
    const rowText = [
        user.userid,
        user.rank,
        user.name,
        user.role,
        user.store
    ].join(" ").toLowerCase();

    return rowText.includes(query);
}

function convertRoleToLabel(role) {
    if (!role) {
        return "N/A";
    }
    return role
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function renderRows(rows, isPending = false) {
    const tableBody = document.getElementById("itemTableBody");
    if (!tableBody) {
        return;
    }

    if (!rows.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #5d7388;">No data found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = rows.map((user, index) => {


        const actionButtons = isPending
            ? `<button class="approve-btn" data-action="approve" data-index="${index}">Approve</button>
               <button class="delete-btn" data-action="reject" data-index="${index}">Reject</button>`
            : `<button class="delete-btn" data-action="delete" data-index="${index}">Delete</button>`;

        return `
            <tr data-id="${escapeHtml(user.userid)}">
                <td>${index + 1}</td>
                <td>${escapeHtml(user.userid || "-")}</td>
                <td>${escapeHtml(user.rank)}</td>
                <td>${escapeHtml(user.name || "-")}</td>
                <td>${escapeHtml(convertRoleToLabel(user.role))}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join("");
}

function applySearchAndRender() {
    const query = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
    const source = state.mode === "pending" ? state.pendingUsers : state.users;

    state.visibleRows = query ? source.filter((row) => userMatchesSearch(row, query)) : [...source];
    renderRows(state.visibleRows, state.mode === "pending");
}

function getApprovalDestinationPath(pendingUser) {
    return `users/${pendingUser.userid}`;
}

async function approvePending(index) {
    const pendingUser = state.visibleRows[index];
    console.log("Approving user:", pendingUser);
    if (!pendingUser) {
        return;
    }

    if (sessionStorage.getItem("role") === "guest") {
        showNotification("Guests are not authorized to approve users.", "error", "Unauthorized Action");
        return;
    }

    const destinationPath = getApprovalDestinationPath(pendingUser);
    const payload = {
        ...pendingUser.raw,
        userid: pendingUser.userid
    };

    await set(ref(db, destinationPath), payload);
    await remove(ref(db, pendingUser.dbPath));

    showNotification("User approved successfully", "success", "Approved");
}

async function rejectPending(index) {
    const pendingUser = state.visibleRows[index];
    if (!pendingUser) {
        return;
    }

    if (sessionStorage.getItem("role") === "guest") {
        showNotification("Guests are not authorized to reject users.", "error", "Unauthorized Action");
        return;
    }

    await remove(ref(db, pendingUser.dbPath));
    showNotification("User rejected successfully", "success", "Rejected");
}

async function deleteUser(index) {
    const user = state.visibleRows[index];
    if (!user) {
        return;
    }

    if (sessionStorage.getItem("role") === "guest") {
        showNotification("Guests are not authorized to delete users.", "error", "Unauthorized Action");
        return;
    }

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        return;
    }

    await remove(ref(db, user.dbPath));
    showNotification("User deleted successfully", "success", "Deleted");
}

function bindEvents() {
    const searchInput = document.getElementById("searchInput");
    searchInput?.addEventListener("input", applySearchAndRender);

    const pendingButton = document.getElementById("PendingUser");
    if (pendingButton && !canViewPending()) {
        pendingButton.style.display = "none";
    }

    pendingButton?.addEventListener("click", () => {
        if (!canViewPending()) {
            return;
        }

        state.mode = state.mode === "all" ? "pending" : "all";
        pendingButton.textContent = state.mode === "pending" ? "View All Users" : "View Pending Approvals";
        applySearchAndRender();
    });

    const tableBody = document.getElementById("itemTableBody");
    tableBody?.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const index = Number(button.dataset.index);
        const action = button.dataset.action;

        try {
            if (action === "delete") {
                await deleteUser(index);
                return;
            }

            if (action === "approve") {
                await approvePending(index);
                return;
            }

            if (action === "reject") {
                await rejectPending(index);
            }
        } catch (error) {
            console.error("User action failed", error);
            showNotification("Action failed. Please try again.", "error", "Operation Failed");
        }
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    // if (!ensureAccess()) {
    //     return;
    // }

    bindEvents();
    subscribeToRealtimeData();
});
