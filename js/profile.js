import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, get, ref, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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
    userid: sessionStorage.getItem("userid") || "",
    roleType: sessionStorage.getItem("role_type") || "",
    roleKey: sessionStorage.getItem("role") || "",
    user: null
};

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

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function renderEmpty(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = `<div class="empty">${message}</div>`;
}

function renderUserInfo(user) {
    setText("infoName", user?.name || sessionStorage.getItem("username") || "N/A");
    setText("infoRank", user?.rank || sessionStorage.getItem("rank") || "N/A");
    setText("infoUserId", state.userid || "N/A");
    setText("infoRole", toLabel(user?.role || state.roleKey));
    setText("roleTypeChip", toLabel(user?.role_type || state.roleType));
}

function renderAssignedStores(stores) {
    const container = document.getElementById("storeList");
    setText("storeCountChip", String(stores.length));

    if (!container) {
        return;
    }

    if (!stores.length) {
        renderEmpty("storeList", "No store is currently assigned to your role.");
        return;
    }

    container.innerHTML = stores.map((store) => `
        <article class="list-card">
            <h3>${store.name || store.code}</h3>
            <p><strong>Code:</strong> ${store.code}</p>
            <p><strong>Officer Role:</strong> ${toLabel(store.officerRole)}</p>
            <p><strong>Storeman Role:</strong> ${toLabel(store.storemanRole)}</p>
        </article>
    `).join("");
}

function renderUnderCommand(roleNames, users, hintText) {
    const roleList = document.getElementById("underCommandRoleList");
    const userList = document.getElementById("underCommandUserList");

    setText("underCommandHint", hintText);
    setText("underCommandCountChip", String(users.length));

    if (roleList) {
        if (roleNames.length) {
            roleList.innerHTML = roleNames.map((name) => `<span class="role-pill">${name}</span>`).join("");
        } else {
            roleList.innerHTML = "";
        }
    }

    if (!userList) {
        return;
    }

    if (!users.length) {
        renderEmpty("underCommandUserList", "No under-command users found.");
        return;
    }

    userList.innerHTML = users.map((user) => `
        <article class="list-card">
            <h3>${user.name || "Unknown"}</h3>
            <p><strong>BA Number:</strong> ${user.userid}</p>
            <p><strong>Rank:</strong> ${user.rank || "N/A"}</p>
            <p><strong>Role:</strong> ${toLabel(user.role)}</p>
        </article>
    `).join("");
}

function setupActions() {
    const showPasswords = document.getElementById("showPasswords");
    const passwordInputs = ["currentPassword", "newPassword", "confirmPassword"];

    showPasswords?.addEventListener("change", (event) => {
        const isVisible = Boolean(event.target?.checked);
        passwordInputs.forEach((id) => {
            const input = document.getElementById(id);
            if (input) {
                input.type = isVisible ? "text" : "password";
            }
        });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "index.html";
    });

    document.getElementById("goBackBtn")?.addEventListener("click", () => {
        if (state.roleType === "admin") {
            window.location.href = "admin_dashboard.html";
            return;
        }

        if (state.roleType === "officer") {
            window.location.href = "officer_homepage.html";
            return;
        }

        if (state.roleType === "storeman") {
            window.location.href = "dashboard/storeman_dashboard.html";
            return;
        }
        if (state.roleType === "clo" || state.roleType === "cc" || state.roleType === "guest") {
            window.location.href = "clodashboard.html";
            return;
        }

        window.location.href = "index.html";
    });

    document.getElementById("passwordForm")?.addEventListener("submit", handlePasswordChange);
}

async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword")?.value || "";
    const newPassword = document.getElementById("newPassword")?.value || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification("Please fill in all password fields.", "warning", "Validation Error");
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification("New passwords do not match.", "error", "Validation Error");
        return;
    }

    if (newPassword.length < 6) {
        showNotification("New password must be at least 6 characters long.", "error", "Validation Error");
        return;
    }

    if (!state.user || state.user.password !== currentPassword) {
        showNotification("Current password is incorrect.", "error", "Validation Error");
        return;
    }

    try {
        await update(ref(db, `users/${state.userid}`), { password: newPassword });
        state.user.password = newPassword;

        if (localStorage.getItem("userid") === state.userid) {
            localStorage.setItem("password", newPassword);
        }

        const form = document.getElementById("passwordForm");
        form?.reset();
        showNotification("Password updated successfully.", "success", "Success");
    } catch (error) {
        console.error("Failed to update password:", error);
        showNotification("Unable to update password.", "error", "Update Failed");
    }
}

async function loadProfile() {
    if (!state.userid) {
        showNotification("Please login first.", "error", "Unauthorized");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 700);
        return;
    }

    try {
        const [userSnap, storesSnap, rolesSnap, usersSnap] = await Promise.all([
            get(ref(db, `users/${state.userid}`)),
            get(ref(db, "stores")),
            get(ref(db, "roles")),
            get(ref(db, "users"))
        ]);

        if (!userSnap.exists()) {
            showNotification("User data not found.", "error", "Data Error");
            renderEmpty("storeList", "Could not load user profile.");
            renderEmpty("underCommandUserList", "Could not load under-command users.");
            return;
        }

        const user = userSnap.val() || {};
        state.user = user;
        state.roleType = user.role_type || state.roleType;
        state.roleKey = user.role || state.roleKey;

        renderUserInfo(user);

        const stores = storesSnap.exists() ? storesSnap.val() : {};
        const assignedStores = Object.entries(stores)
            .map(([code, value]) => ({
                code,
                ...(value || {})
            }))
            .filter((store) => {
                return store.officerRole === state.roleKey || store.storemanRole === state.roleKey;
            });

        renderAssignedStores(assignedStores);

        if (state.roleType !== "officer") {
            renderUnderCommand([], [], "Under-command view is available for officer roles.");
            return;
        }

        const roleMap = rolesSnap.exists() ? rolesSnap.val() : {};
        const officerRole = roleMap?.officer?.[state.roleKey] || {};
        const underCommandMap = officerRole?.underCommand || {};
        const underRoleKeys = Object.keys(underCommandMap).filter((key) => Boolean(underCommandMap[key]));

        if (!underRoleKeys.length) {
            renderUnderCommand([], [], "No storeman roles are assigned as under command.");
            return;
        }

        const storemanRoleMap = roleMap?.storeman || {};
        const underRoleNames = underRoleKeys.map((key) => toLabel(storemanRoleMap?.[key]?.name || key));

        const usersMap = usersSnap.exists() ? usersSnap.val() : {};
        const underCommandUsers = Object.entries(usersMap)
            .map(([userid, value]) => ({
                userid,
                ...(value || {})
            }))
            .filter((member) => underRoleKeys.includes(member.role));

        renderUnderCommand(underRoleNames, underCommandUsers, "These users belong to your under-command storeman roles.");
    } catch (error) {
        console.error("Failed to load profile:", error);
        showNotification("Failed to load profile data.", "error", "Load Error");
        renderEmpty("storeList", "An error occurred while loading assigned stores.");
        renderEmpty("underCommandUserList", "An error occurred while loading under-command users.");
    }
}

setupActions();
loadProfile();
