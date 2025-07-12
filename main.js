// Main JavaScript functionality for ConsPIndo App

// ✅ main.js - Diperbaiki: Hilangkan Duplikat auth/firestore/storage + Tambahan Fitur IP & Login History

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAlgUrADBMm5ocSooERlYFWQLcbLKykgP4",
  authDomain: "meribuco-conspindo.firebaseapp.com",
  projectId: "meribuco-conspindo",
  storageBucket: "meribuco-conspindo.appspot.com",
  messagingSenderId: "353214033063",
  appId: "1:353214033063:web:e20ae6399b68b687d9bf82",
};

// Initialize Firebase services from the global config
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

//...Tampilan Style...
const style = document.createElement('style');
style.textContent = `
  .shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  .shop-tile {
    background: #fff;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 4px #0001;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
    .shop-tile img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

  .prod-name {
    font-weight: bold;
    margin: 6px 0;
    text-align: center;
  }
  .prod-price {
    color: #444;
    margin-bottom: 6px;
  }
  .prod-actions button {
    margin: 2px 0;
    width: 100%;
  }
`;



// Fungsi formatCurrency universal dengan formatter map untuk scalability
const currencyFormatters = {
  'PI': (value) => `π ${parseFloat(value).toFixed(8)}`,
  'USD': (value) => '$' + parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2 }),
  'IDR': (value) => 'Rp ' + parseFloat(value).toLocaleString('id-ID')
};

function formatCurrency(value, currency) {
  const formatter = currencyFormatters[currency] || currencyFormatters['IDR'];
  return formatter(value);
}

function renderProductImage(url, altText) {
  const safeUrl = url && url.trim() !== '' ? url : 'assets/no-image.png';
  return `<img src="${safeUrl}" alt="${altText}" onerror="this.onerror=null;this.src='assets/no-image.png';">`;
}

function isAdmin() {
  return localStorage.getItem('isAdmin') === '1';
}

function showAdminShopBtns() {
  const div = document.getElementById('adminShopBtns');
  if (!div) return;
  div.innerHTML = isAdmin() ? `
    <button onclick="showAddProductForm()" class="btn">Tambah Produk</button>
    <button onclick="logoutAdmin()" class="btn delete-btn">Logout Admin</button>
    <div id="addProductForm" style="display:none;"></div>
  ` : `
    <button onclick="loginAdmin()" class="btn">Login Admin</button>
  `;
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = count > 0 ? count : '';
}

