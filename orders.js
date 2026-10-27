import { initHeader, db, waitForUser, collection, query, where, getDocs,
         money, escapeHtml, formatDate } from "./common.js";

initHeader();

(async () => {
  const user = await waitForUser();
  const list = document.getElementById("ordersList");
  if (!user) {
    document.getElementById("loginNotice").classList.remove("hidden");
    list.innerHTML = "";
    return;
  }
  list.innerHTML = `<div class="empty"><h2>Loading orders…</h2></div>`;
  try {
    // only this student's orders (Firestore rules also enforce this)
    const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    list.innerHTML = orders.length ? orders.map(o => `
      <article class="order-card">
        <div class="order-head">
          <div><b>${escapeHtml(o.orderCode)}</b><span>${formatDate(o.createdAt)}</span></div>
          <span class="status ${escapeHtml(o.status.toLowerCase())}">${escapeHtml(o.status)}</span>
        </div>
        <div class="order-items">${o.items.map(i =>
          `<div><span>${escapeHtml(i.name)} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}</div>
        <div class="order-foot">
          <span>Pickup: <b>${escapeHtml(o.pickup)}</b>${o.note ? ` · ${escapeHtml(o.note)}` : ""}</span>
          <strong>${money(o.total)}</strong>
        </div>
      </article>`).join("")
      : `<div class="empty"><div>🧾</div><h2>No orders yet</h2><p>Your placed orders will appear here.</p><a class="btn primary" href="menu.html">Order food</a></div>`;
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="empty"><div>⚠️</div><h2>Could not load orders</h2></div>`;
  }
})();
