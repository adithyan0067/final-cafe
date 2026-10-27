import { initHeader, auth, db, createUserWithEmailAndPassword, updateProfile,
         doc, setDoc, serverTimestamp, showMsg, friendlyError } from "./common.js";

initHeader();

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name     = document.getElementById("name").value.trim();
  const email    = document.getElementById("email").value.trim();
  const phone    = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirm  = document.getElementById("confirm").value;
  const msg      = document.getElementById("message");
  const btn      = e.target.querySelector("button");

  if (!/^\d{10}$/.test(phone)) return showMsg(msg, "Enter a valid 10-digit phone number.", "error");
  if (password.length < 6)     return showMsg(msg, "Password must be at least 6 characters.", "error");
  if (password !== confirm)    return showMsg(msg, "Passwords do not match.", "error");

  btn.disabled = true;
  try {
    // 1) create the login account (Firebase Auth)
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // 2) save extra details (name, phone) in Firestore: users/{uid}
    await setDoc(doc(db, "users", cred.user.uid), { name, phone, email, createdAt: serverTimestamp() });
    location.href = "menu.html";
  } catch (err) {
    showMsg(msg, friendlyError(err), "error");
    btn.disabled = false;
  }
});
