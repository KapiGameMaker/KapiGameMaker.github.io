// Player-specific functions
let gold = 100;
let cart = [];
let currentCatalog = [...DEFAULT_CATALOG];

function loadShop(){
  const shopId = getSelectedShopId();
  const shop = getShop(shopId);
  if(shop){
    const titleEl = document.getElementById('shopTitle');
    if(titleEl) titleEl.textContent = shop.name;
    
    currentCatalog = [...shop.items];
    renderItems();
    resetShop();
  }
}

function renderItems(){
  const list = document.getElementById('itemList');
  list.innerHTML = '';
  currentCatalog.forEach((item, idx) => {
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
  const webhookUrl = getDiscordWebhookUrl();
  if(!webhookUrl){
    alert('❌ DM ยังไม่ได้ตั้งค่า Discord Webhook กรุณาแจ้ง DM');
    return;
  }

  if(cart.length === 0){
    alert('❌ ยังไม่มีสินค้าในใบเสร็จ');
    return;
  }

  const shopId = getSelectedShopId();
  const shop = getShop(shopId);
  const shopName = shop ? shop.name : 'ไม่ทราบชื่อร้าน';
  const charName = document.getElementById('charName').value || 'ตัวละครไม่ระบุชื่อ';
  
  let itemLines = '';
  cart.forEach(c => {
    itemLines += `${c.name} จำนวน ${c.qty} ราคา ${fmt(c.total)} gp\n`;
  });
  const spent = cart.reduce((s,c)=>s+c.total,0);
  
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
        name: "💰 ราคาสุทธิ",
        value: `**${fmt(spent)} GP**`,
        inline: true
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
  gold = parseFloat(document.getElementById('startGold').value) || 0;
  cart = [];
  updatePurse();
  renderReceipt();
  renderItems();
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
