import { initHeader, getProducts, getCart, saveCart, updateCartCount, money, escapeHtml,
         auth, db, waitForUser, getUserProfile, collection, addDoc, serverTimestamp,
         showMsg, friendlyError } from "./common.js";

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
    <div class="cart-item">
      <img src="${escapeHtml(x.p.imageUrl)}" alt="">
      <div class="cart-main">
        <h3>${escapeHtml(x.p.name)}</h3>
        <p>${money(x.p.price)} × ${x.qty}</p>
        <div class="qty">
          <button data-act="dec" data-id="${x.id}">−</button><b>${x.qty}</b>
          <button data-act="inc" data-id="${x.id}">+</button>
          <button class="remove" data-act="remove" data-id="${x.id}">Remove</button>
        </div>
      </div>
      <strong>${money(x.p.price * x.qty)}</strong>
    </div>`).join("");

  document.getElementById("empty").classList.toggle("hidden", valid.length > 0);
  placeBtn.disabled = !valid.length;
  document.getElementById("summaryRows").innerHTML = valid.map(x =>
    `<div><span>${escapeHtml(x.p.name)} × ${x.qty}</span><span>${money(x.p.price * x.qty)}</span></div>`).join("");
  document.getElementById("total").textContent = money(valid.reduce((s, x) => s + x.p.price * x.qty, 0));
  updateCartCount();
}

document.getElementById("cartItems").addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  let cart = getCart();
  const item = cart.find(i => i.id === b.dataset.id);
  if (b.dataset.act === "inc" && item) item.qty++;
  if (b.dataset.act === "dec" && item) item.qty--;
  if (b.dataset.act === "remove") cart = cart.filter(i => i.id !== b.dataset.id);
  saveCart(cart.filter(i => i.qty > 0));
  render();
});

placeBtn.onclick = async () => {
  const user = await waitForUser();
  if (!user) {
    showMsg(msg, "Please login before placing an order.", "error");
    setTimeout(() => location.href = "login.html", 700);
    return;
  }
  const valid = validItems();
  if (!valid.length) return;

  placeBtn.disabled = true;
  try {
    const profile = await getUserProfile(user.uid);
    // price is taken from Firestore products (not from the browser's cart)
    const total = valid.reduce((s, x) => s + x.p.price * x.qty, 0);
    const orderCode = "ORD" + Date.now().toString().slice(-7);

    await addDoc(collection(db, "orders"), {
      orderCode,
      userId: user.uid,
      userName: profile?.name || user.displayName || "",
      userPhone: profile?.phone || "",
      items: valid.map(x => ({ id: x.p.id, name: x.p.name, qty: x.qty, price: x.p.price })),
      total,
      pickup: document.getElementById("pickup").value,
      note: document.getElementById("note").value.trim(),
      status: "Pending",
      createdAt: serverTimestamp()
    });

    saveCart([]);
    render();
    showMsg(msg, `Order ${orderCode} placed successfully!`, "success");
    setTimeout(() => location.href = "orders.html", 900);
  } catch (err) {
    console.error(err);
    showMsg(msg, friendlyError(err), "error");
    placeBtn.disabled = false;
  }
};

(async () => {
  try { products = await getProducts(); } catch (err) { console.error(err); showMsg(msg, friendlyError(err), "error"); }
  render();
})();
