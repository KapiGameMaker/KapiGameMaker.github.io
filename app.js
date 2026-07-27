// Data Management
const DEFAULT_ADMIN = { id: 'admin_0', username: 'plume2546', password: 'P16b1p16_', role: 'admin' };

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

let isInitialized = false;
let initPromise = null;

async function initializeData(){
  if(initPromise) return initPromise;
  
  initPromise = (async () => {
    const config = getGHConfig();
    if(config && config.token){
      await pullFromGitHub();
    }

    let users = getUsers();
    
    const adminIdx = users.findIndex(u => u.id === DEFAULT_ADMIN.id);
    if (adminIdx > -1) {
      // Force update admin credentials and role to match code
      users[adminIdx].username = DEFAULT_ADMIN.username;
      users[adminIdx].password = DEFAULT_ADMIN.password;
      users[adminIdx].role = DEFAULT_ADMIN.role;
    } else {
      // Ensure the default admin exists
      const duplicateIdx = users.findIndex(u => u.username === DEFAULT_ADMIN.username);
      if (duplicateIdx > -1) {
        users[duplicateIdx].id = DEFAULT_ADMIN.id;
        users[duplicateIdx].password = DEFAULT_ADMIN.password;
        users[duplicateIdx].role = DEFAULT_ADMIN.role;
      } else {
        users.push(DEFAULT_ADMIN);
      }
    }
    saveUsers(users);

    if(!localStorage.getItem('parties')){
      localStorage.setItem('parties', JSON.stringify([]));
    }
    if(!localStorage.getItem('shops')){
      const initialShops = {
        'shop_0': {
          id: 'shop_0',
          name: 'สตาร์ทกิตเกอร์',
          items: [...DEFAULT_CATALOG],
          dmId: 'admin_0' // Default shop belongs to admin or a generic DM
        }
      };
      localStorage.setItem('shops', JSON.stringify(initialShops));
      localStorage.setItem('selectedShop', 'shop_0');
    }
    isInitialized = true;
    console.log('✅ Initialization complete');
  })();
  
  return initPromise;
}

function getUsers(){
  try {
    const data = JSON.parse(localStorage.getItem('users') || '[]');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error parsing users from localStorage", e);
    return [];
  }
}

function saveUsers(users){
  localStorage.setItem('users', JSON.stringify(users));
  triggerAutoSync();
}

function getParties(){
  return JSON.parse(localStorage.getItem('parties') || '[]');
}

function saveParties(parties){
  localStorage.setItem('parties', JSON.stringify(parties));
  triggerAutoSync();
}

