// DM-specific functions
let currentDMTab = 'manage';

function renderDMDashboard(){
  const shops = getMyShops();
  const container = document.getElementById('shopsContainer');
  container.innerHTML = '';
  
  Object.values(shops).forEach(shop => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    
    let itemsHtml = '';
    shop.items.forEach((item, idx) => {
      const info = item.info || '';
      itemsHtml += `
        <div class="item-row-dm">
          <div class="item-row-dm-top">
            <div class="item-row-dm-name">${item.name} <span class="item-cat">${item.cat}</span></div>
            <input type="number" value="${item.price}" id="price_${shop.id}_${idx}" step="0.1" oninput="editItemPrice('${shop.id}', ${idx}, this.value)">
            <button class="small-btn danger" onclick="removeItemDM('${shop.id}', ${idx})">ลบ</button>
          </div>
          <textarea class="item-info-input-dm" id="info_${shop.id}_${idx}" placeholder="ข้อมูลที่ผู้เล่นจะเห็นเมื่อกดชื่อไอเทม (ค่าเริ่มต้น: ??? ถาม DM)" oninput="editItemInfo('${shop.id}', ${idx}, this.value)">${info}</textarea>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="shop-card-header">
        <button class="shop-name-btn" onclick="toggleShopDetails('${shop.id}')">
          ${shop.name}
        </button>
        <div class="shop-actions">
          <button class="small-btn danger" onclick="deleteShop('${shop.id}')">ลบร้าน</button>
        </div>
      </div>
      <div id="details_${shop.id}" class="hidden">
        <div class="item-list-dm">${itemsHtml}</div>
        <div class="add-item-dm">
          <input type="text" placeholder="ชื่อไอเทม" class="item-name-input" id="iname_${shop.id}">
          <input type="number" placeholder="ราคา" step="0.1" class="item-price-input" id="iprice_${shop.id}">
          <input type="text" placeholder="หมวดหมู่" class="item-cat-input" id="icat_${shop.id}">
          <button class="small-btn primary" onclick="addItemDM('${shop.id}')">เพิ่ม</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function createNewShop(){
  const name = document.getElementById('newShopName').value.trim();
  if(!name) return;
  
  const user = getCurrentUser();
  const shops = getShops();
  const newId = 'shop_' + Date.now();
  shops[newId] = {
    id: newId,
    name: name,
    items: [...DEFAULT_CATALOG],
    dmId: user.id
  };
  saveShops(shops);
  document.getElementById('newShopName').value = '';
  renderDMDashboard();
}

function addItemDM(shopId){
  const name = document.getElementById('iname_' + shopId).value.trim();
  const price = parseFloat(document.getElementById('iprice_' + shopId).value);
  const cat = document.getElementById('icat_' + shopId).value.trim() || 'อื่น';
  
  if(!name || isNaN(price)) return;
  
  const shops = getShops();
  shops[shopId].items.push({name, cat, price});
  saveShops(shops);
  
  document.getElementById('iname_' + shopId).value = '';
  document.getElementById('iprice_' + shopId).value = '';
  document.getElementById('icat_' + shopId).value = '';
  
  renderDMDashboard();
}

function removeItemDM(shopId, idx){
  const shops = getShops();
  shops[shopId].items.splice(idx, 1);
  saveShops(shops);
  renderDMDashboard();
}

function editItemPrice(shopId, idx, value){
  const shops = getShops();
  if(shops[shopId] && shops[shopId].items[idx]){
    const n = parseFloat(value);
    if(!isNaN(n)) shops[shopId].items[idx].price = n;
    saveShops(shops);
  }
}

function editItemInfo(shopId, idx, value){
  const shops = getShops();
  if(shops[shopId] && shops[shopId].items[idx]){
    shops[shopId].items[idx].info = value;
    saveShops(shops);
  }
}

function toggleShopDetails(shopId){
  const el = document.getElementById('details_' + shopId);
  if(el) el.classList.toggle('hidden');
}

function deleteShop(shopId){
  if(confirm('ลบร้านค้านี้จริงๆ หรือ?')){
    const shops = getShops();
    delete shops[shopId];
    saveShops(shops);
    renderDMDashboard();
  }
}

function switchDMTab(tab, btn){
  currentDMTab = tab;
  if(btn){
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  const manageTab = document.getElementById('manageTab');
  const partyTab = document.getElementById('partyTab');
  const selectTab = document.getElementById('selectTab');
  const settingsTab = document.getElementById('settingsTab');

  manageTab.classList.add('hidden');
  partyTab.classList.add('hidden');
  selectTab.classList.add('hidden');
  settingsTab.classList.add('hidden');

  if(tab === 'manage'){
    manageTab.classList.remove('hidden');
    renderDMDashboard();
  } else if(tab === 'party') {
    partyTab.classList.remove('hidden');
    renderParties();
  } else if(tab === 'select') {
    selectTab.classList.remove('hidden');
    renderPartySelector();
    renderShopSelector();
  } else if(tab === 'settings') {
    settingsTab.classList.remove('hidden');
    loadSettings();
  }
}

function loadSettings(){
  const user = getCurrentUser();
  const webhookInput = document.getElementById('discordWebhookUrl');
  webhookInput.value = getDiscordWebhookUrl(user.id);
}

function saveSettings(){
  const user = getCurrentUser();
  const url = document.getElementById('discordWebhookUrl').value.trim();
  setDiscordWebhookUrl(user.id, url);
  
  const status = document.getElementById('settingsStatus');
  status.textContent = '✅ บันทึกตั้งค่าสำเร็จ';
  setTimeout(() => status.textContent = '', 3000);
}

function renderShopSelector(){
  const shops = getMyShops();
  const selector = document.getElementById('shopSelector');
  selector.innerHTML = '';
  
  // Add a default option
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- เลือกร้านค้า --';
  selector.appendChild(defaultOpt);

  Object.values(shops).forEach(shop => {
    const opt = document.createElement('option');
    opt.value = shop.id;
    opt.textContent = `${shop.name} (${shop.items.length} ไอเทม)`;
    selector.appendChild(opt);
  });
}

function renderPartySelector(){
  const user = getCurrentUser();
  const parties = getParties().filter(p => p.dmId === user.id);
  const selector = document.getElementById('partySelector');
  selector.innerHTML = '';
  
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '-- เลือกปาร์ตี้ --';
  selector.appendChild(defaultOpt);

  parties.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    selector.appendChild(opt);
  });
  
  selector.onchange = (e) => {
    const pId = e.target.value;
    const p = parties.find(x => x.id === pId);
    if(p && p.assignedShopId){
      document.getElementById('shopSelector').value = p.assignedShopId;
    } else {
      document.getElementById('shopSelector').value = '';
    }
  };
}

function syncShopToParty(){
  const partyId = document.getElementById('partySelector').value;
  const shopId = document.getElementById('shopSelector').value;
  const status = document.getElementById('syncStatus');
  
  if(!partyId){
    status.textContent = '❌ กรุณาเลือกปาร์ตี้';
    return;
  }
  
  const parties = getParties();
  const pIdx = parties.findIndex(p => p.id === partyId);
  if(pIdx > -1){
    parties[pIdx].assignedShopId = shopId;
    saveParties(parties);
    status.textContent = '✅ บันทึกการตั้งค่าร้านค้าสำหรับปาร์ตี้สำเร็จ';
    setTimeout(() => status.textContent = '', 3000);
  }
}

// PARTY MANAGEMENT
function renderParties(){
  const user = getCurrentUser();
  const parties = getParties().filter(p => p.dmId === user.id);
  const container = document.getElementById('partiesContainer');
  container.innerHTML = '';
  
  const users = getUsers();

  parties.forEach(p => {
    const partyPlayers = users.filter(u => u.partyId === p.id);
    const card = document.createElement('div');
    card.className = 'shop-card';
    
    let playersHtml = '';
    partyPlayers.forEach(pl => {
      playersHtml += `
        <div class="item-row-dm" style="grid-template-columns: 1fr 1fr 80px;">
          <div style="display:flex; flex-direction:column;">
            <span style="font-weight:bold;">${pl.username}</span>
          </div>
          <input type="text" value="${pl.password}" oninput="editPlayerPassword('${pl.id}', this.value)" placeholder="รหัสผ่าน">
          <button class="small-btn danger" onclick="removePlayer('${pl.id}')">ลบ</button>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="shop-card-header">
        <h3>ปาร์ตี้: ${p.name}</h3>
        <button class="small-btn danger" onclick="deleteParty('${p.id}')">ลบปาร์ตี้</button>
      </div>
      <div class="item-list-dm">
        <label style="font-size:12px; color:var(--ink-soft); margin-bottom:10px; display:block;">ผู้เล่นในปาร์ตี้ (Username / Password):</label>
        ${playersHtml || '<p style="font-size:14px; color:var(--ink-soft);">ยังไม่มีผู้เล่น</p>'}
      </div>
      <div class="add-item-dm">
        <input type="text" placeholder="ชื่อผู้เล่น (Username)" id="plname_${p.id}">
        <input type="text" placeholder="รหัสผ่าน" id="plpass_${p.id}">
        <button class="small-btn primary" onclick="addPlayer('${p.id}')">เพิ่มผู้เล่น</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function createNewParty(){
  const name = document.getElementById('newPartyName').value.trim();
  if(!name) return;
  const user = getCurrentUser();
  const parties = getParties();
  parties.push({
    id: 'party_' + Date.now(),
    name: name,
    dmId: user.id,
    assignedShopId: ''
  });
  saveParties(parties);
  document.getElementById('newPartyName').value = '';
  renderParties();
}

function deleteParty(id){
  if(!confirm('ลบปาร์ตี้นี้จริงๆ หรือ? (ผู้เล่นในปาร์ตี้จะถูกลบด้วย)')) return;
  let parties = getParties();
  parties = parties.filter(p => p.id !== id);
  saveParties(parties);
  
  let users = getUsers();
  users = users.filter(u => u.partyId !== id);
  saveUsers(users);
  
  renderParties();
}

function addPlayer(partyId){
  const username = document.getElementById('plname_' + partyId).value.trim();
  const password = document.getElementById('plpass_' + partyId).value.trim();
  if(!username || !password) return alert('กรุณากรอก Username และ Password');
  
  const users = getUsers();
  if(users.find(u => u.username === username)) return alert('Username นี้ถูกใช้ไปแล้ว');
  
  const user = getCurrentUser();
  users.push({
    id: 'pl_' + Date.now(),
    username,
    password,
    role: 'player',
    partyId: partyId,
    dmId: user.id
  });
  saveUsers(users);
  renderParties();
}

function editPlayerPassword(id, pass){
  if(!pass) return;
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if(idx > -1){
    users[idx].password = pass;
    saveUsers(users);
  }
}

function removePlayer(id){
  if(!confirm('ลบผู้เล่นนี้ออก?')) return;
  let users = getUsers();
  users = users.filter(u => u.id !== id);
  saveUsers(users);
  renderParties();
}

function logout(){
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Auth & Init
async function initDM(){
  await initializeData();
  const user = getCurrentUser();
  if(!user || user.role !== 'dm'){
    window.location.href = 'index.html';
    return;
  }
  renderDMDashboard();
}

initDM();
