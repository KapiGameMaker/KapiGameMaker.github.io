// Data Management
const DM_PASSWORD = 'P16b1p16_';

const DEFAULT_CATALOG = [
  {name:"ดาบสั้น (Shortsword)", cat:"อาวุธ", price:10},
  {name:"ดาบยาว (Longsword)", cat:"อาวุธ", price:15},
  {name:"ธนูยาว (Longbow)", cat:"อาวุธ", price:50},
  {name:"ลูกธนู x20 (Arrows)", cat:"อาวุธ", price:1},
  {name:"เกราะหนัง (Leather Armor)", cat:"เกราะ", price:10},
  {name:"เกราะโซ่ (Chain Mail)", cat:"เกราะ", price:75},
  {name:"โล่ (Shield)", cat:"เกราะ", price:10},
  {name:"ยาโพชั่นฟื้นพลัง (Potion of Healing)", cat:"เวทมนตร์", price:50},
  {name:"คบเพลิง x5 (Torches)", cat:"อุปกรณ์", price:0.5},
  {name:"เชือกไหมยาว 50ฟุต (Silk Rope)", cat:"อุปกรณ์", price:10},
  {name:"ชุดปีนเขา (Climber's Kit)", cat:"อุปกรณ์", price:25},
  {name:"เป้สัมภาระ (Backpack)", cat:"อุปกรณ์", price:2},
  {name:"อาหารเดินทาง 1วัน (Rations)", cat:"อุปกรณ์", price:0.5},
  {name:"ชุดปฐมพยาบาล (Healer's Kit)", cat:"อุปกรณ์", price:5},
];

function initializeData(){
  if(!localStorage.getItem('shops')){
    const initialShops = {
      'shop_0': {
        id: 'shop_0',
        name: 'สตาร์ทกิตเกอร์',
        items: [...DEFAULT_CATALOG]
      }
    };
    localStorage.setItem('shops', JSON.stringify(initialShops));
    localStorage.setItem('selectedShop', 'shop_0');
  }
}

function getShops(){
  return JSON.parse(localStorage.getItem('shops') || '{}');
}

function saveShops(shops){
  localStorage.setItem('shops', JSON.stringify(shops));
}

function getSelectedShopId(){
  return localStorage.getItem('selectedShop') || 'shop_0';
}

function setSelectedShopId(shopId){
  localStorage.setItem('selectedShop', shopId);
}

function getDiscordWebhookUrl(){
  return localStorage.getItem('discordWebhookUrl') || '';
}

function setDiscordWebhookUrl(url){
  localStorage.setItem('discordWebhookUrl', url);
}

function getShop(shopId){
  const shops = getShops();
  return shops[shopId] || null;
}

// Formatting
function fmt(n){
  return (Math.round(n*100)/100).toLocaleString();
}

// Login functions (index.html)
let currentRole = 'player';

function selectRole(role){
  currentRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const dmSection = document.getElementById('dmSection');
  if(role === 'dm'){
    dmSection.classList.remove('hidden');
    document.getElementById('dmCode').focus();
  } else {
    dmSection.classList.add('hidden');
    document.getElementById('errorMsg').textContent = '';
  }
}

function enterShop(){
  console.log('enterShop called, role:', currentRole);
  if(currentRole === 'player'){
    console.log('Navigating to player.html');
    setTimeout(() => { window.location.href = 'player.html'; }, 100);
  } else {
    const code = document.getElementById('dmCode').value;
    const errorMsg = document.getElementById('errorMsg');
    if(code === DM_PASSWORD){
      errorMsg.textContent = '';
      console.log('Navigating to dm.html');
      setTimeout(() => { window.location.href = 'dm.html'; }, 100);
    } else {
      errorMsg.textContent = '❌ รหัสไม่ถูกต้อง';
      document.getElementById('dmCode').value = '';
      document.getElementById('dmCode').focus();
    }
  }
}
