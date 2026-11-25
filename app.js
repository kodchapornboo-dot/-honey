const PRODUCTS = [
  { id:'HN-001', name:'น้ำผึ้งดอกไม้ป่า 500 กรัม', short:'กลิ่นหอมละมุน รสชาติอ่อนโยน', price:250, image:'assets/images/honey-forest.svg' },
  { id:'HN-002', name:'น้ำผึ้งเกสรลำไย 500 กรัม', short:'รสหวานเข้ม หอมเกสรลำไยเป็นเอกลักษณ์', price:280, image:'assets/images/honey-longan.svg' }
];

// Google Apps Script Web App URL
const SHEET_WEB_APP_URL = 'https://script.google.com/a/macros/spumail.net/s/AKfycbxMJ0dYP1DdMd-SRNlHqOavsAfy335McnJ4YmUIBzGUxrVmD3elCXZUEzXb_gU3a462/exec';
const $ = (selector) => document.querySelector(selector);
let cart = JSON.parse(localStorage.getItem('honey-cart') || '[]');
let orders = JSON.parse(localStorage.getItem('honey-orders') || '[]');

function money(value) { return '฿' + Number(value).toLocaleString('th-TH'); }

function renderProducts() {
  $('#productGrid').innerHTML = PRODUCTS.map(product => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div>
        <h3>${product.name}</h3>
        <p>${product.short}</p>
        <div class="product-actions">
          <strong class="price">${money(product.price)}</strong>
          <button class="primary-button" type="button" onclick="addToCart('${product.id}')">หยิบลงตะกร้า</button>
        </div>
      </div>
    </article>`).join('');
}

function addToCart(id) {
  const item = cart.find(row => row.id === id);
  if (item) item.qty += 1; else cart.push({ id, qty:1 });
  saveCart(); renderCart(); showToast('เพิ่มสินค้าในตะกร้าแล้ว');
}

function saveCart() { localStorage.setItem('honey-cart', JSON.stringify(cart)); }
function cartDetails() { return cart.map(row => ({...PRODUCTS.find(p => p.id === row.id), qty:row.qty})); }
function cartTotal() { return cartDetails().reduce((sum,row) => sum + row.price * row.qty, 0); }

function renderCart() {
  const items = cartDetails();
  $('#cartCount').textContent = items.reduce((sum,row) => sum + row.qty, 0);
  $('#cartItems').innerHTML = items.length ? items.map(row => `
    <div class="cart-item">
      <img src="${row.image}" alt="${row.name}">
      <div><strong>${row.name}</strong><small>${row.qty} × ${money(row.price)}</small></div>
      <button class="remove" type="button" onclick="removeFromCart('${row.id}')">ลบ</button>
    </div>`).join('') : '<p class="empty">ตะกร้ายังว่าง</p>';
  $('#cartTotal').textContent = money(cartTotal());
}

function removeFromCart(id) { cart = cart.filter(row => row.id !== id); saveCart(); renderCart(); }
function openCart(open) { $('#cartDrawer').classList.toggle('open',open); $('#cartDrawer').setAttribute('aria-hidden',!open); $('#backdrop').classList.toggle('show',open); }

function showToast(message) { const toast=$('#toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200); }

async function submitOrder(event) {
  event.preventDefault();
  if (!cart.length) { showToast('กรุณาเลือกสินค้า'); return; }
  const form = new FormData(event.currentTarget);
  const customer = Object.fromEntries(form.entries());
  const id = 'HNY-' + Date.now().toString().slice(-8);
  const items = cartDetails();
  const order = { id, customer, items, total:cartTotal(), status:'รอแพ็ก', createdAt:new Date().toISOString() };

  const button=$('#submitOrder'); button.disabled=true;button.textContent='กำลังบันทึก...';
  let sheetSaved = false;
  if (SHEET_WEB_APP_URL) {
    try {
      await fetch(SHEET_WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(order)});
      sheetSaved=true;
    } catch (error) { console.warn(error); }
  }
  orders.unshift(order); localStorage.setItem('honey-orders',JSON.stringify(orders));
  cart=[];saveCart();renderCart();renderOrders();openCart(false);
  $('#checkoutDialog').close();event.currentTarget.reset();button.disabled=false;button.textContent='ยืนยันคำสั่งซื้อ';
  showToast(sheetSaved ? 'บันทึกออเดอร์และส่งข้อมูลเรียบร้อย' : 'บันทึกออเดอร์ในเครื่องแล้ว');
}

async function refreshOrders() {
  if (SHEET_WEB_APP_URL) {
    try {
      const response=await fetch(SHEET_WEB_APP_URL); const remote=await response.json();
      if (Array.isArray(remote.orders)) { orders=remote.orders; localStorage.setItem('honey-orders',JSON.stringify(orders)); }
    } catch(error) { showToast('เชื่อมต่อ Google Sheets ไม่สำเร็จ จะแสดงข้อมูลในเครื่อง'); }
  }
  renderOrders();
}

function renderOrders() {
  $('#orderTable').innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.customer?.name || ''}<br><small>${order.customer?.phone || ''}</small></td>
      <td>${(order.items||[]).map(item=>`${item.name} × ${item.qty}`).join('<br>')}</td>
      <td><strong>${money(order.total)}</strong></td>
      <td><select class="status ${order.status==='พร้อมส่ง'?'ready':order.status==='ส่งแล้ว'?'shipped':''}" onchange="updateStatus('${order.id}',this.value)">
        ${['รอแพ็ก','กำลังหยิบ','พร้อมส่ง','ส่งแล้ว'].map(s=>`<option ${order.status===s?'selected':''}>${s}</option>`).join('')}
      </select></td>
      <td><button class="mini-button" type="button" onclick="printLabel('${order.id}')">ป้ายส่ง</button></td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">ยังไม่มีข้อมูลออเดอร์</td></tr>';
}

function updateStatus(id,status) {
  const order=orders.find(row=>row.id===id); if(order) order.status=status;
  localStorage.setItem('honey-orders',JSON.stringify(orders));
  if(SHEET_WEB_APP_URL) fetch(SHEET_WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'updateStatus',id,status})});
  renderOrders();showToast('อัปเดตสถานะแล้ว');
}

function makeLabel(order) {
  const itemText=(order.items||[]).map(item=>`${item.name} × ${item.qty}`).join('<br>');
  return `<div class="label"><h3>📦 บ้านน้ำผึ้งไทย — ${order.id}</h3><strong>ผู้รับ: ${order.customer?.name}</strong><br>โทร: ${order.customer?.phone}<br>${order.customer?.address}<br><strong>สินค้า:</strong> ${itemText}</div>`;
}

function printLabel(id) {
  const order=orders.find(row=>row.id===id);if(!order)return;
  $('#printArea').innerHTML=`<div class="label-sheet">${makeLabel(order)}</div>`;
  $('#labelDialog').showModal();
  setTimeout(()=>window.print(),150);
}

function printLabels() {
  if(!orders.length){showToast('ไม่มีออเดอร์ให้พิมพ์');return;}
  $('#printArea').innerHTML=`<div class="label-sheet">${orders.map(makeLabel).join('')}</div>`;
  $('#labelDialog').showModal();setTimeout(()=>window.print(),150);
}

$('#cartButton').addEventListener('click',()=>openCart(true));
$('#closeCart').addEventListener('click',()=>openCart(false));
$('#backdrop').addEventListener('click',()=>openCart(false));
$('#checkoutButton').addEventListener('click',()=>{if(cart.length)$('#checkoutDialog').showModal();else showToast('กรุณาเลือกสินค้า');});
$('#checkoutForm').addEventListener('submit',submitOrder);
$('#refreshOrders').addEventListener('click',refreshOrders);
$('#printLabels').addEventListener('click',printLabels);
renderProducts();renderCart();renderOrders();