function addToCart(productId) {
  firestore.collection('products').doc(productId).get().then(doc => {
    if (!doc.exists) {
      alert('Produk tidak ditemukan');
      return;
    }
    const prod = doc.data();
    if (prod.stock < 1) {
      alert('Stok habis');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: productId, name: prod.name, price: prod.price, currency: prod.currency, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Kurangi stok di Firestore
    firestore.collection('products').doc(productId).update({
      stock: prod.stock - 1
    });
    alert('Produk ditambahkan ke keranjang.');
  });
}

function renderShopProducts() {
  showAdminShopBtns();
  const container = document.getElementById('shopProducts');
  if (!container) return;
  container.innerHTML = '';

  firestore.collection('products').orderBy('createdAt', 'desc').get().then(snapshot => {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    snapshot.forEach(doc => {
      const prod = doc.data();
      const id = doc.id;
      const div = document.createElement('div');
      div.className = 'shop-tile';
      div.innerHTML = `
        ${renderProductImage(prod.img, prod.name)}
        <div class="prod-id">ID: ${id}</div>
        <div class="prod-name">${prod.name}</div>
        <div class="prod-price">${formatCurrency(prod.price, prod.currency || 'IDR')}</div>
        <div class="prod-stock">Stok: ${prod.stock}</div>
        <div class="prod-actions">
          ${!isAdmin() ? `
            <button onclick="showProductDetail('${id}')" class="btn">Detail</button>
            <button onclick="addToCart('${id}')" class="btn" ${prod.stock < 1 ? 'disabled' : ''}>Beli</button>
          ` : `
            <button onclick="showAddProductForm('${id}')" class="btn edit-btn">Edit</button>
            <button onclick="deleteProduct('${id}')" class="btn delete-btn">Hapus</button>
          `}
        </div>
      `;
      grid.appendChild(div);
    });
    container.appendChild(grid);
    updateCartCount();
  });
}

function loginAdmin() {
  const pwd = prompt('Masukkan password admin:');
  if (pwd === 'Adua#22adua') {
    localStorage.setItem('isAdmin', '1');
    alert('Login admin berhasil');
    showAdminShopBtns();
    renderShopProducts();
  }
}

function logoutAdmin() {
  localStorage.removeItem('isAdmin');
  alert('Logout admin berhasil');
  showAdminShopBtns();
  renderShopProducts();
}

function showProductDetail(id) {
  const modal = document.getElementById('productDetailModal');
  const content = document.getElementById('productDetailContent');
  if (!modal || !content) {
    console.error('Elemen input modal belum tersedia!');
    return;
  }

  firestore.collection('products').doc(id).get().then(doc => {
    if (!doc.exists) {
      alert('Produk tidak ditemukan.');
      return;
    }
    const prod = doc.data();
    content.innerHTML = `
      <span class="close" onclick="closeModal('productDetailModal')">&times;</span>
      <h3>${prod.name}</h3>
      ${renderProductImage(prod.img, prod.name)}
      <p>${prod.desc || ''}</p>
      <p>Harga: ${formatCurrency(prod.price, prod.currency)}</p>
      <p>Stok tersedia: ${prod.stock}</p>
      <button onclick="addToCart('${id}')" ${prod.stock < 1 ? 'disabled' : ''}>Tambah ke Keranjang</button>
    `;
    modal.style.display = 'block';
  });
}

function showAddProductForm(editId = null) {
  const formDiv = document.getElementById('addProductForm');
  if (!formDiv) return;
  formDiv.style.display = 'block';

  if (editId) {
    firestore.collection('products').doc(editId).get().then(doc => {
      const prod = doc.data();
      renderProductForm(formDiv, editId, prod);
    });
  } else {
    renderProductForm(formDiv);
  }
}

function renderProductForm(container, id = null, prod = { name: '', price: '', currency: 'IDR', stock: 1, desc: '', img: '' }) {
  container.innerHTML = `
    <input type="text" id="prodName" placeholder="Nama Produk" value="${prod.name}">
    <input type="number" id="prodPrice" placeholder="Harga" value="${prod.price}">
    <select id="prodCurrency">
      <option value="IDR" ${prod.currency === 'IDR' ? 'selected' : ''}>IDR</option>
      <option value="USD" ${prod.currency === 'USD' ? 'selected' : ''}>USD</option>
      <option value="PI" ${prod.currency === 'PI' ? 'selected' : ''}>π Pi Coin</option>
    </select>
    <input type="number" id="prodStock" placeholder="Stok" value="${prod.stock}">
    <textarea id="prodDesc" placeholder="Deskripsi">${prod.desc}</textarea>
    <input type="text" id="prodImg" placeholder="URL Gambar dari GitHub (RAW)" value="${prod.img}">
    <button onclick="${id ? `saveEditProduct('${id}')` : `saveNewProduct()`}" class="btn">${id ? 'Simpan Edit' : 'Simpan Produk'}</button>
    <button onclick="hideAddProductForm()" class="btn delete-btn">Batal</button>
  `;
}

function hideAddProductForm() {
  const div = document.getElementById('addProductForm');
  if (div) {
    div.style.display = 'none';
    div.innerHTML = '';
  }
}

function showCart() {
  const cartModal = document.getElementById('cartModalContent');
  if (!cartModal) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    cartModal.innerHTML = '<p>Keranjang kosong.</p>';
    return;
  }

  let total = 0;
  cartModal.innerHTML = '';
  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>${item.name} (${item.qty}) - ${formatCurrency(subtotal, item.currency)}</div>
      <button onclick="removeFromCart(${index}, '${item.id}', ${item.qty})" class="btn delete-btn">Hapus</button>
    `;
    cartModal.appendChild(div);
  });

  const totalDiv = document.createElement('div');
  totalDiv.innerHTML = `<strong>Total: ${formatCurrency(total, cart[0]?.currency)}</strong>`;
  cartModal.appendChild(totalDiv);

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.innerText = 'Checkout Sekarang';
  btn.onclick = () => {
    closeModal('cartModal');
    setTimeout(() => {
      const modal = document.getElementById('buyNowModal');
      const content = document.getElementById('buyNowContent');
      if (!modal || !content) {
        console.warn('Elemen input modal belum tersedia!');
        return;
      }
      renderCheckoutContent(content);
      modal.style.display = 'block';
    }, 300);
  };
  cartModal.appendChild(btn);
}

function removeFromCart(index, productId, qty) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // Kembalikan stok produk ke Firestore
    firestore.collection('products').doc(productId).get().then(doc => {
      if (doc.exists) {
        const prod = doc.data();
        firestore.collection('products').doc(productId).update({
          stock: prod.stock + qty
        });
      }
    });

    showCart();
  }
}

function renderCheckoutContent(container) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (cart.length === 0) {
    container.innerHTML = '<p>Tidak ada item di keranjang.</p>';
    return;
  }

  let total = 0;
  container.innerHTML = '<h3>Ringkasan Pembelian</h3>';
  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    const div = document.createElement('div');
    div.className = 'checkout-item';
    div.innerHTML = `${item.name} x ${item.qty} = ${formatCurrency(subtotal, item.currency)}`;
    container.appendChild(div);
  });

  const totalDiv = document.createElement('div');
  totalDiv.innerHTML = `<strong>Total Akhir: ${formatCurrency(total, cart[0]?.currency)}</strong>`;
  container.appendChild(totalDiv);

  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Nama Lengkap';
  nameInput.id = 'orderName';

  const addressInput = document.createElement('textarea');
  addressInput.placeholder = 'Alamat Pengiriman';
  addressInput.id = 'orderAddress';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn';
  confirmBtn.innerText = 'Proses Order';
  confirmBtn.onclick = processOrder;

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn delete-btn';
  cancelBtn.innerText = 'Batal';
  cancelBtn.onclick = () => closeModal('buyNowModal');

  const btnRow = document.createElement('div');
  btnRow.className = 'btn-row';
  btnRow.appendChild(confirmBtn);
  btnRow.appendChild(cancelBtn);

  container.appendChild(nameInput);
  container.appendChild(addressInput);
  container.appendChild(btnRow);
}

function processOrder() {
  const name = document.getElementById('orderName').value;
  const address = document.getElementById('orderAddress').value;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  if (!name || !address) {
    alert('Nama dan alamat wajib diisi.');
    return;
  }

  const order = {
    name,
    address,
    items: cart,
    timestamp: new Date().toISOString()
  };

  firestore.collection('orders').add(order).then(() => {
    alert('Pesanan berhasil diproses!');
    localStorage.removeItem('cart');
    updateCartCount();
    closeModal('buyNowModal');
  }).catch(err => {
    alert('Gagal memproses pesanan: ' + err.message);
  });
}
function saveEditProduct(id) {
  const imageUrl = document.getElementById('prodImg').value;
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const currency = document.getElementById('prodCurrency').value;
  const stock = parseInt(document.getElementById('prodStock').value);
  const desc = document.getElementById('prodDesc').value;

  if (!name || isNaN(price) || isNaN(stock) || !imageUrl) {
    alert("Mohon lengkapi semua field dengan benar.");
    return;
  }

  const data = {
    name,
    price,
    currency,
    stock,
    img: imageUrl,
    desc
  };

  firestore.collection('products').doc(id).update(data).then(() => {
    hideAddProductForm();
    renderShopProducts();
  }).catch(err => {
    alert("Gagal menyimpan perubahan: " + err.message);
  });
}

function saveNewProduct() {
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const currency = document.getElementById('prodCurrency').value;
  const stock = parseInt(document.getElementById('prodStock').value);
  const imageUrl = document.getElementById('prodImg').value;
  const desc = document.getElementById('prodDesc').value;

  if (!name || isNaN(price) || isNaN(stock) || !imageUrl) {
    alert("Mohon lengkapi semua field dengan benar.");
    return;
  }

  const data = {
    name,
    price,
    currency,
    stock,
    img: imageUrl,
    desc,
    createdAt: new Date()
  };

  firestore.collection('products').add(data).then(() => {
    hideAddProductForm();
    renderShopProducts();
  }).catch(err => {
    alert("Gagal menambahkan produk: " + err.message);
  });
}
function updateData() {
  const imageUrl = document.getElementById('prodImg').value;
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const currency = document.getElementById('prodCurrency').value;
  const stock = parseInt(document.getElementById('prodStock').value);
  const desc = document.getElementById('prodDesc').value;

  if (!name || isNaN(price) || isNaN(stock) || !imageUrl) {
    alert("Mohon lengkapi semua field dengan benar.");
    return;
  }

  const data = {
    name,
    price,
    currency,
    stock,
    img: imageUrl,
    desc
  };

  firestore.collection('products').doc(id).update(data).then(() => {
    hideAddProductForm();
    renderShopProducts();
  }).catch(err => {
    alert("Gagal menyimpan perubahan: " + err.message);
  });
}
function deleteProduct(id) {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    firestore.collection('products').doc(id).delete()
      .then(() => {
        alert('Produk berhasil dihapus.');
        renderShopProducts();
      })
      .catch(err => {
        alert('Gagal menghapus produk: ' + err.message);
      });
  }
}


window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
};


// Product Form Functions (renderProductForm, showAddProductForm, saveNewProduct, saveEditProduct, hideAddProductForm)
// [Sudah termuat sebelumnya di dokumen ini, tidak digandakan agar tidak duplikat]


// Initialize Firebase services

function showAdminPanel() {
  showPage('admin');
}
let currentUser = null;

function loginUser(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then((result) => {
      currentUser = result.user;
      updateLastLogin(currentUser.uid);
      checkAdminStatus(currentUser.uid);
      showMessage('Login berhasil', true);
      closeModal('authModal');
      showPage('home');
    })
    .catch((error) => {
      showMessage('Login gagal: ' + error.message);
    });
}

function registerUser(email, password) {
  auth.createUserWithEmailAndPassword(email, password)
    .then((result) => {
      currentUser = result.user;
      saveUserToDatabase(currentUser.uid, email);
      showMessage('Pendaftaran berhasil. Silakan login.', true);
      switchToLogin();
    })
    .catch((error) => {
      showMessage('Pendaftaran gagal: ' + error.message);
    });
}

function saveUserToDatabase(uid, email) {
  const userData = {
    email,
    role: 'member',
    registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    photoUrl: ''
  };
  firestore.collection('users').doc(uid).set(userData);
}

function updateLastLogin(uid) {
  fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
      const ip = data.ip || "Unknown";
      const userAgent = navigator.userAgent;
      const os = navigator.platform || "Unknown";
      const browser = detectBrowser(userAgent);
      const deviceInfo = `${os} | ${browser}`;
const loginEntry = {
  time: new Date(), // gunakan waktu lokal (boleh juga pakai Date.now())
  ip: ip,
  device: deviceInfo
};

firestore.collection('users').doc(uid).update({
  lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
  ip: ip,
  device: deviceInfo,
  loginHistory: firebase.firestore.FieldValue.arrayUnion(loginEntry) // ✅ Valid sekarang
});
      console.log(`IP: ${ip}, Device: ${deviceInfo}`);
      showMessage('Login berhasil. Tercatat.', true);
    })
    .catch((error) => {
      console.error("Gagal ambil IP:", error);
    });
}

function detectBrowser(userAgent) {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown Browser";
}

function checkAdminStatus(uid) {
  firestore.collection('users').doc(uid).get().then((doc) => {
    if (doc.exists) {
      const role = doc.data().role;
      localStorage.setItem('isAdmin', role === 'admin' ? '1' : '0');
      
      console.log('Role:', role);

      const adminFab = document.getElementById('adminFabBtn');
if (adminFab) {
  adminFab.style.display = isAdmin ? 'block' : 'none';
}
      if (role === 'admin') {
        isAdmin = true;
        renderAdminMemberList();
      }
    } else {
      isAdmin = false;
    }
  }).catch((err) => {
    console.error("Gagal cek admin:", err);
    isAdmin = false;
  });
}



function renderAdminMemberList() {
  if (!isAdmin) {
    document.getElementById('adminMemberList').innerHTML = '<p>Access denied. Admin privileges required.</p>';
    return;
  }

  firestore.collection('users').get().then((snapshot) => {
    let html = '<div class="member-list">';
    snapshot.forEach(doc => {
      const user = doc.data();
      const uid = doc.id;
      const registeredDate = user.registeredAt?.toDate().toLocaleDateString() || 'N/A';
      const lastLogin = user.lastLogin?.toDate().toLocaleDateString() || 'Never';

      html += `
        <div class="member-card">
          <div class="member-info">
            <strong>Email:</strong> ${user.email}<br>
            <strong>Role:</strong> ${user.role || 'member'}<br>
            <strong>Registered:</strong> ${registeredDate}<br>
            <strong>Last Login:</strong> ${lastLogin}
          </div>
          <div class="member-actions">
            <button class="btn" onclick="toggleUserRole('${uid}', '${user.role || 'member'}')">Toggle Role</button>
            <button class="btn delete-btn" onclick="deleteMember('${uid}')">Delete</button>
          </div>
        </div>`;
    });
    html += '</div>';
    document.getElementById('adminMemberList').innerHTML = html;
  });
}

function toggleUserRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin';
  firestore.collection('users').doc(uid).update({ role: newRole })
    .then(() => {
      alert(`User role changed to ${newRole}`);
      renderAdminMemberList();
    });
}

function deleteMember(uid) {
  if (confirm('Hapus user ini?')) {
    firestore.collection('users').doc(uid).delete()
      .then(() => {
        alert('User deleted');
        renderAdminMemberList();
      });
  }
}



// Function to change profile photo
function changeProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file || !currentUser) return;

  const storageRef = storage.ref(`avatars/${currentUser.uid}`);
  storageRef.put(file).then(snapshot => {
    return snapshot.ref.getDownloadURL();
  }).then(url => {
    document.getElementById('profilePhoto').src = url;
    firestore.collection('users').doc(currentUser.uid).update({ photoUrl: url });
    showMessage('Foto profil diperbarui', true);
  }).catch(error => {
    showMessage('Upload gagal: ' + error.message);
  });
}
function saveProfile() {
  if (!currentProfile) return;
  const profile = document.getElementById('profileUsername').value.trim();
  const email = document.getElementById('profileEmail').value;
  const phone = document.getElementById('profilePhone').value;
  const username = document.getElementById('profileUsername').value;
  
  firestore.collection('users').doc(currentUser.uid).update({
    email: email,
    phone: phone,
    username: username
  })
  .then(() => {
    showMessage('Profil berhasil disimpan', true);
  })
  .catch((err) => {
    showMessage('Gagal menyimpan profil: ' + err.message);
  });
}

// Function to show profile data
function showMessage(msg, success = false) {
  const el = document.getElementById('authError');
  if (el) {
    el.innerText = msg;
    el.className = success ? 'auth-success' : '';
    el.style.display = 'block'; // <-- tambahkan baris ini
  } 
    alert(msg);
}

function switchToRegister() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function switchToLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

function logoutUser() {
  auth.signOut().then(() => {
    currentUser = null;
    isAdmin = false;
    showAuthModal(false);
    showPage('home');
  });
}

function showAuthModal(showRegister = false) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.style.display = 'block';
  document.getElementById('tabLogin').style.background = showRegister ? '#eee' : '#2563eb';
  document.getElementById('tabLogin').style.color = showRegister ? '#2563eb' : '#fff';
  document.getElementById('tabRegister').style.background = showRegister ? '#2563eb' : '#eee';
  document.getElementById('tabRegister').style.color = showRegister ? '#fff' : '#2563eb';
  document.getElementById('loginForm').style.display = showRegister ? 'none' : 'block';
  document.getElementById('registerForm').style.display = showRegister ? 'block' : 'none';
  document.getElementById('authError').style.display = 'none';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    checkAdminStatus(user.uid);
    updateLastLogin(user.uid);
    closeModal('authModal');
    showPage('home');
  } else {
    currentUser = null;
    isAdmin = false;
    showAuthModal(false);
  }
});


// Global Variables
let currentGroupId = null;
let currentProfile = null;
let blogPage = 1;
const BLOGS_PER_PAGE = 12;
  
    // Start header slider
    
    // Load saved images
    


// Header Slider Functions
function startHeaderSlider() {
    const slides = document.querySelectorAll('#header-slider .slide');
    let index = 0;
    if (slides.length === 0) return;

    slides[index].classList.add('active');

    setInterval(() => {
        slides[index].classList.remove('active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('active');
    }, 4000);
}

// Page Content
const pages = {
    admin: `
        <h2>Member Registration & Management</h2>
        <div class="admin-section">
            <h3>Registered Members</h3>
            <div id="adminMemberList"></div>
            <button class="btn" onclick="refreshMemberList()" style="margin-top:12px;">Refresh Member List</button>
            <button class="btn delete-btn" onclick="resetAllMembers()" style="margin-top:12px;">Reset All Members</button>
        </div>
        <div class="admin-section" style="margin-top:20px;">
            <h3>Quick Actions</h3>
            <button class="btn" onclick="exportMemberData()" style="margin-top:8px;">Export Member Data</button>
            <button class="btn" onclick="showChangePasswordForm()" style="margin-top:8px;">Change Admin Password</button>
            <button class="btn" onclick="showPage('home')" style="margin-top:8px;">Back to Home</button>
        </div>
        <!-- Modal Member List -->
<div id="memberListModal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0005;justify-content:center;align-items:center;z-index:9999;">
  <div class="modal-content" style="background:#fff;padding:20px;border-radius:10px;max-height:80vh;overflow:auto;min-width:320px;">
    <h3>👥 Daftar Member</h3>
    <table id="memberTable" border="1" style="width:100%;border-collapse:collapse;">
      <thead>
        <tr><th>Email</th><th>Role</th><th>Aksi</th></tr>
      </thead>
      <tbody id="memberTableBody">
        <!-- Otomatis terisi -->
      </tbody>
    </table>
    <div style="text-align:right;margin-top:10px;">
      <button onclick="closeModal('memberListModal')" class="btn">Tutup</button>
    </div>
  </div>
</div>
        <!-- Modal Change Password -->
        <div id="changePasswordModal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0005;justify-content:center;align-items:center;z-index:9999;">
            <div class="modal-content" style="background:#fff;padding:20px;border-radius:10px;min-width:320px;">
                <h3>Change Admin Password</h3>
                <label>New Password:<br><input type="password" id="newAdminPassword" required></label><br>
                <button onclick="changeAdminPassword()" class="btn">Change Password</button>
                <button onclick="closeModal('changePasswordModal')" class="btn">Cancel</button>
            </div>
        </div>

    `,
    home: `
        <div style="font-size:1.05em; color:#333; margin-bottom:8px;">
            Welcome to ConsPIndo App. Empowering Pi Network Community Connections through Knowledge and Innovation
            You can join here to get much benefits together with others and Us.
        </div>
        <div class="message-row">
            <span>Get in Touch<br><span style="font-size:0.95em;color:#888;">ConsPIndo</span></span>
            <button id="messageBtn">Message</button>
        </div>
        <div class="invite-code">
            <span id="inviteCode">2QQ32Y</span>
            <button onclick="copyInviteCode()" title="Copy Code"><i class="fa fa-copy"></i></button>
        </div>
        <div class="post-card" id="userPostCard"></div>
        <div class="social-bar">
            <a href="#" title="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" title="Facebook"><i class="fab fa-facebook"></i></a>
            <a href="#" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
            <a href="#" title="YouTube"><i class="fab fa-youtube"></i></a>
            <a href="#" title="TikTok"><i class="fab fa-tiktok"></i></a>
        </div>
    `,
    schedule: `
        <div id="calendar"></div>
        <div id="eventModal" style="display:none; position:fixed; left:0; top:0; width:100vw; height:100vh; background:#0005; align-items:center; justify-content:center; z-index:9999;">
            <form id="eventForm" style="background:#fff; padding:20px; border-radius:8px; min-width:260px;">
                <h3 id="modalTitle">Tambah Jadwal</h3>
                <input type="hidden" id="eventId">
                <label>Judul:<br><input type="text" id="eventTitle" required></label><br>
                <label>Tanggal & Waktu Mulai:<br><input type="datetime-local" id="eventStart" required></label><br>
                <label>Tanggal & Waktu Selesai:<br><input type="datetime-local" id="eventEnd"></label><br>
                <label>Deskripsi:<br><textarea id="eventDesc"></textarea></label><br>
                <button type="submit">Simpan</button>
                <button type="button" onclick="closeModal('eventModal')">Batal</button>
                <button type="button" id="deleteBtn" style="display:none; color:red;">Hapus</button>
            </form>
        </div>
        <div class="modal" id="detailScheduleModal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closeModal('detailScheduleModal')">&times;</span>
                <h3 id="detailTitle"></h3>
                <p><b>Mulai:</b> <span id="detailStart"></span></p>
                <p><b>Selesai:</b> <span id="detailEnd"></span></p>
                <p><b>Deskripsi:</b> <span id="detailDesc"></span></p>
                <button>Edit Jadwal</button>
            </div>
        </div>
    `,
    services: `
        <h2>Our Services(Dalam Pengembangan)</h2>
        <ul>
            <li>Konsultasi Komunitas</li>
            <li>Webinar & Workshop</li>
            <li>Support Project Pi Network</li>
            <li>Q & A</li>
        </ul>
    `,
    blog: `
        <div id="blog" class="tab-content">
            <h2 id="blogTitle">Blog</h2>
            <button id="addArticleButton" class="btn" onclick="showArticleForm()">Tambah Artikel</button>
            <div id="blogContent"></div>
            <div id="articleForm" style="display: none;">
                <h4>Tulis Artikel Baru</h4>
                <input type="text" id="articleTitle" placeholder="Judul Artikel" style="width: 100%; margin-bottom: 10px;">
                <div id="editor" style="height:120px;margin-bottom:10px;"></div>
                <input type="file" id="articleImage" accept="image/*" style="margin:10px 0;">
                <button class="btn" onclick="saveArticle()">Simpan Artikel</button>
            </div>
        </div>
    `,
    profile: `
        <h2>My Profile</h2>
        <div style="text-align:center;margin-bottom:12px;">
            <img id="profilePhoto" src="" alt="Foto Profil">
            <br>
            <input type="file" id="profilePhotoInput" accept="image/*" style="margin-top:8px;" onchange="uploadProfilePhoto(event)"
>
        </div>
        <div style="max-width:320px;margin:0 auto;">
            <label>Username:</label>
            <input type="text" id="profileUsername" style="width:100%;margin-bottom:8px;">
            <label>Email:</label>
            <input type="email" id="profileEmail" style="width:100%;margin-bottom:8px;">
            <label>No. HP:</label>
            <input type="text" id="profilePhone" style="width:100%;margin-bottom:12px;">
            <button class="btn" onclick="saveProfile()">Simpan Profil</button>
            <button onclick="logoutUser()" class="btn delete-btn" style="margin-left:8px;">Logout</button>
        </div>
    `,
    group: `
        <h2>Group List</h2>
        <div id="adminGroupBtns"></div>
        <div id="groupList"></div>
    `,
    shop: `
        <h2>Shop / MarketPlace</h2>
        <div id="adminShopBtns"></div>
        <div id="shopProducts"></div>
        <hr>
        <button onclick="showCart()">Lihat Keranjang (<span id="cartCount">0</span>)</button>
        <div id="cartModalContent" style="margin-top:10px;"></div>
    `
};


// Function to initialize the schedule calendar
function initScheduleCalendar() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) {
  console.warn('Elemen #calendar tidak ditemukan!');
  return;
}
 calendarEl.innerHTML = ''; // 🔄 Clear sebelum render ulang

  firestore.collection('events').get().then(snapshot => {
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        start: data.start.toDate(),
        end: data.end ? data.end.toDate() : null,
        description: data.description || ''
      };
    });

    // Initialize FullCalendar
  
const openEventModal = (eventData = {}) => {
  const modal = document.getElementById('eventModal');
  if (!modal) return;

  const titleInput = modal.querySelector('#eventTitle');
  const startInput = modal.querySelector('#eventStart');
  const endInput = modal.querySelector('#eventEnd');
  const descInput = modal.querySelector('#eventDescription');

  if (!titleInput || !startInput || !endInput || !descInput) {
    console.warn('Input dalam #eventModal tidak lengkap!');
    return;
  }

  titleInput.value = eventData.title || '';
  startInput.value = eventData.start || '';
  endInput.value = eventData.end || '';
  descInput.value = eventData.description || '';

  modal.style.display = 'block';
};

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: events,
      dateClick: function(info) {
        openEventModal({ start: info.dateStr });
      },
      eventClick: function(info) {
        openEventModal({
          id: info.event.id,
          title: info.event.title,
          start: info.event.start.toISOString().slice(0,16),
          end: info.event.end ? info.event.end.toISOString().slice(0,16) : '',
          description: info.event.extendedProps?.description || ''
        });
      }
    });

    calendar.render();
  });
}


// Logo and Header Functions
/*
function changeLogo(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const logoImg = document.getElementById('logoImg');
            if (logoImg) {
                logoImg.src = e.target.result;
                localStorage.setItem('customLogo', e.target.result);
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function changeHeaderBg(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('headerBg').src = e.target.result;
        localStorage.setItem('headerBg', e.target.result);
    };
    reader.readAsDataURL(file);
}
*/

// Function to copy invite code
function copyInviteCode() {
    const inviteCode = document.getElementById('inviteCode').innerText;
    navigator.clipboard.writeText(inviteCode).then(() => {
        alert('Kode undangan telah disalin: ' + inviteCode);
    });
}

// =========================
// ✅ FIRESTORE: Member List Modal
// =========================

function showMemberListModal() {
  const tbody = document.getElementById('memberTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  firestore.collection('users').get().then(snapshot => {
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="3">Belum ada member</td></tr>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const user = doc.data();
      const uid = doc.id;
      html += `
        <tr>
          <td>${user.email || '-'}</td>
          <td>${user.role || 'member'}</td>
          <td>
            <button onclick="toggleUserRole('${uid}', '${user.role || 'member'}')">Ubah Role</button>
            <button onclick="deleteMember('${uid}')">Hapus</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
    openModal('memberListModal');
  }).catch(err => {
    tbody.innerHTML = `<tr><td colspan="3" style="color:red;">${err.message}</td></tr>`;
  });
}

