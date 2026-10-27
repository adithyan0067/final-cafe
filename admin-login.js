import { auth, db, signInWithEmailAndPassword, signOut, doc, getDoc, friendlyError } from "./common.js";

document.getElementById("adminLoginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const m = document.getElementById("message");
  m.textContent = "";
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // A user is an admin only if a document exists at admins/{their uid}
    const isAdmin = (await getDoc(doc(db, "admins", cred.user.uid))).exists();
    if (!isAdmin) {
      await signOut(auth);
      m.textContent = "This account is not an admin.";
      return;
    }
    location.href = "admin.html";
  } catch (err) {
    m.textContent = friendlyError(err);
  }
});
