import { initHeader, getProducts, getCart, saveCart, updateCartCount, money, escapeHtml } from "./common.js";

initHeader();

const grid = document.getElementById("menuGrid");
const cat  = document.getElementById("category");
let products = [];

function render() {
  const q = document.getElementById("search").value.toLowerCase();
  const c = cat.value;
  const s = document.getElementById("sort").value;

  let arr = products.filter(p => p.available && p.name.toLowerCase().includes(q) && (c === "All" || p.category === c));
  if (s === "low")  arr.sort((a, b) => a.price - b.price);
  if (s === "high") arr.sort((a, b) => b.price - a.price);

  grid.innerHTML = arr.length ? arr.map(p => `
    <article class="product-card">
      <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
      <div class="product-info">
        <span class="tag">${escapeHtml(p.category)}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="muted">${escapeHtml(p.description)}</p>
        <small>⏱ ${escapeHtml(p.prepTime)}</small>
        <div class="price-row"><strong>${money(p.price)}</strong>
          <button class="small-btn" data-add="${p.id}">Add +</button></div>
      </div>
    </article>`).join("")
    : `<div class="empty"><div>🔎</div><h2>No items found</h2><p>Try another search or category.</p></div>`;
}

// One click listener for all "Add +" buttons
grid.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const id = btn.dataset.add;
  const cart = getCart();
  const item = cart.find(x => x.id === id);
  if (item) item.qty++; else cart.push({ id, qty: 1 });
  saveCart(cart);
  updateCartCount();
  btn.textContent = "Added ✓";
  setTimeout(() => btn.textContent = "Add +", 800);
});

["search", "category", "sort"].forEach(id => document.getElementById(id).addEventListener("input", render));

(async () => {
  grid.innerHTML = `<div class="empty"><h2>Loading menu…</h2></div>`;
  try {
    products = await getProducts();
    [...new Set(products.map(p => p.category))].sort().forEach(c => {
      const o = document.createElement("option"); o.textContent = c; cat.appendChild(o);
    });
    render();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="empty"><div>⚠️</div><h2>Could not load the menu</h2><p>Check firebase-config.js and your Firestore rules.</p></div>`;
  }
})();