function refreshMemberList() {
  showMemberListModal();
}

function toggleUserRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'member' : 'admin';
  firestore.collection('users').doc(uid).update({ role: newRole })
    .then(() => {
      alert('Role diubah menjadi ' + newRole);
      showMemberListModal();
    });
}

function deleteMember(uid) {
  if (!confirm('Yakin ingin hapus member ini?')) return;
  firestore.collection('users').doc(uid).delete().then(() => {
    alert('Member dihapus');
    showMemberListModal();
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// =========================
// ✅ END: Member List Modal
// =========================


// Page Management
function showPage(page) {
  document.getElementById('pageContent').innerHTML = pages[page] || '';

  if (page === 'group') {
    setTimeout(() => {
      renderGroupList();
      showAdminGroupBtns();
    }, 50);
  }

  if (page === 'blog') {
    setTimeout(renderArticles, 100);
  }

  if (page === 'home') {
    renderUserPostCard();
    const msgBtn = document.getElementById('messageBtn');
    if (msgBtn) {
      msgBtn.onclick = () => alert('Fitur pesan diaktifkan!');
    }
  }

  if (page === 'shop') {
    setTimeout(() => {
      renderShopProducts();
      showAdminShopBtns();
    }, 50);
  }

  if (page === 'profile') {
    showProfileData();
  }

  if (page === 'admin') {
   
  }

  if (page === 'schedule') {
    setTimeout(() => {
      const calendarEl = document.getElementById('calendar');
      const eventForm = document.getElementById('eventForm');
      if (calendarEl && eventForm) {
        initScheduleCalendar();
      }
    }, 100);
  }

  // 🧠 Tambahkan ini untuk menunggu elemen siap lalu pasang handler
  setTimeout(setupEventHandlers, 100);
}



document.addEventListener('DOMContentLoaded', function() {

  document.getElementById('tabLogin').onclick = () => showAuthPage(false);
  document.getElementById('tabRegister').onclick = () => showAuthPage(true);
  
  document.getElementById('loginBtn').onclick = () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  loginUser(email, password);
};

  document.getElementById('registerBtn').onclick = () => {
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regPassword2').value;
  if (password !== confirm) {
    showMessage('Password tidak sama');
    return;
  }
  registerUser(email, password);
};

  const eventForm = document.getElementById('eventForm');
  if (eventForm) {
    eventForm.onsubmit = function(e) {
      e.preventDefault();
      const id = document.getElementById('eventId').value;
      const title = document.getElementById('eventTitle').value;
      const start = document.getElementById('eventStart').value;
      const end = document.getElementById('eventEnd').value;
      const description = document.getElementById('eventDesc').value;

      const deleteBtn = document.getElementById('deleteBtn');
if (deleteBtn) {
  deleteBtn.onclick = function () {
    const id = document.getElementById('eventId').value;
    if (id && confirm('Yakin ingin menghapus jadwal ini?')) {
      firestore.collection('events').doc(id).delete().then(() => {
        closeModal('eventModal');
        initScheduleCalendar(); // 🔁 Refresh kalender
      });
    }
  };
}
      if (!title || !start) {
        alert('Judul dan tanggal mulai harus diisi!');
        return;
      }
      const eventData = {
        title,
        start: firebase.firestore.Timestamp.fromDate(new Date(start)),
        end: end ? firebase.firestore.Timestamp.fromDate(new Date(end)) : null,
        description
      };

      if (id) {
        // Update event
        firestore.collection('events').doc(id).update(eventData).then(() => {
          closeModal('eventModal');
          initScheduleCalendar();
        });
      } else {
        // Add new event
        firestore.collection('events').add(eventData).then(() => {
          closeModal('eventModal');
          initScheduleCalendar();
        });
      }
    };
  }
});

// Modal Functions

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error('Modal dengan id "' + id + '" tidak ditemukan!');
    return;
  }
  el.style.display = 'flex'; // lebih baik daripada 'block' untuk modal fleksibel
  el.classList.add('active-modal'); // opsional jika kamu pakai efek CSS
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  el.classList.remove('active-modal');
}

