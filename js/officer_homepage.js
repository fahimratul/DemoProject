import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getDatabase, get, ref } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
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
    username: sessionStorage.getItem("username") || "Officer",
    roleType: sessionStorage.getItem("role_type") || "",
    roleKey: sessionStorage.getItem("role") || ""
};

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function renderStores(stores) {
    const grid = document.getElementById("storeGrid");
    setText("storeCount", String(stores.length));

    if (!grid) {
        return;
    }

    if (!stores.length) {
        grid.innerHTML = `<div class="empty">No store is assigned to your officer role yet.</div>`;
        return;
    }

    grid.innerHTML = stores.map((store) => {
        const image = store.imageDataUrl || store?.image?.dataUrl || "";
        const imageBlock = image
            ? `<img class="store-image" src="${escapeHtml(image)}" alt="${escapeHtml(store.name || store.code)} image">`
            : `<div class="store-image placeholder">No Image</div>`;

        return `
            <article class="store-card">
                ${imageBlock}
                <div class="store-body">
                    <h3>${escapeHtml(store.name || store.code)}</h3>
                    <p class="store-meta"><strong>Code:</strong> ${escapeHtml(store.code)}</p>
                    <p class="store-meta"><strong>Officer Role:</strong> ${escapeHtml(store.officerRole || "-")}</p>
                    <button type="button" class="open-btn" data-store-code="${escapeHtml(store.code)}" data-store-name="${escapeHtml(store.name || store.code)}">
                        Open Inventory
                    </button>
                </div>
            </article>
        `;
    }).join("");

    grid.querySelectorAll(".open-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const storeCode = button.getAttribute("data-store-code") || "";
            const storeName = button.getAttribute("data-store-name") || "";

            sessionStorage.setItem("selected_store_code", storeCode);
            sessionStorage.setItem("selected_store_name", storeName);
            window.location.href = "dashboard/officer_dashboard.html";
        });
    });
}

async function initPage() {
    if (!state.userid || state.roleType !== "officer") {
        showNotification("Please login as officer first.", "error", "Unauthorized");
        setTimeout(() => {
            window.location.href = "index.html";
        }, 700);
        return;
    }

    setText("welcomeTitle", `${state.username}'s Assigned Stores`);

    try {
        const [userSnap, storesSnap] = await Promise.all([
            get(ref(db, `users/${state.userid}`)),
            get(ref(db, "stores"))
        ]);

        if (!userSnap.exists()) {
            showNotification("User profile not found.", "error", "Load Error");
            renderStores([]);
            return;
        }

        const userData = userSnap.val() || {};
        const roleKey = userData.role || state.roleKey;

        const storesMap = storesSnap.exists() ? storesSnap.val() : {};
        const assignedStores = Object.entries(storesMap)
            .map(([code, value]) => ({
                code,
                ...(value || {})
            }))
            .filter((store) => store.officerRole === roleKey)
            .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code)));

        renderStores(assignedStores);
    } catch (error) {
        console.error("Failed to load assigned stores:", error);
        showNotification("Failed to load assigned stores.", "error", "Load Error");
        renderStores([]);
    }
}

initPage();
