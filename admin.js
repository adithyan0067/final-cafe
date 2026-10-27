import { auth, db, onAuthStateChanged, signOut, collection, doc, getDoc, getSettings, setDoc,
         addDoc, updateDoc, deleteDoc, onSnapshot, escapeHtml, formatDate, friendlyError } from "./common.js";
import { DEFAULT_PRODUCTS } from "./default-products.js";

const $ = id => document.getElementById(id);
let products = [];
let started = false;

// ---- Guard: only logged-in admins may use this page ----
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "admin-login.html"; return; }
  try {
    const isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists();
    if (!isAdmin) { await signOut(auth); location.href = "admin-login.html"; return; }
  } catch { location.href = "admin-login.html"; return; }
  if (!started) { started = true; start(); }
});

async function start() {
  const settings = await getSettings();
  $("adminCollege").textContent = settings.collegeName;
  $("collegeInput").value = settings.collegeName;
  $("logoInput").value = settings.logo;

  // Live updates: the page refreshes automatically when data changes
  onSnapshot(collection(db, "products"), snap => {
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
  });
  onSnapshot(collection(db, "orders"), snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderOrders(orders);
  });
}

function renderProducts() {
  $("productStat").textContent = products.length;
  $("availableStat").textContent = products.filter(p => p.available).length;
  $("productTable").innerHTML = `<div class="table-wrap"><table><thead><tr>
    <th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${products.map(p => `<tr>
      <td><b>${escapeHtml(p.name)}</b></td><td>${escapeHtml(p.category)}</td><td>₹${p.price}</td>
      <td><span class="pill ${p.available ? "on" : "off"}">${p.available ? "Available" : "Hidden"}</span></td>
      <td><button data-edit="${p.id}">Edit</button> <button class="danger" data-delete="${p.id}">Delete</button></td>
    </tr>`).join("")}</tbody></table></div>`;
}

function renderOrders(orders) {
  $("orderStat").textContent = orders.length;
  const statuses = ["Pending", "Preparing", "Ready", "Completed"];
  $("adminOrders").innerHTML = orders.length ? orders.map(o => `
    <div class="admin-order">
      <b>${escapeHtml(o.orderCode)}</b>
      <span>${escapeHtml(o.userName)} • ${escapeHtml(o.userPhone)}<br><small>${formatDate(o.createdAt)} · Pickup ${escapeHtml(o.pickup)}</small></span>
      <span>${o.items.map(i => escapeHtml(i.name) + " × " + i.qty).join(", ")}${o.note ? `<br><small>Note: ${escapeHtml(o.note)}</small>` : ""}</span>
      <b>₹${o.total}</b>
      <select data-status="${o.id}">${statuses.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
    </div>`).join("") : "<p class='muted'>No orders yet.</p>";
}

// ---- Order status change ----
$("adminOrders").addEventListener("change", async e => {
  const sel = e.target.closest("[data-status]");
  if (!sel) return;
  try { await updateDoc(doc(db, "orders", sel.dataset.status), { status: sel.value }); }
  catch (err) { alert(friendlyError(err)); }
});

// ---- Edit / delete product ----
$("productTable").addEventListener("click", async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-delete]");
  if (ed) {
    const p = products.find(x => x.id === ed.dataset.edit);
    if (!p) return;
    $("editId").value = p.id; $("pName").value = p.name; $("pCategory").value = p.category;
    $("pPrice").value = p.price; $("pImage").value = p.imageUrl; $("pDesc").value = p.description;
    $("pPrep").value = p.prepTime; $("pAvailable").checked = p.available;
    $("cancelEdit").classList.remove("hidden");
    scrollTo({ top: 0, behavior: "smooth" });
  }
  if (del && confirm("Delete this product?")) {
    try { await deleteDoc(doc(db, "products", del.dataset.delete)); }
    catch (err) { alert(friendlyError(err)); }
  }
});

function resetForm() {
  $("productForm").reset(); $("pAvailable").checked = true; $("editId").value = "";
  $("cancelEdit").classList.add("hidden");
}
$("cancelEdit").onclick = resetForm;

$("productForm").onsubmit = async e => {
  e.preventDefault();
  const data = {
    name: $("pName").value.trim(),
    category: $("pCategory").value.trim(),
    price: Number($("pPrice").value),
    imageUrl: $("pImage").value.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    description: $("pDesc").value.trim(),
    prepTime: $("pPrep").value.trim() || "10 min",
    available: $("pAvailable").checked
  };
  try {
    const id = $("editId").value;
    if (id) await setDoc(doc(db, "products", id), data);   // update existing
    else await addDoc(collection(db, "products"), data);   // add new
    resetForm();
  } catch (err) { alert(friendlyError(err)); }
};

// ---- Upload the starter menu (run once on a fresh database) ----
$("resetProducts").onclick = async () => {
  if (!confirm("Upload the 12 default items to the database? (Items with the same ids will be overwritten.)")) return;
  try {
    await Promise.all(DEFAULT_PRODUCTS.map(({ id, ...rest }) => setDoc(doc(db, "products", id), rest)));
  } catch (err) { alert(friendlyError(err)); }
};

// ---- College branding ----
$("settingsForm").onsubmit = async e => {
  e.preventDefault();
  try {
    await setDoc(doc(db, "settings", "site"), {
      collegeName: $("collegeInput").value.trim() || "Nehru College of Engineering",
      logo: $("logoInput").value.trim() || "🍽️"
    });
    $("settingsMsg").textContent = "Branding saved for everyone.";
  } catch (err) { $("settingsMsg").textContent = friendlyError(err); }
};

$("logout").onclick = async () => { await signOut(auth); location.href = "admin-login.html"; };