// Copy Functions
function copyInviteCode() {
    const codeEl = document.getElementById('inviteCode');
    const code = codeEl.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function() {
            alert('Invite code copied!');
        });
    } else {
        const temp = document.createElement('input');
        document.body.appendChild(temp);
        temp.value = code;
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert('Invite code copied!');
    }
}

function copyGroupInviteCode() {
    let codeEl = document.getElementById('groupInviteCodeModal') || document.getElementById('groupInviteCode');
    if (!codeEl) {
        alert('Kode invite tidak ditemukan!');
        return;
    }
    const code = codeEl.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function() {
            alert('Invite code copied!');
        });
    } else {
        const temp = document.createElement('input');
        document.body.appendChild(temp);
        temp.value = code;
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert('Invite code copied!');
    }
}


// Tab Management
function setActiveTab(tabId) {
    document.querySelectorAll('.tab-menu button').forEach(btn => btn.classList.remove('active'));
    if (tabId) {
        document.getElementById(tabId).classList.add('active');
    }
}

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", function () {
    startHeaderSlider();
    
    // Load saved images
    const savedLogo = localStorage.getItem('customLogo');
    if (savedLogo) {
        const logoImg = document.getElementById('logoImg');
        if (logoImg) {
            logoImg.src = savedLogo;
        }
    }
    
    const bg = localStorage.getItem('headerBg');
    if (bg) document.getElementById('headerBg').src = bg;


     const saveEventBtn = document.getElementById('saveEventBtn');
  if (saveEventBtn) {
    saveEventBtn.onclick = function() {
      // Ambil data dari input
      const title = document.getElementById('eventTitle').value;
      const date = document.getElementById('eventDate').value;
      // Simpan ke Firestore atau array, lalu refresh kalender
      // ...implementasi simpan event...
    };
  }
});
    
