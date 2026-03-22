import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// --- CORE CONFIGURATION (SBA-PORTAL-2026) ---
const firebaseConfig = {
    apiKey: "AIzaSyCq8CgTyNbKVbUm_GItIC7FAvTuNrNspxI",
    authDomain: "sba-portal-2026-f1253.firebaseapp.com",
    projectId: "sba-portal-2026-f1253",
    storageBucket: "sba-portal-2026-f1253.firebasestorage.app",
    messagingSenderId: "363290267220",
    appId: "1:363290267220:web:2a3e8601c11be5dd6e27c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Global Access
window.auth = auth; 
window.db = db;
window.storage = storage; 

// Logout Logic
window.logoutUser = () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    }).catch(() => {
        window.location.href = 'index.html';
    });
};

// --- SECURITY & REAL-TIME ENGINE ---
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isPublicPage = path.endsWith('index.html') || 
                         path.endsWith('register.html') || 
                         path.endsWith('forgot-password.html') || 
                         path === '/' || 
                         path === '';

    if (user) {
        // 1. ADMIN PROTECTION
        if (path.includes('system-config-v8.html') && user.email !== "liger4683@gmail.com") {
            window.location.href = 'dashboard.html';
            return;
        }

        // 2. DATA SYNC (The Magic)
        onSnapshot(doc(db, "users", user.uid), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                
                // Update Balance UI
                const balEls = document.querySelectorAll('#uBal, .uBal'); 
                if(balEls.length > 0) {
                    const val = data.balance || "0.00";
                    const cleanVal = val.toString().replace(/,/g, '');
                    const amount = parseFloat(cleanVal) || 0;
                    const formatted = amount.toLocaleString('en-US', {minimumFractionDigits: 2});
                    balEls.forEach(el => el.innerText = `$${formatted}`);
                }

                // Update Status UI
                const statusEl = document.getElementById('uStatus');
                if(statusEl) {
                    const s = (data.status || "PENDING").toUpperCase();
                    statusEl.innerText = s;
                    statusEl.className = "status-pill " + s.toLowerCase().replace(/ /g, "-"); 
                    
                    if(s.includes("APPROVED") || s.includes("ACTIVE") || s.includes("VERIFIED") || s.includes("COMPLETED")) {
                        statusEl.style.background = "#dcfce7";
                        statusEl.style.color = "#166534";
                    } else if(s.includes("DECLINED") || s.includes("REJECTED") || s.includes("ACTION")) {
                        statusEl.style.background = "#fee2e2";
                        statusEl.style.color = "#991b1b";
                    } else {
                        statusEl.style.background = "#fef3c7";
                        statusEl.style.color = "#92400e";
                    }
                }

                // Update Name UI
                const nameEl = document.getElementById('uName');
                if(nameEl) nameEl.innerText = data.fullName || "Valued Applicant";

                window.currentUserData = data;
            }
        });

    } else {
        if (!isPublicPage && !path.includes('verify.html')) {
            window.location.href = 'index.html';
        }
    }
});