function getCurrentUser(){
  return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

function setCurrentUser(user){
  sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function logout(){
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

function login(username, password){
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if(user){
    setCurrentUser(user);
    if(user.role === 'admin') window.location.href = 'admin.html';
    else if(user.role === 'dm') window.location.href = 'dm.html';
    else if(user.role === 'player') window.location.href = 'player.html';
    return true;
  }
  return false;
}

function getShops(){
  return JSON.parse(localStorage.getItem('shops') || '{}');
}

function saveShops(shops){
  localStorage.setItem('shops', JSON.stringify(shops));
  triggerAutoSync();
}

function getMyShops(){
  const user = getCurrentUser();
  const shops = getShops();
  if(!user) return {};
  if(user.role === 'admin') return shops; // Admin can see all for now or manage
  
  const myShops = {};
  Object.values(shops).forEach(s => {
    if(s.dmId === user.id) myShops[s.id] = s;
  });
  return myShops;
}

function getSelectedShopId(){
  return localStorage.getItem('selectedShop') || 'shop_0';
}

function setSelectedShopId(shopId){
  localStorage.setItem('selectedShop', shopId);
}

function getDiscordWebhookUrl(dmId){
  const webhooks = JSON.parse(localStorage.getItem('dmWebhooks') || '{}');
  if(dmId) return webhooks[dmId] || '';
  return localStorage.getItem('discordWebhookUrl') || '';
}

function setDiscordWebhookUrl(dmId, url){
  const webhooks = JSON.parse(localStorage.getItem('dmWebhooks') || '{}');
  if(dmId) {
    webhooks[dmId] = url;
    localStorage.setItem('dmWebhooks', JSON.stringify(webhooks));
  } else {
    localStorage.setItem('discordWebhookUrl', url);
  }
  triggerAutoSync();
}

function getShop(shopId){
  const shops = getShops();
  return shops[shopId] || null;
}

// GitHub Sync Management
function getGHConfig(){
  return JSON.parse(localStorage.getItem('ghConfig') || 'null');
}

function saveGHConfig(config){
  localStorage.setItem('ghConfig', JSON.stringify(config));
}

async function pushToGitHub(){
  const config = getGHConfig();
  if(!config || !config.token || !config.owner || !config.repo) return;

  const data = {
    users: getUsers(),
    parties: getParties(),
    shops: getShops(),
    dmWebhooks: JSON.parse(localStorage.getItem('dmWebhooks') || '{}'),
    lastUpdated: new Date().toISOString()
  };

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path || 'dnd_data.json'}`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for push

    // Get existing file for sha
    const res = await fetch(url, {
      headers: { 'Authorization': `token ${config.token}` },
      signal: controller.signal
    });
    
    let sha = null;
    if(res.status === 200){
      const fileData = await res.json();
      sha = fileData.sha;
    }

    const body = {
      message: 'Update D&D Shop Data',
      content: content
    };
    if(sha) body.sha = sha;

    const saveRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if(!saveRes.ok) throw new Error('GitHub Save Failed');
    console.log('✅ Data synced to GitHub');
    return true;
  } catch (e) {
    console.error('❌ GitHub Sync Error:', e);
    return false;
  }
}

async function pullFromGitHub(){
  const config = getGHConfig();
  if(!config || !config.token || !config.owner || !config.repo) return false;

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path || 'dnd_data.json'}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(url, {
      headers: { 'Authorization': `token ${config.token}` },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if(res.status === 200){
      const fileData = await res.json();
      const content = decodeURIComponent(escape(atob(fileData.content)));
      const data = JSON.parse(content);
      
      if(data.users) localStorage.setItem('users', JSON.stringify(data.users));
      if(data.parties) localStorage.setItem('parties', JSON.stringify(data.parties));
      if(data.shops) localStorage.setItem('shops', JSON.stringify(data.shops));
      if(data.dmWebhooks) localStorage.setItem('dmWebhooks', JSON.stringify(data.dmWebhooks));
      
      console.log('✅ Data loaded from GitHub');
      return true;
    }
    return false;
  } catch (e) {
    console.error('❌ GitHub Pull Error:', e);
    return false;
  }
}

// Global auto-sync trigger
let syncTimeout = null;
function triggerAutoSync(){
  const config = getGHConfig();
  if(config && config.token) {
    if(syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      pushToGitHub();
    }, 2000); // Wait 2 seconds of inactivity before pushing
  }
}

// Formatting
function fmt(n){
  return (Math.round(n*100)/100).toLocaleString();
}

// Login functions (index.html)
let currentRole = 'player';

function selectRole(role){
  currentRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-role') === role);
  });
  
  // Just focus username
  document.getElementById('username').focus();
}

async function enterShop(){
  const loginBtn = document.querySelector('.enter-btn');
  const originalBtnText = loginBtn ? loginBtn.textContent : 'เข้าสู่ระบบ';
  
  if(loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = '⌛ กำลังเตรียมระบบ...';
  }

  try {
    // Wait for data to be ready (GitHub pull + Admin Force Update)
    await initializeData();
    
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    
    if(login(user, pass)){
      errorMsg.textContent = '';
    } else {
      errorMsg.textContent = '❌ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }
  } catch (e) {
    console.error(e);
    alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + e.message);
  } finally {
    if(loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = originalBtnText;
    }
  }
}

// Auto init
initializeData();