function setupEventHandlers() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      loginUser(email, password);
    };
  }

  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.onclick = () => {
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regPassword2').value;
      if (password !== confirm) {
        showMessage('Password tidak sama');
        return;
      }
      registerUser(email, password);

      const tabRegister = document.getElementById('tabRegister');
if (tabRegister) {
  tabRegister.onclick = switchToRegister;
}
    };
  }
}

function openModal(eventModal = null) {
  const modal = document.getElementById('eventModal');
  if (!modal) return;

  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('eventId');
  const titleInput = document.getElementById('eventTitle');
  const startInput = document.getElementById('eventStart');
  const endInput = document.getElementById('eventEnd');
  const descInput = document.getElementById('eventDesc');
  const deleteBtn = document.getElementById('deleteBtn');

  if (!title || !idInput || !titleInput || !startInput || !descInput) {
    console.warn('Elemen input modal belum tersedia!');
    return;
  }

  modal.style.display = 'flex';

  const isEdit = !!eventData;
  title.innerText = isEdit ? 'Edit Jadwal' : 'Tambah Jadwal';

  idInput.value = isEdit ? eventData.id : '';
  titleInput.value = isEdit ? eventData.title : '';
  startInput.value = isEdit ? eventData.start : '';
  endInput.value = isEdit ? eventData.end : '';
  descInput.value = isEdit ? eventData.description : '';

  // 🔍 DETEKSI JADWAL LEWAT
  if (isEdit && eventData.end) {
    const endDate = new Date(eventData.end);
    const now = new Date();
    const isPast = endDate < now;

    if (isPast) {
      deleteBtn.style.display = 'inline-block'; // ✅ tampilkan
      deleteBtn.disabled = false;
    } else {
      deleteBtn.style.display = 'none'; // ❌ sembunyikan jika belum lewat
    }
  } else {
    deleteBtn.style.display = 'none'; // untuk Tambah Jadwal
  }
}

    // Setup event handlers
    setupEventHandlers();
    
    // Let Firebase Auth State Observer handle authentication
    // The auth state observer will show the appropriate content
