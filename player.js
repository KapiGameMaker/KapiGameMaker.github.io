// Player-specific functions
let gold = 100;
let cart = [];
let currentCatalog = [...DEFAULT_CATALOG];

function loadShop(){
  const shopId = getSelectedShopId();
  const shop = getShop(shopId);
  if(shop){
    currentCatalog = [...shop.items];
    renderItems();
    resetShop();
  }
}

function renderItems(){
  const list = document.getElementById('itemList');
  list.innerHTML = '';
  const filter = document.getElementById('catFilter');
  const cats = ['all', ...new Set(currentCatalog.map(i => i.cat))];
  const currentCat = filter ? filter.value : 'all';
  if(filter){
    filter.innerHTML = cats.map(c => `<option value="${c}"${c===currentCat?' selected':''}>${c==='all'?'ทั้งหมด':c}</option>`).join('');
  }
  currentCatalog.forEach((item, idx) => {
    if(currentCat !== 'all' && item.cat !== currentCat) return;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <button class="item-name-btn" onclick="buyItem(${idx})">${item.name}<span class="item-cat">${item.cat}</span></button>
      <div class="item-price">${fmt(item.price)} gp</div>
      <input type="number" class="qty-input" id="qty-${idx}" value="1" min="1">
      <button class="buy-btn" onclick="buyItem(${idx})">ซื้อ</button>
    `;
    list.appendChild(row);
  });
}

function updatePurse(){
  const el = document.getElementById('goldDisplay');
  el.textContent = fmt(gold) + ' gp';
  el.className = 'amount' + (gold < 0 ? ' low' : '');
}

function buyItem(idx){
  const item = currentCatalog[idx];
  const qty = Math.max(1, parseInt(document.getElementById('qty-'+idx).value) || 1);
  const total = item.price * qty;
  gold -= total;
  cart.push({name:item.name, qty, unit:item.price, total});
  updatePurse();
  renderReceipt();
}

function addCustomItem(){
  const name = document.getElementById('cname').value.trim();
  const price = parseFloat(document.getElementById('cprice').value);
  if(!name || isNaN(price) || price < 0) return;
  currentCatalog.push({name, cat:"กำหนดเอง", price});
  renderItems();
  document.getElementById('cname').value = '';
  document.getElementById('cprice').value = '';
}

function renderReceipt(){
  const box = document.getElementById('receiptBox');
  if(cart.length === 0){
    box.innerHTML = '<p class="receipt-empty">ยังไม่มีรายการซื้อ</p>';
    return;
  }
  let html = '';
  cart.forEach(c => {
    html += `<div class="receipt-line"><span>${c.name} x${c.qty}</span><span>-${fmt(c.total)} gp</span></div>`;
  });
  const spent = cart.reduce((s,c)=>s+c.total,0);
  html += `<div class="receipt-total"><span>ทองที่ใช้ไปทั้งหมด</span><span>-${fmt(spent)} gp</span></div>`;
  html += `<div class="receipt-total"><span>ทองคงเหลือ</span><span>${fmt(gold)} gp</span></div>`;
  box.innerHTML = html;
}

function copyReceipt(){
  const name = document.getElementById('charName').value || 'ตัวละคร';
  let text = `ใบเสร็จร้านค้า — ${name}\n`;
  cart.forEach(c => { text += `- ${c.name} x${c.qty} (-${fmt(c.total)} gp)\n`; });
  const spent = cart.reduce((s,c)=>s+c.total,0);
  text += `รวมใช้ไป: ${fmt(spent)} gp\nทองคงเหลือ: ${fmt(gold)} gp\n`;
  navigator.clipboard.writeText(text).then(() => {
    const status = document.getElementById('copyStatus');
    status.textContent = 'คัดลอกแล้ว วางในโน้ตหรือ DDB ได้เลย';
    setTimeout(() => status.textContent = '', 3000);
  });
}

function resetShop(){
  gold = parseFloat(document.getElementById('startGold').value) || 0;
  cart = [];
  updatePurse();
  renderReceipt();
}

function playerRefreshShop(){
  loadShop();
}

function logout(){
  window.location.href = 'index.html';
}

document.getElementById('startGold').addEventListener('change', resetShop);

initializeData();
loadShop();
