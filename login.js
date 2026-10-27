import { initHeader, auth, signInWithEmailAndPassword, sendPasswordResetEmail,
         showMsg, friendlyError } from "./common.js";

initHeader();
const msg = document.getElementById("message");

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = e.target.querySelector("button");
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "menu.html";
  } catch (err) {
    showMsg(msg, friendlyError(err), "error");
    btn.disabled = false;
  }
});

document.getElementById("forgot").addEventListener("click", async e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) return showMsg(msg, "Type your email above first, then click 'Forgot password'.", "error");
  try {
    await sendPasswordResetEmail(auth, email);
    showMsg(msg, "Password reset email sent. Check your inbox (and spam).", "success");
  } catch (err) {
    showMsg(msg, friendlyError(err), "error");
  }
});