function setupEventHandlers() {
  const tabIds = [
    { id: 'homeTab', page: 'home' },
    { id: 'scheduleTab', page: 'schedule' },
    { id: 'servicesTab', page: 'services' },
    { id: 'blogTab', page: 'blog' }
  ];

  tabIds.forEach(tab => {
    const el = document.getElementById(tab.id);
    if (el) {
      el.onclick = () => {
        setActiveTab(tab.id);
        showPage(tab.page);
      };
    }
  });

  // Bottom nav
  const mySitesMenu = document.getElementById('mySitesMenu');
  if (mySitesMenu) {
    mySitesMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab('homeTab');
      showPage('home');
    };
  }

  const myProfileMenu = document.getElementById('myProfileMenu');
  if (myProfileMenu) {
    myProfileMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab('profileMenuBtn');
      showPage('profile');
    };
  }

  const groupMenu = document.getElementById('groupMenu');
  if (groupMenu) {
    groupMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab('groupMenu');
      showPage('group');
    };
  }

const shopMenu = document.getElementById('shopMenu');
if (shopMenu) {
  shopMenu.onclick = (e) => {
    e.preventDefault();
    setActiveTab('shopMenu');

    setTimeout(() => {
      showPage('shop'); // ✅ Panggil dengan penundaan agar isAdmin() sudah siap
    }, 100);
  };
}


