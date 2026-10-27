import { initHeader, getProducts, money, escapeHtml } from "./common.js";

initHeader();

(async () => {
  const box = document.getElementById("featured");
  try {
    const items = (await getProducts()).filter(p => p.available).slice(0, 4);
    box.innerHTML = items.map(p => `
      <article class="product-card">
        <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'">
        <div class="product-info">
          <span class="tag">${escapeHtml(p.category)}</span>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="muted">${escapeHtml(p.description)}</p>
          <div class="price-row"><strong>${money(p.price)}</strong><a class="small-btn" href="menu.html">Order</a></div>
        </div>
      </article>`).join("");
  } catch (err) {
    console.error(err);
  }
})();
