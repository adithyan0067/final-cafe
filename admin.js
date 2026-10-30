import { auth, db, onAuthStateChanged, signOut, collection, doc, getDoc, getSettings, setDoc,
         addDoc, updateDoc, deleteDoc, onSnapshot, escapeHtml, formatDate, friendlyError } from "./common.js";
import { DEFAULT_PRODUCTS } from "./default-products.js";
const $ = id => document.getElementById(id); let products = [], currentOrders = [], started = false, paymentQrData = "", logoImageData = "", heroImageData = "";
onAuthStateChanged(auth, async user => {
  if (!user) { location.href = "admin-login.html"; return; }
  try { const isAdmin = (await getDoc(doc(db, "admins", user.uid))).exists(); if (!isAdmin) { await signOut(auth); location.href = "admin-login.html"; return; } }
  catch { location.href = "admin-login.html"; return; }
  if (!started) { started = true; start(); }
});
async function start() {
  const settings = await getSettings(); $("adminCollege").textContent = settings.collegeName;
  $("collegeInput").value = settings.collegeName; $("logoInput").value = settings.logo; logoImageData = settings.logoUrl || ""; heroImageData = settings.heroImageUrl || "";
  $("logoUploadHint").textContent = logoImageData ? "College logo saved. Choose another image to replace it." : "Upload your college logo (max 300 KB).";
  $("heroUploadHint").textContent = heroImageData ? "Homepage image saved. Choose another image to replace it." : "No home image selected. The bread card stays hidden."; if(heroImageData){$("heroUploadPreview").src=heroImageData;$("heroUploadPreview").classList.remove("hidden");}
  $("upiIdInput").value = settings.upiId || ""; $("upiNameInput").value = settings.upiName || ""; paymentQrData = settings.paymentQrUrl || "";
  $("qrUploadHint").textContent = paymentQrData ? "QR image saved. Choose another image to replace it." : "Upload your canteen UPI QR image.";
  onSnapshot(collection(db, "products"), snap => { products = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderProducts(); });
  onSnapshot(collection(db, "orders"), snap => { currentOrders = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)); renderOrders(currentOrders); });
}
function renderProducts() {
  $("productStat").textContent = products.length; $("availableStat").textContent = products.filter(p => p.available).length;
  $("productTable").innerHTML = `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>${products.map(p => `<tr><td><b>${escapeHtml(p.name)}</b></td><td>${escapeHtml(p.category)}</td><td>₹${p.price}</td><td><span class="pill ${p.available ? "on" : "off"}">${p.available ? "Available" : "Hidden"}</span></td><td><button data-edit="${p.id}">Edit</button> <button class="danger" data-delete="${p.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderOrders(orders) {
  $("orderStat").textContent = orders.length;
  const statuses = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
  const paymentStatuses = ["Pending", "Proof submitted", "Paid", "Pay on delivery", "Refunded"];
  $("adminOrders").innerHTML = orders.length ? orders.map(o => `<div class="admin-order">
    <b>${escapeHtml(o.orderCode)}</b><span>${escapeHtml(o.userName)} • ${escapeHtml(o.userPhone)}<br><small>${formatDate(o.createdAt)} · ${escapeHtml(o.department || "")}, ${escapeHtml(o.studyYear || "")} · ${escapeHtml(o.deliveryLocation || "Pickup")}</small></span>
    <span>${o.items.map(i => escapeHtml(i.name) + " × " + i.qty).join(", ")}${o.note ? `<br><small>Note: ${escapeHtml(o.note)}</small>` : ""}<br><small>${escapeHtml(o.paymentMethod || "")} · ${escapeHtml(o.paymentStatus || "Pending")}</small>${o.paymentProof ? `<br><button data-proof="${o.id}" class="proof-button">View payment screenshot</button>` : ""}</span>
    <b>₹${o.total}</b><div class="order-controls"><select aria-label="Order status" data-status="${o.id}">${statuses.map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select><select aria-label="Payment status" data-payment-status="${o.id}">${paymentStatuses.map(s => `<option ${o.paymentStatus === s ? "selected" : ""}>${s}</option>`).join("")}</select></div></div>`).join("") : "<p class='muted'>No orders yet.</p>";
}
$("adminOrders").addEventListener("change", async e => {
  const sel = e.target.closest("[data-status], [data-payment-status]"); if (!sel) return;
  try { await updateDoc(doc(db, "orders", sel.dataset.status || sel.dataset.paymentStatus), sel.hasAttribute("data-status") ? { status: sel.value } : { paymentStatus: sel.value }); }
  catch (err) { alert(friendlyError(err)); }
});
$("adminOrders").addEventListener("click", e => {
  const button = e.target.closest("[data-proof]"); if (!button) return;
  const order = currentOrders.find(o => o.id === button.dataset.proof); if (!order?.paymentProof) return;
  const win = window.open("", "_blank"); if (win) { win.document.title = `Payment proof · ${order.orderCode}`; const img = win.document.createElement("img"); img.src = order.paymentProof; img.alt = `Payment screenshot for ${order.orderCode}`; img.style.cssText = "max-width:100%;height:auto;display:block;margin:auto"; win.document.body.append(img); }
});
$("productTable").addEventListener("click", async e => {
 const ed=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
 if(ed){const p=products.find(x=>x.id===ed.dataset.edit);if(!p)return;$("editId").value=p.id;$("pName").value=p.name;$("pCategory").value=p.category;$("pPrice").value=p.price;$("pImage").value=p.imageUrl;$("pDesc").value=p.description;$("pPrep").value=p.prepTime;$("pAvailable").checked=p.available;$("cancelEdit").classList.remove("hidden");scrollTo({top:0,behavior:"smooth"});}
 if(del&&confirm("Delete this product?")){try{await deleteDoc(doc(db,"products",del.dataset.delete));}catch(err){alert(friendlyError(err));}}
});
function resetForm(){ $("productForm").reset();$("pAvailable").checked=true;$("editId").value="";$("cancelEdit").classList.add("hidden"); }
$("cancelEdit").onclick=resetForm;
$("productForm").onsubmit=async e=>{e.preventDefault();const data={name:$("pName").value.trim(),category:$("pCategory").value.trim(),price:Number($("pPrice").value),imageUrl:$("pImage").value.trim()||"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",description:$("pDesc").value.trim(),prepTime:$("pPrep").value.trim()||"10 min",available:$("pAvailable").checked};try{const id=$("editId").value;if(id)await setDoc(doc(db,"products",id),data);else await addDoc(collection(db,"products"),data);resetForm();}catch(err){alert(friendlyError(err));}};
$("resetProducts").onclick=async()=>{if(!confirm("Upload the 12 default items to the database? (Items with the same ids will be overwritten.)"))return;try{await Promise.all(DEFAULT_PRODUCTS.map(({id,...rest})=>setDoc(doc(db,"products",id),rest)));}catch(err){alert(friendlyError(err));}};
$("paymentQrInput").addEventListener("change", async e => {
  const file=e.target.files?.[0]; if(!file)return;
  if(!file.type.startsWith("image/")){alert("Choose an image file.");return;}
  if(file.size>300*1024){alert("For a clear, scannable QR, choose an image under 300 KB.");e.target.value="";return;}
  try { paymentQrData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not read that image."));reader.readAsDataURL(file);}); $("qrUploadHint").textContent="QR image ready. Save branding to publish it."; }
  catch(err){alert(err.message);}
});$("heroImageInput").addEventListener("change", async e => { const file=e.target.files?.[0]; if(!file)return; if(!file.type.startsWith("image/")||file.size>10*1024*1024){alert("Choose an image under 10 MB.");e.target.value="";return;} try{heroImageData=await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);const scale=Math.min(1,900/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);let data=canvas.toDataURL("image/jpeg",.62);if(data.length>170*1024){const small=document.createElement("canvas");small.width=Math.round(canvas.width*.75);small.height=Math.round(canvas.height*.75);small.getContext("2d").drawImage(canvas,0,0,small.width,small.height);data=small.toDataURL("image/jpeg",.45);}if(data.length>180*1024){reject(new Error("This photo is too large after compression. Choose a simpler image."));return;}resolve(data);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("Could not read that image."));};img.src=url;});$("heroUploadHint").textContent="Image ready. Save branding to show it on the home page.";$("heroUploadPreview").src=heroImageData;$("heroUploadPreview").classList.remove("hidden");}catch(err){alert(err.message);} });
$("clearHeroImage").onclick=()=>{$("heroImageInput").value="";heroImageData="";$("heroUploadHint").textContent="Home image hidden. Save branding to remove it.";$("heroUploadPreview").classList.add("hidden");};
$("logoImageInput").addEventListener("change", async e => { const file=e.target.files?.[0]; if(!file)return; if(!file.type.startsWith("image/")){alert("Choose an image file.");return;} if(file.size>300*1024){alert("Choose a college logo under 300 KB.");e.target.value="";return;} try{logoImageData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Could not read that image."));reader.readAsDataURL(file);});$("logoUploadHint").textContent="Logo ready. Save branding to publish it.";}catch(err){alert(err.message);} });
$("clearLogoImage").onclick=()=>{$("logoImageInput").value="";logoImageData="";$("logoUploadHint").textContent="Fallback mark will be shown. Save branding to apply.";};
$("settingsForm").onsubmit=async e=>{
 e.preventDefault();
 const imageDataLength=logoImageData.length+paymentQrData.length+heroImageData.length;
 if(imageDataLength>950*1024){$("settingsMsg").textContent="The combined logo, QR and homepage images are too large. Choose smaller image files.";return;}
 try{const collegeName=$("collegeInput").value.trim()||"Nehru College of Engineering";await setDoc(doc(db,"settings","site"),{collegeName,logo:$("logoInput").value.trim()||"🍽️",upiId:$("upiIdInput").value.trim(),upiName:$("upiNameInput").value.trim(),paymentQrUrl:paymentQrData,logoUrl:logoImageData,heroImageUrl:heroImageData});$("adminCollege").textContent=collegeName;$("settingsMsg").textContent="Branding and payment details saved for everyone.";}
 catch(err){$("settingsMsg").textContent=friendlyError(err);}
};
$("logout").onclick=async()=>{await signOut(auth);location.href="admin-login.html";};