// Profile photo upload handler
const profilePhotoInput = document.getElementById('profilePhotoInput');
if (profilePhotoInput) {
    profilePhotoInput.addEventListener('change', uploadProfilePhoto);
}
const profileMenuBtn = document.getElementById('profileMenuBtn');
if (profileMenuBtn) {
  profileMenuBtn.onclick = () => {
    setActiveTab('profileMenuBtn');
    showPage('profile');
    showProfileData();
  };
}
    // Admin button handler
    const adminMenuBtn = document.getElementById('adminMenuBtn');
if (adminMenuBtn) {
  adminMenuBtn.onclick = function() {
    if (!isAdmin) {
  document.getElementById('adminMenuBtn').style.display = 'none';
}
    if (!isAdmin) {
      alert('You do not have permission to access this page.');
      return;
    }
    setActiveTab('adminMenuBtn');
    showPage('admin');
    setTimeout(renderAdminMemberList, 100); // ✅ tambahkan delay agar DOM siap
  };
}
}

// Additional placeholder functions (to be implemented)

function showAuthPage(showRegister = false) {
  showAuthModal(showRegister);
}

function showChangePasswordForm() {
  openModal('changePwdModal');
}

function renderUserPostCard() {
    const postCard = document.getElementById('userPostCard');
    if (!currentUser || !postCard) return;
    firestore.collection('posts')
        .where('uid', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                postCard.innerHTML = '<i>Belum ada postingan.</i>';
                return;
            }
            const post = snapshot.docs[0].data();
            postCard.innerHTML = `
                <div class="post-avatar"><img src="${post.photoUrl || 'default.jpg'}" alt="User"></div>
                <div class="post-content">${post.content || ''}</div>
                <div class="post-date">${post.createdAt?.toDate().toLocaleString() || ''}</div>
            `;
        });
}

function showProfileData() {  
    if (!currentUser) return;
    firestore.collection('users').doc(currentUser.uid).get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        document.getElementById('profilePhoto').src = data.photoUrl || 'default.jpg';
        document.getElementById('profileUsername').value = data.username || '';
        document.getElementById('profileEmail').value = data.email || '';
        document.getElementById('profilePhone').value = data.phone || '';
    });
}

function renderAdminMemberList() {
    if (!isAdmin) {
        document.getElementById('adminMemberList').innerHTML = '<p>Access denied. Admin privileges required.</p>';
        return;
    }
    firestore.collection('users').get().then(snapshot => {
        let html = '<div class="member-list">';
        snapshot.forEach(doc => {
            const user = doc.data();
            const uid = doc.id;
            html += `
                <div class="member-card">
                    <div class="member-info">
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Role:</strong> ${user.role || 'member'}<br>
                        <strong>Registered:</strong> ${user.registeredAt?.toDate().toLocaleDateString() || 'N/A'}<br>
                        <strong>Last Login:</strong> ${user.lastLogin?.toDate().toLocaleDateString() || 'Never'}
                    </div>
                    <div class="member-actions">
                        <button class="btn" onclick="toggleUserRole('${uid}', '${user.role || 'member'}')">Toggle Role</button>
                        <button class="btn delete-btn" onclick="deleteMember('${uid}')">Delete</button>
                    </div>
                </div>`;
        });
        html += '</div>';
        document.getElementById('adminMemberList').innerHTML = html;
    });
}

function renderAdminMemberList() {
  const el = document.getElementById('adminMemberList');
  if (!el) return;

  firestore.collection('users').get().then(snapshot => {
    let html = '<div class="member-list">';
    snapshot.forEach(doc => {
      const user = doc.data();
      const uid = doc.id;
      html += `
        <div class="member-card">
          <strong>${user.email}</strong><br>
          Role: ${user.role || 'member'}<br>
          <button onclick="toggleUserRole('${uid}', '${user.role || 'member'}')">Ubah Role</button>
          <button onclick="deleteMember('${uid}')">Hapus</button>
        </div>
      `;
    });
    html += '</div>';
    el.innerHTML = html;
  });
}


