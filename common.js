// ============================================================
//  common.js  –  Firebase setup + helpers shared by every page
//  (replaces the old data.js that used localStorage)
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ---- Firebase init ----
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Re-export so pages only import from "./common.js"
export {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp
};

// Show a red banner if the config was not pasted yet
if (firebaseConfig.apiKey.startsWith("PASTE")) {
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.style.cssText = "background:#b91c1c;color:#fff;padding:10px;text-align:center;font:600 14px sans-serif";
    b.textContent = "Firebase is not configured yet – open firebase-config.js and paste your config.";
    document.body.prepend(b);
  });
}

// ---- Site settings (college name) ----
export const SITE_SETTINGS_DEFAULT = { collegeName: "Nehru College of Engineering", logo: "🍽️" };

export async function getSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "site"));
    return snap.exists() ? { ...SITE_SETTINGS_DEFAULT, ...snap.data() } : SITE_SETTINGS_DEFAULT;
  } catch (e) {
    console.warn("Could not load settings:", e);
    return SITE_SETTINGS_DEFAULT;
  }
}

// ---- Products (Firestore collection: products) ----
export async function getProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---- Cart (stays in this device's localStorage – it is temporary data) ----
export function getCart()   { return JSON.parse(localStorage.getItem("canteenCart") || "[]"); }
export function saveCart(v) { localStorage.setItem("canteenCart", JSON.stringify(v)); }

// ---- Small helpers ----
export function money(n) { return "₹" + Number(n).toFixed(0); }

// Always escape text typed by users before putting it into innerHTML
export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

export function formatDate(ts) {
  const d = ts?.toDate ? ts.toDate() : null;
  return d ? d.toLocaleString("en-IN") : "just now";
}

export function showMsg(el, text, type) {
  el.textContent = text;
  el.className = "form-message " + (type || "");
}

export function friendlyError(err) {
  const map = {
    "auth/email-already-in-use": "This email is already registered. Try logging in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "permission-denied": "You don't have permission to do that."
  };
  return map[err?.code] || err?.message || "Something went wrong.";
}

// Resolves once Firebase has finished checking if someone is logged in
export function waitForUser() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, u => { unsub(); resolve(u); });
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export function updateCartCount() {
  const c = getCart().reduce((s, x) => s + x.qty, 0);
  document.querySelectorAll("#cartCount").forEach(e => e.textContent = c);
}

// Call once on every student page: college name, cart count, Login/Logout link
export async function initHeader() {
  updateCartCount();
  onAuthStateChanged(auth, user => {
    const a = document.getElementById("authLink");
    if (!a) return;
    if (user) {
      a.textContent = "Logout";
      a.href = "#";
      a.onclick = async e => { e.preventDefault(); await signOut(auth); location.href = "index.html"; };
    } else {
      a.textContent = "Login";
      a.href = "login.html";
      a.onclick = null;
    }
  });
  const s = await getSettings();
  document.querySelectorAll("#collegeName").forEach(e => e.textContent = s.collegeName);
  document.querySelectorAll("#footerCollege").forEach(e => e.textContent = s.collegeName);
  return s;
}
