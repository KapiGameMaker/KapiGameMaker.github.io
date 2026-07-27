// DM-specific functions
let currentDMTab = 'manage';

function renderDMDashboard(){
  const shops = getShops();
  const container = document.getElementById('shopsContainer');
  container.innerHTML = '';
  
  Object.values(shops).forEach(shop => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    
    let itemsHtml = '';
    shop.items.forEach((item, idx) => {
      itemsHtml += `
        <div class="item-row-dm">
          <input type="text" class="item-name-input-dm" value="${item.name}" id="iname_edit_${shop.id}_${idx}" oninput="editItemName('${shop.id}', ${idx}, this.value)">
          <input type="text" class="item-cat-input-dm" value="${item.cat}" id="icat_edit_${shop.id}_${idx}" oninput="editItemCat('${shop.id}', ${idx}, this.value)">
          <input type="number" value="${item.price}" id="price_${shop.id}_${idx}" step="0.1" oninput="editItemPrice('${shop.id}', ${idx}, this.value)">
          <button class="small-btn danger" onclick="removeItemDM('${shop.id}', ${idx})">ลบ</button>
        </div>
      `;
    });
    
    card.innerHTML = `
      <div class="shop-card-header">
        <h3>${shop.name}</h3>
        <div class="shop-actions">
          <button class="small-btn danger" onclick="deleteShop('${shop.id}')">ลบร้าน</button>
        </div>
      </div>
      <div class="item-list-dm">${itemsHtml}</div>
      <div class="add-item-dm">
        <input type="text" placeholder="ชื่อไอเทม" class="item-name-input" id="iname_${shop.id}">
        <input type="number" placeholder="ราคา" step="0.1" class="item-price-input" id="iprice_${shop.id}">
        <input type="text" placeholder="หมวดหมู่" class="item-cat-input" id="icat_${shop.id}">
        <button class="small-btn primary" onclick="addItemDM('${shop.id}')">เพิ่ม</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function createNewShop(){
  const name = document.getElementById('newShopName').value.trim();
  if(!name) return;
  
  const shops = getShops();
  const newId = 'shop_' + Date.now();
  shops[newId] = {
    id: newId,
    name: name,
    items: [...DEFAULT_CATALOG]
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

function editItemName(shopId, idx, value){
  const shops = getShops();
  if(shops[shopId] && shops[shopId].items[idx]){
    shops[shopId].items[idx].name = value;
    saveShops(shops);
  }
}

function editItemCat(shopId, idx, value){
  const shops = getShops();
  if(shops[shopId] && shops[shopId].items[idx]){
    shops[shopId].items[idx].cat = value;
    saveShops(shops);
  }
}

function editItemPrice(shopId, idx, value){
  const shops = getShops();
  if(shops[shopId] && shops[shopId].items[idx]){
    const n = parseFloat(value);
    if(!isNaN(n)) shops[shopId].items[idx].price = n;
  }
}

function deleteShop(shopId){
  if(confirm('ลบร้านค้านี้จริงๆ หรือ?')){
    const shops = getShops();
    delete shops[shopId];
    saveShops(shops);
    renderDMDashboard();
  }
}

function switchDMTab(tab){
  currentDMTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  if(tab === 'manage'){
    document.getElementById('manageTab').classList.remove('hidden');
    document.getElementById('selectTab').classList.add('hidden');
  } else {
    document.getElementById('manageTab').classList.add('hidden');
    document.getElementById('selectTab').classList.remove('hidden');
    renderShopSelector();
  }
}

function renderShopSelector(){
  const shops = getShops();
  const selector = document.getElementById('shopSelector');
  selector.innerHTML = '';
  
  let selectedShopId = getSelectedShopId();
  
  Object.values(shops).forEach(shop => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '10px';
    label.style.padding = '10px';
    label.style.borderRadius = '3px';
    label.style.background = 'rgba(255,255,255,0.15)';
    label.style.cursor = 'pointer';
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'selectedShop';
    radio.value = shop.id;
    radio.checked = selectedShopId === shop.id;
    radio.onchange = () => {
      setSelectedShopId(shop.id);
    };
    
    label.appendChild(radio);
    label.appendChild(document.createTextNode(`${shop.name} (${shop.items.length} ไอเทม)`));
    selector.appendChild(label);
  });
}

function syncShopToPlayer(){
  const status = document.getElementById('syncStatus');
  status.textContent = '✅ ส่งร้านค้าให้ผู้เล่นสำเร็จ';
  setTimeout(() => status.textContent = '', 3000);
}

function logout(){
  window.location.href = 'index.html';
}

initializeData();
renderDMDashboard();