function renderArticles() {
  const blogContent = document.getElementById('blogContent');
  if (!blogContent) return;

  firestore.collection('articles').orderBy('createdAt', 'desc').get().then(snapshot => {
    if (snapshot.empty) {
      blogContent.innerHTML = '<i>Belum ada artikel.</i>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const art = doc.data();
      html += `
        <div class="blog-post">
          <h3>${art.title}</h3>
          ${art.image ? `<img src="${art.image}" style="max-width:100%;border-radius:6px;margin-bottom:8px;">` : ''}
          <div>${art.content}</div>
          <small><i>Dibuat: ${art.createdAt?.toDate().toLocaleString() || '-'}</i></small>
          ${isAdmin() ? `<div><button onclick="editArticle('${doc.id}')">✏ Edit</button></div>` : ''}
        </div>
        <hr>
      `;
    });

    blogContent.innerHTML = html;
  });
}


function saveArticle() {
  const title = document.getElementById('articleTitle').value.trim();
  const imageFile = document.getElementById('articleImage').files[0];
  const content = window.quill?.root.innerHTML || '';

  if (!title || !content) {
    alert('Judul dan isi artikel wajib diisi!');
    return;
  }

  const articleData = {
    title,
    content,
    createdAt: firebase.firestore.Timestamp.now(),
    author: firebase.auth().currentUser?.email || 'Anonim',
  };

  // Jika ada gambar, baca dulu base64-nya
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      articleData.image = e.target.result;
      firestore.collection('articles').add(articleData).then(() => {
        alert('Artikel berhasil disimpan!');
        hideArticleForm();
        renderArticles();
      });
    };
    reader.readAsDataURL(imageFile);
  } else {
    firestore.collection('articles').add(articleData).then(() => {
      alert('Artikel berhasil disimpan!');
      hideArticleForm();
      renderArticles();
    });
  }
}

function showArticleForm() {
  document.getElementById('articleForm').style.display = 'block';
  document.getElementById('addArticleButton').style.display = 'none';
}
  // ✅ Inisialisasi ulang Quill hanya jika belum ada
  if (!window.quill && document.getElementById('editor')) {
    window.quill = new Quill('#editor', { theme: 'snow' });
  }

function hideArticleForm() {
  document.getElementById('articleForm').style.display = 'none';
  document.getElementById('addArticleButton').style.display = 'block';
}



function showAdminGroupBtns() {
    if (!isAdmin) return;
    const adminBtns = document.getElementById('adminGroupBtns');
    if (!adminBtns) return;
    adminBtns.innerHTML = `
        <button class="btn" onclick="addGroup()">Tambah Group</button>
        <button class="btn" onclick="refreshGroupList()">Refresh Group</button>
    `;
}
function addGroup() {
  const groupName = prompt("Masukkan Nama Group:");
  if (!groupName) return;

  const groupDesc = prompt("Deskripsi Group:");
  
  firestore.collection('groups').add({
    name: groupName,
    description: groupDesc,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert('Group berhasil ditambahkan.');
    refreshGroupList(); // reload daftar
  }).catch(error => {
    alert('Gagal tambah group: ' + error.message);
  });
}

function refreshGroupList() {
  renderGroupList();
}
function joinGroup(groupId) {
  const user = firebase.auth().currentUser;
  if (!user) return alert('Harap login terlebih dahulu');
  
  firestore.collection('groups').doc(groupId).update({
    members: firebase.firestore.FieldValue.arrayUnion(user.uid)
  }).then(() => {
    alert('Berhasil bergabung ke grup!');
    renderGroupList();
  }).catch(err => {
    alert('Gagal join group: ' + err.message);
  });
}

function leaveGroup(groupId) {
  const user = firebase.auth().currentUser;
  if (!user) return alert('Harap login terlebih dahulu');

  firestore.collection('groups').doc(groupId).update({
    members: firebase.firestore.FieldValue.arrayRemove(user.uid)
  }).then(() => {
    alert('Berhasil keluar dari grup!');
    renderGroupList();
  });
}

function deleteGroup(groupId) {
  if (!confirm('Yakin ingin menghapus grup ini?')) return;
  firestore.collection('groups').doc(groupId).delete().then(() => {
    alert('Grup berhasil dihapus');
    renderGroupList();
  });
}

function renderGroupList() {
  const groupList = document.getElementById('groupList');
  if (!groupList) return;

  firestore.collection('groups').get().then(snapshot => {
    if (snapshot.empty) {
      groupList.innerHTML = '<i>Belum ada group.</i>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const group = doc.data();
      const groupId = doc.id;

      const currentUid = auth.currentUser?.uid;
      const isMember = group.members?.includes(currentUid);
      const isAdmin = group.adminId === currentUid;

      // Tombol dinamis berdasarkan status user
      let buttons = '';
      if (!isMember) {
        buttons += `<button onclick="joinGroup('${groupId}')">Gabung</button>`;
      } else {
        buttons += `<button onclick="leaveGroup('${groupId}')">Keluar</button>`;
      }

      if (isAdmin) {
        buttons += `<button onclick="deleteGroup('${groupId}')">Hapus</button>`;
      }

      html += `
        <div class="group-card">
          <strong>${group.name}</strong><br>
          <span>${group.description || ''}</span><br>
          ${buttons}
        </div>
      `;
    });

     groupList.innerHTML = html;
  }).catch(err => {
    groupList.innerHTML = `<p style="color:red;">Gagal memuat grup: ${err.message}</p>`;
  });
}




// ✅ Fix untuk error classList dan klik tab
function setActiveTab(tabId) {
  document.querySelectorAll('.tab-menu button').forEach(btn => btn.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const myProfileMenu = document.getElementById('myProfileMenu');
  if (myProfileMenu) {
    myProfileMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab('profileMenuBtn');
      showPage('profile');
    };
  }
});


// Close modal when clicking outside
window.onclick = function(event) {
    ['scheduleModal','inviteModal','chatModal','groupChatModal','changePwdModal','checkoutModal','authModal'].forEach(function(id) {
        var modal = document.getElementById(id);
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
};
