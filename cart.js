import { initHeader, getProducts, getCart, saveCart, updateCartCount, money, escapeHtml,
         waitForUser, getUserProfile, showMsg, friendlyError } from "./common.js";

initHeader();
let products = [];
const placeBtn = document.getElementById("placeOrder");
const msg = document.getElementById("checkoutMsg");

function validItems() {
  return getCart().map(x => ({ ...x, p: products.find(p => p.id === x.id) })).filter(x => x.p && x.p.available);
}
function render() {
  const valid = validItems();
  document.getElementById("cartItems").innerHTML = valid.map(x => `
    <div class="cart-item"><img src="${escapeHtml(x.p.imageUrl)}" alt=""><div class="cart-main"><h3>${escapeHtml(x.p.name)}</h3><p>${money(x.p.price)} × ${x.qty}</p><div class="qty"><button data-act="dec" data-id="${x.id}">−</button><b>${x.qty}</b><button data-act="inc" data-id="${x.id}">+</button><button class="remove" data-act="remove" data-id="${x.id}">Remove</button></div></div><strong>${money(x.p.price * x.qty)}</strong></div>`).join("");
  document.getElementById("empty").classList.toggle("hidden", valid.length > 0);
  placeBtn.disabled = !valid.length;
  document.getElementById("summaryRows").innerHTML = valid.map(x => `<div><span>${escapeHtml(x.p.name)} × ${x.qty}</span><span>${money(x.p.price * x.qty)}</span></div>`).join("");
  document.getElementById("total").textContent = money(valid.reduce((s, x) => s + x.p.price * x.qty, 0));
  updateCartCount();
}
document.getElementById("cartItems").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  let cart = getCart(); const item = cart.find(i => i.id === b.dataset.id);
  if (b.dataset.act === "inc" && item) item.qty++;
  if (b.dataset.act === "dec" && item) item.qty--;
  if (b.dataset.act === "remove") cart = cart.filter(i => i.id !== b.dataset.id);
  saveCart(cart.filter(i => i.qty > 0)); render();
});
placeBtn.onclick = async () => {
  const formFields = ["department", "studyYear", "deliveryLocation", "contactPhone"];
  const form = document.querySelector(".summary");
  if (!formFields.every(id => document.getElementById(id).value.trim())) { showMsg(msg, "Please complete your department, study year, location and contact number.", "error"); return; }
  const user = await waitForUser();
  if (!user) { showMsg(msg, "Please login before placing an order.", "error"); setTimeout(() => location.href = "login.html", 700); return; }
  const valid = validItems(); if (!valid.length) return;
  placeBtn.disabled = true;
  try {
    const profile = await getUserProfile(user.uid);
    const total = valid.reduce((s, x) => s + x.p.price * x.qty, 0);
    const orderCode = "ORD" + Date.now().toString().slice(-7);
    const draft = {
      orderCode, userId: user.uid, userName: profile?.name || user.displayName || "",
      userPhone: document.getElementById("contactPhone").value.trim(),
      department: document.getElementById("department").value.trim(),
      studyYear: document.getElementById("studyYear").value,
      deliveryLocation: document.getElementById("deliveryLocation").value.trim(),
      items: valid.map(x => ({ id: x.p.id, name: x.p.name, qty: x.qty, price: x.p.price })), total,
      pickup: document.getElementById("pickup").value,
      note: document.getElementById("note").value.trim()
    };
    localStorage.setItem("canteenOrderDraft", JSON.stringify(draft));
    location.href = "payment.html";
  } catch (err) { console.error(err); showMsg(msg, friendlyError(err), "error"); placeBtn.disabled = false; }
};
(async () => { try { products = await getProducts(); } catch (err) { console.error(err); showMsg(msg, friendlyError(err), "error"); } render(); })();