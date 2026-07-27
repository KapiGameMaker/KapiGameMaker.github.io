// Player-specific functions
let gold = 100;
let cart = [];
let currentCatalog = [...DEFAULT_CATALOG];

let searchQuery = '';

function loadShop(){
  const user = getCurrentUser();
  if(!user || user.role !== 'player') return window.location.href = 'index.html';

  const charNameEl = document.getElementById('charName');
  if(charNameEl) charNameEl.value = user.username;
  
  const parties = getParties();
  const party = parties.find(p => p.id === user.partyId);
  
  if(party && party.assignedShopId){
    const shop = getShop(party.assignedShopId);
    if(shop){
      const titleEl = document.getElementById('shopTitle');
      if(titleEl) titleEl.textContent = shop.name;
      
      currentCatalog = [...shop.items];
      searchQuery = ''; // Reset search on load
      const searchInput = document.getElementById('searchInput');
      if(searchInput) searchInput.value = '';
      
      renderItems();
      resetShop();
      return;
    }
  }
  
  // No shop assigned
  const titleEl = document.getElementById('shopTitle');
  if(titleEl) titleEl.textContent = 'ยังไม่มีร้านค้าเปิดให้บริการ';
  currentCatalog = [];
  renderItems();
  resetShop();
}

function renderItems(){
  const list = document.getElementById('itemList');
  list.innerHTML = '';
  
  const filtered = currentCatalog.map((item, originalIdx) => ({...item, originalIdx}))
    .filter(item => {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.cat.toLowerCase().includes(q);
    });

  if(filtered.length === 0 && currentCatalog.length > 0){
    list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--ink-soft);">ไม่พบไอเทมที่ค้นหา</p>';
    return;
  }

  filtered.forEach((item) => {
    const idx = item.originalIdx;
    // Check if item is already in cart (by catalog index)
    const cartItem = cart.find(c => c.catalogIdx === idx);
    const isBought = !!cartItem;
    const info = item.info || "???: Try asking the DM for info about this item.";

    const wrap = document.createElement('div');
    wrap.className = 'item-row-wrap';
    wrap.innerHTML = `
      <div class="item-row">
        <button type="button" class="item-name-btn" onclick="toggleItemInfo(${idx})">${item.name}<span class="item-cat">${item.cat}</span></button>
        <div class="item-price">${fmt(item.price)} gp</div>
        <input type="number" class="qty-input" id="qty-${idx}" value="${isBought ? cartItem.qty : 1}" min="1" ${isBought ? 'disabled' : ''}>
        ${isBought 
          ? `<button type="button" class="cancel-btn" onclick="removeItem(${idx})">ยกเลิก</button>`
          : `<button type="button" class="buy-btn" onclick="buyItem(${idx})">ซื้อ</button>`
        }
      </div>
      <div class="item-info-dropdown" id="info-${idx}" hidden>
        <p class="item-info-text">${info}</p>
      </div>
    `;
    list.appendChild(wrap);
  });
}

function handleSearch(val){
  searchQuery = val;
  renderItems();
}

function toggleItemInfo(idx){
  const panel = document.getElementById('info-' + idx);
  if(!panel) return;
  panel.hidden = !panel.hidden;
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
  cart.push({name:item.name, qty, unit:item.price, total, catalogIdx: idx});
  updatePurse();
  renderReceipt();
  renderItems(); // Refresh buttons
}

function removeItem(idx){
  const cartIdx = cart.findIndex(c => c.catalogIdx === idx);
  if(cartIdx > -1){
    const item = cart[cartIdx];
    gold += item.total;
    cart.splice(cartIdx, 1);
    updatePurse();
    renderReceipt();
    renderItems(); // Refresh buttons
  }
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

async function confirmOrder(){
  const user = getCurrentUser();
  if(!user) return;
  
  const webhookUrl = getDiscordWebhookUrl(user.dmId);
  if(!webhookUrl){
    alert('❌ DM ยังไม่ได้ตั้งค่า Discord Webhook กรุณาแจ้ง DM');
    return;
  }
  if(!user) return;
  const parties = getParties();
  const party = parties.find(p => p.id === user.partyId);
  const shopId = party ? party.assignedShopId : null;
  const shop = getShop(shopId);
  const shopName = shop ? shop.name : 'ไม่ทราบชื่อร้าน';
  const charName = document.getElementById('charName').value || user.username;
  
  let itemLines = '';
  cart.forEach(c => {
    itemLines += `${c.name} จำนวน ${c.qty} ราคา ${fmt(c.total)} gp\n`;
  });
  const spent = cart.reduce((s,c)=>s+c.total,0);
  const startGold = parseFloat(document.getElementById('startGold').value) || 0;
  const remainingGold = gold;
  
  const embed = {
    title: `🛒 คำสั่งซื้อใหม่จากร้าน ${shopName}`,
    color: 13938551, // #D4AF37 (Gold)
    fields: [
      {
        name: "👤 ผู้เล่น",
        value: charName,
        inline: true
      },
      {
        name: "💰 เงินตั้งต้น",
        value: `${fmt(startGold)} GP`,
        inline: true
      },
      {
        name: "💸 เงินคงเหลือ",
        value: `**${fmt(remainingGold)} GP**`,
        inline: true
      },
      {
        name: "🧾 ยอดซื้อทั้งหมด",
        value: `**${fmt(spent)} GP**`,
        inline: false
      },
      {
        name: "📋 รายการสินค้า",
        value: "```\n" + itemLines + "```"
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "D&D Shop Management System"
    }
  };

  const status = document.getElementById('copyStatus');
  status.textContent = '⏳ กำลังส่งข้อมูล...';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if(response.ok){
      status.textContent = '✅ ยืนยันคำสั่งซื้อสำเร็จ! แจ้ง DM เรียบร้อย';
      status.style.color = 'green';
    } else {
      throw new Error('Discord response not OK');
    }
  } catch (error) {
    console.error('Error sending to Discord:', error);
    status.textContent = '❌ ส่งไม่สำเร็จ กรุณาลองใหม่หรือคัดลอกใบเสร็จแทน';
    status.style.color = 'red';
  }
  
  setTimeout(() => {
    status.textContent = '';
    status.style.color = '';
  }, 5000);
}

function resetShop(){
  const startGoldVal = parseFloat(document.getElementById('startGold').value) || 0;
  const spent = cart.reduce((s,c)=>s+c.total,0);
  gold = startGoldVal - spent;
  
  updatePurse();
  renderReceipt();
  renderItems();
}

function clearCart(){
  if(confirm('ต้องการล้างรายการในใบเสร็จทั้งหมดใช่หรือไม่?')){
    cart = [];
    resetShop();
  }
}

function playerRefreshShop(){
  loadShop();
}

function logout(){
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Auth Check
(function(){
  const user = getCurrentUser();
  if(!user || user.role !== 'player'){
    window.location.href = 'index.html';
  }
})();

document.getElementById('startGold').addEventListener('change', resetShop);

initializeData();
loadShop();
