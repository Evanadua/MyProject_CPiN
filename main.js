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

// Syncronisasi Android dan Firebase_Web
firebase.firestore().collection("generalInfo").onSnapshot(snapshot => {
  snapshot.forEach(doc => {
    document.getElementById("memberCount").innerText = doc.data().memberCount;
  });
});

//...Tampilan Style...
const style = document.createElement("style");
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
  PI: (value) => `π ${parseFloat(value).toFixed(8)}`,
  USD: (value) =>
    "$" +
    parseFloat(value).toLocaleString("en-US", { minimumFractionDigits: 2 }),
  IDR: (value) => "Rp " + parseFloat(value).toLocaleString("id-ID"),
};

function formatCurrency(value, currency) {
  const formatter = currencyFormatters[currency] || currencyFormatters["IDR"];
  return formatter(value);
}

function renderProductImage(url, altText) {
  const safeUrl = url && url.trim() !== "" ? url : "assets/no-image.png";
  return `<img src="${safeUrl}" alt="${altText}" onerror="this.onerror=null;this.src='assets/no-image.png';">`;
}

function isAdmin() {
  return localStorage.getItem("isAdmin") === "1";
}

function showAdminShopBtns() {
  const div = document.getElementById("adminShopBtns");
  if (!div) return;
  div.innerHTML = isAdmin()
    ? `
    <button onclick="showAddProductForm()" class="btn">Tambah Produk</button>
    <button onclick="logoutAdmin()" class="btn delete-btn">Logout Admin</button>
    <div id="addProductForm" style="display:none;"></div>
  `
    : `
    <button onclick="loginAdmin()" class="btn">Login Admin</button>
  `;
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = count > 0 ? count : "";
}

function addToCart(productId) {
  firestore
    .collection("products")
    .doc(productId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        alert("Produk tidak ditemukan");
        return;
      }
      const prod = doc.data();
      if (prod.stock < 1) {
        alert("Stok habis");
        return;
      }

      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((item) => item.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          id: productId,
          name: prod.name,
          price: prod.price,
          currency: prod.currency,
          qty: 1,
        });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();

      // Kurangi stok di Firestore
      firestore
        .collection("products")
        .doc(productId)
        .update({
          stock: prod.stock - 1,
        })
        .then(() => renderShopProducts());
      alert("Produk ditambahkan ke keranjang.");
    });
}

function renderShopProducts(filterLocation = "") {
  showAdminShopBtns();
  const container = document.getElementById("shopProducts");
  if (!container) return;
  container.innerHTML = "";

  firestore
    .collection("products")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      const grid = document.createElement("div");
      grid.className = "shop-grid";
      snapshot.forEach((doc) => {
        const prod = doc.data();
        const id = doc.id;
        // Filter lokasi (case-insensitive)
        if (
          filterLocation &&
          (!prod.location ||
            !prod.location.toLowerCase().includes(filterLocation.toLowerCase()))
        ) {
          return; // skip produk yang tidak cocok
        }
        const div = document.createElement("div");
        div.className = "shop-tile";
        div.innerHTML = `
        ${renderProductImage(prod.img, prod.name)}
        <!-- <div class="prod-id">ID: ${id}</div> -->
        <div class="prod-name">${prod.name}</div>
        <div class="prod-price">${formatCurrency(
          prod.price,
          prod.currency || "IDR"
        )}</div>
       <div class="prod-stock">Stok: ${prod.stock}</div>
       <div class="prod-location">
  <span style="color: red;">Map of Pi</span> : ${prod.location || "-"}
</div>


        <div class="prod-actions">
          ${
            !isAdmin()
              ? `
            <button onclick="showProductDetail('${id}')" class="btn">Detail</button>
            <button onclick="addToCart('${id}')" class="btn" ${
                  prod.stock < 1 ? "disabled" : ""
                }>Beli</button>
          `
              : `
            <button onclick="showAddProductForm('${id}')" class="btn edit-btn">Edit</button>
            <button onclick="deleteProduct('${id}')" class="btn delete-btn">Hapus</button>
          `
          }
        </div>
      `;
        grid.appendChild(div);
      });
      container.appendChild(grid);
      updateCartCount();
    });
}

function loginAdmin() {
  const pwd = prompt("Masukkan password admin:");
  if (pwd === "Adua#22adua") {
    localStorage.setItem("isAdmin", "1");
    alert("Login admin berhasil");
    showAdminShopBtns();
    renderShopProducts();
  }
}

function logoutAdmin() {
  localStorage.removeItem("isAdmin");
  alert("Logout admin berhasil");
  showAdminShopBtns();
  renderShopProducts();
}

function showProductDetail(id) {
  const modal = document.getElementById("productDetailModal");
  const content = document.getElementById("productDetailContent");
  if (!modal || !content) {
    console.error("Elemen input modal belum tersedia!");
    return;
  }

  firestore
    .collection("products")
    .doc(id)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        alert("Produk tidak ditemukan.");
        return;
      }
      const prod = doc.data();
      content.innerHTML = `
      <span class="close" onclick="closeModal('productDetailModal')">&times;</span>
      <h3>${prod.name}</h3>
      ${renderProductImage(prod.img, prod.name)}
      <p>${prod.desc || ""}</p>
      <p>Harga: ${formatCurrency(prod.price, prod.currency)}</p>
      <p>Stok tersedia: ${prod.stock}</p>
      <button onclick="addToCart('${id}')" ${
        prod.stock < 1 ? "disabled" : ""
      }>Tambah ke Keranjang</button>
    `;
      modal.style.display = "block";
    });
}

function showAddProductForm(editId = null) {
  const formDiv = document.getElementById("addProductForm");
  if (!formDiv) return;
  formDiv.style.display = "block";

  if (editId) {
    firestore
      .collection("products")
      .doc(editId)
      .get()
      .then((doc) => {
        const prod = doc.data();
        renderProductForm(formDiv, editId, prod);
      });
  } else {
    renderProductForm(formDiv);
  }
}
function filterShopByLocation() {
  const input = document.getElementById("filterLocation");
  const value = input ? input.value.trim() : "";
  renderShopProducts(value);
}

function resetShopFilter() {
  const input = document.getElementById("filterLocation");
  if (input) input.value = "";
  renderShopProducts();
}

function renderProductForm(
  container,
  id = null,
  prod = {
    name: "",
    price: "",
    currency: "IDR",
    stock: 1,
    desc: "",
    img: "",
    location: "",
  }
) {
  container.innerHTML = `
    <input type="text" id="prodName" placeholder="Nama Produk" value="${
      prod.name
    }">
    <input type="number" id="prodPrice" placeholder="Harga" value="${
      prod.price
    }">
    <input type="text" id="prod-location" placeholder="Lokasi Produk" value="${
      prod.location || ""
    }">

    <select id="prodCurrency">
      <option value="IDR" ${
        prod.currency === "IDR" ? "selected" : ""
      }>IDR</option>
      <option value="USD" ${
        prod.currency === "USD" ? "selected" : ""
      }>USD</option>
      <option value="PI" ${
        prod.currency === "PI" ? "selected" : ""
      }>π Pi Coin</option>
    </select>
    <input type="number" id="prodStock" placeholder="Stok" value="${
      prod.stock
    }">
    <textarea id="prodDesc" placeholder="Deskripsi">${prod.desc}</textarea>
    <input type="text" id="prodImg" placeholder="URL Gambar dari GitHub (RAW)" value="${
      prod.img
    }">
    <button onclick="${
      id ? `saveEditProduct('${id}')` : `saveNewProduct()`
    }" class="btn">${id ? "Simpan Edit" : "Simpan Produk"}</button>
    <button onclick="hideAddProductForm()" class="btn delete-btn">Batal</button>
  `;
}

function hideAddProductForm() {
  const div = document.getElementById("addProductForm");
  if (div) {
    div.style.display = "none";
    div.innerHTML = "";
  }
}

function showCart() {
  const cartModal = document.getElementById("cartModalContent");
  if (!cartModal) return;

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length === 0) {
    cartModal.innerHTML = "<p>Keranjang kosong.</p>";
    return;
  }

  let total = 0;
  cartModal.innerHTML = "";
  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div>${item.name} (${item.qty}) - ${formatCurrency(
      subtotal,
      item.currency
    )}</div>
      <button onclick="removeFromCart(${index}, '${item.id}', ${
      item.qty
    })" class="btn delete-btn">Hapus</button>
    `;
    cartModal.appendChild(div);
  });

  const totalDiv = document.createElement("div");
  totalDiv.innerHTML = `<strong>Total: ${formatCurrency(
    total,
    cart[0]?.currency
  )}</strong>`;
  cartModal.appendChild(totalDiv);

  const btn = document.createElement("button");
  btn.className = "btn";
  btn.innerText = "Checkout Sekarang";
  btn.onclick = () => {
    closeModal("cartModal");
    setTimeout(() => {
      const modal = document.getElementById("buyNowModal");
      const content = document.getElementById("buyNowContent");
      if (!modal || !content) {
        console.warn("Elemen input modal belum tersedia!");
        return;
      }
      renderCheckoutContent(content);
      modal.style.display = "block";
    }, 300);
  };
  cartModal.appendChild(btn);
}

function removeFromCart(index, productId, qty) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    // Kembalikan stok produk ke Firestore
    firestore
      .collection("products")
      .doc(productId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const prod = doc.data();
          firestore
            .collection("products")
            .doc(productId)
            .update({
              stock: prod.stock + qty,
            });
        }
      });

    showCart();
  }
}

function renderCheckoutContent(container) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length === 0) {
    container.innerHTML = "<p>Tidak ada item di keranjang.</p>";
    return;
  }

  let total = 0;
  container.innerHTML = "<h3>Ringkasan Pembelian</h3>";
  cart.forEach((item) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    const div = document.createElement("div");
    div.className = "checkout-item";
    div.innerHTML = `${item.name} x ${item.qty} = ${formatCurrency(
      subtotal,
      item.currency
    )}`;
    container.appendChild(div);
  });

  const totalDiv = document.createElement("div");
  totalDiv.innerHTML = `<strong>Total Akhir: ${formatCurrency(
    total,
    cart[0]?.currency
  )}</strong>`;
  container.appendChild(totalDiv);

  const nameInput = document.createElement("input");
  nameInput.placeholder = "Nama Lengkap";
  nameInput.id = "orderName";

  const addressInput = document.createElement("textarea");
  addressInput.placeholder = "Alamat Pengiriman";
  addressInput.id = "orderAddress";

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn";
  confirmBtn.innerText = "Proses Order";
  confirmBtn.onclick = processOrder;

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn delete-btn";
  cancelBtn.innerText = "Batal";
  cancelBtn.onclick = () => closeModal("buyNowModal");

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  btnRow.appendChild(confirmBtn);
  btnRow.appendChild(cancelBtn);

  container.appendChild(nameInput);
  container.appendChild(addressInput);
  container.appendChild(btnRow);

  const paymentSelect = document.createElement("select");
  paymentSelect.id = "orderPaymentMethod";
  paymentSelect.innerHTML = `
  <option value="cod">Bayar di Tempat (COD)</option>
  <option value="transfer">Transfer Bank</option>
  <option value="qris">QRIS</option>
  <option value="pi">π Pi Coin</option>
`;
  container.appendChild(paymentSelect);
}

function processOrder() {
  const name = document.getElementById("orderName").value;
  const address = document.getElementById("orderAddress").value;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!name || !address) {
    alert("Nama dan alamat wajib diisi.");
    return;
  }

  const paymentMethod = document.getElementById("orderPaymentMethod").value;
  const order = {
    name,
    address,
    paymentMethod,
    items: cart,
    status: "pending", // status awal
    timestamp: new Date().toISOString(),
  };

  firestore
    .collection("orders")
    .add(order)
    .then(() => {
      alert("Pesanan berhasil diproses!");
      localStorage.removeItem("cart");
      updateCartCount();
      closeModal("buyNowModal");
    })
    .catch((err) => {
      alert("Gagal memproses pesanan: " + err.message);
    });
}

function showEditProduct(id) {
  db.collection("products")
    .doc(id)
    .get()
    .then((doc) => {
      const data = doc.data();
      renderProductForm(container, id, data);
    });
}

function saveEditProduct(id) {
  const imageUrl = document.getElementById("prodImg").value;
  const name = document.getElementById("prodName").value;
  const price = parseFloat(document.getElementById("prodPrice").value);
  const currency = document.getElementById("prodCurrency").value;
  const stock = parseInt(document.getElementById("prodStock").value);
  const desc = document.getElementById("prodDesc").value;
  const location = document.getElementById("prod-location").value.trim();

  if (!location) {
    alert("Lokasi wajib diisi.");
    return;
  }

  if (!name || isNaN(price) || isNaN(stock) || !imageUrl || !location) {
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
    location,
    createdAt: new Date(), // Tetap simpan createdAt untuk konsistensi
  };

  firestore
    .collection("products")
    .doc(id)
    .update(data)
    .then(() => {
      hideAddProductForm();
      renderShopProducts();
    })
    .catch((err) => {
      alert("Gagal menyimpan perubahan: " + err.message);
    });
}

function saveNewProduct() {
  const name = document.getElementById("prodName").value;
  const price = parseFloat(document.getElementById("prodPrice").value);
  const currency = document.getElementById("prodCurrency").value;
  const stock = parseInt(document.getElementById("prodStock").value);
  const imageUrl = document.getElementById("prodImg").value;
  const desc = document.getElementById("prodDesc").value;
  const location = document.getElementById("prod-location").value.trim();

  if (!location) {
    alert("Lokasi wajib diisi.");
    return;
  }
  if (!name || isNaN(price) || isNaN(stock) || !imageUrl || !location) {
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
    createdAt: new Date(),
    location,
  };

  firestore
    .collection("products")
    .add(data)
    .then(() => {
      hideAddProductForm();
      renderShopProducts();
    })
    .catch((err) => {
      alert("Gagal menambahkan produk: " + err.message);
    });
}
function updateData() {
  const imageUrl = document.getElementById("prodImg").value;
  const name = document.getElementById("prodName").value;
  const price = parseFloat(document.getElementById("prodPrice").value);
  const currency = document.getElementById("prodCurrency").value;
  const stock = parseInt(document.getElementById("prodStock").value);
  const desc = document.getElementById("prodDesc").value;
  const location = document.getElementById("prod-location").value.trim();

  if (
    !name ||
    isNaN(price) ||
    isNaN(stock) ||
    !imageUrl ||
    !desc ||
    !location
  ) {
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
    location,
  };

  firestore
    .collection("products")
    .doc(id)
    .update(data)
    .then(() => {
      hideAddProductForm();
      renderShopProducts();
    })
    .catch((err) => {
      alert("Gagal menyimpan perubahan: " + err.message);
    });
}

function deleteProduct(id) {
  if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
    firestore
      .collection("products")
      .doc(id)
      .delete()
      .then(() => {
        alert("Produk berhasil dihapus.");
        renderShopProducts();
      })
      .catch((err) => {
        alert("Gagal menghapus produk: " + err.message);
      });
  }
}

window.onclick = function (event) {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};

// Product Form Functions (renderProductForm, showAddProductForm, saveNewProduct, saveEditProduct, hideAddProductForm)
// [Sudah termuat sebelumnya di dokumen ini, tidak digandakan agar tidak duplikat]
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

function showAdminPanel() {
  if (!isAdmin()) {
    showMessage("Akses ditolak. Hanya admin yang bisa membuka panel ini.");
    return;
  }

  showPage("admin");

  const memberListContainer = document.getElementById("adminMemberList");
  if (memberListContainer) {
    showPage("admin");
  }
}
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const adminFab = document.getElementById("adminFabBtn");
  if (adminFab) {
    adminFab.onclick = showAdminPanel;
  }
});

function loginUser(email, password) {
  auth
    .signInWithEmailAndPassword(email, password)
    .then((result) => {
      currentUser = result.user;
      updateLastLogin(currentUser.uid);
      return firestore.collection("users").doc(currentUser.uid).get();
    })
    .then((doc) => {
      if (doc.exists) {
        const role = doc.data().role || "member";
        localStorage.setItem("isAdmin", role === "admin" ? "1" : "0");
        localStorage.setItem("userRole", role);
        checkAdminFabVisibility(role); // Tampilkan FAB jika admin
      } else {
        localStorage.setItem("isAdmin", "0");
        localStorage.setItem("userRole", "member");
      }

      showMessage("Login berhasil", true);
      closeModal("authModal");
      showPage("home");
    })
    .catch((error) => {
      showMessage("Login gagal: " + error.message);
    });
}
function checkAdminFabVisibility(role) {
  const adminFab = document.getElementById("adminFabBtn");
  if (adminFab) {
    adminFab.style.display = role === "admin" ? "flex" : "none";
  }
}
function isAdmin() {
  return localStorage.getItem("isAdmin") === "1";
}
function showMessage(message, isSuccess = false) {
  const messageBox = document.getElementById("messageBox");
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.style.color = isSuccess ? "green" : "red";
    messageBox.style.display = "block";
  }
}
function switchToLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}
function registerUser(email, password) {
  auth
    .createUserWithEmailAndPassword(email, password)
    .then((result) => {
      currentUser = result.user;
      saveUserToDatabase(currentUser.uid, email);
      updateMemberCount(); // ✅ Tambahkan ini agar jumlah member langsung terupdate
      showMessage("Pendaftaran berhasil. Silakan login.", true);
      switchToLogin();
    })
    .catch((error) => {
      showMessage("Pendaftaran gagal: " + error.message);
    });
}

function saveUserToDatabase(uid, email) {
  const userData = {
    email,
    role: "member",
    registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
    photoUrl: "",
  };
  firestore.collection("users").doc(uid).set(userData);
}

function updateLastLogin(uid) {
  fetch("https://api.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => {
      const ip = data.ip || "Unknown";
      const userAgent = navigator.userAgent;
      const os = navigator.platform || "Unknown";
      const browser = detectBrowser(userAgent);
      const deviceInfo = `${os} | ${browser}`;
      const loginEntry = {
        time: new Date(), // gunakan waktu lokal (boleh juga pakai Date.now())
        ip: ip,
        device: deviceInfo,
      };

      firestore
        .collection("users")
        .doc(uid)
        .update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          ip: ip,
          device: deviceInfo,
          loginHistory: firebase.firestore.FieldValue.arrayUnion(loginEntry), // ✅ Valid sekarang
        });
      console.log(`IP: ${ip}, Device: ${deviceInfo}`);
      showMessage("Login berhasil. Tercatat.", true);
    })
    .catch((error) => {
      console.error("Gagal ambil IP:", error);
    });
}

function detectBrowser(userAgent) {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown Browser";
}
function checkAdminStatus(uid) {
  firestore
    .collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const role = doc.data().role;
        localStorage.setItem("isAdmin", role === "admin" ? "1" : "0");
        console.log("Role:", role);

        const adminFab = document.getElementById("adminFabBtn");
        if (adminFab) {
          adminFab.style.display = role === "admin" ? "flex" : "none";
        }
      } else {
        localStorage.setItem("isAdmin", "0");
      }
    })
    .catch((err) => {
      console.error("Gagal cek admin:", err);
      localStorage.setItem("isAdmin", "0");
    });
}

function renderAdminMemberList() {
  if (!isAdmin()) {
    document.getElementById("adminMemberList").innerHTML =
      "<p>Access denied. Admin privileges required.</p>";
    return;
  }

  const container = document.getElementById("adminMemberList");
  if (!container) return;

  firestore
    .collection("users")
    .get()
    .then((snapshot) => {
      let html = '<div class="member-list">';
      snapshot.forEach((doc) => {
        const user = doc.data();
        const uid = doc.id;
        const registeredDate =
          user.registeredAt?.toDate().toLocaleDateString() || "N/A";
        const lastLogin =
          user.lastLogin?.toDate().toLocaleDateString() || "Never";

        html += `
        <div class="member-card">
          <div class="member-info">
            <strong>Email:</strong> ${user.email}<br>
            <strong>Role:</strong> ${user.role || "member"}<br>
            <strong>Registered:</strong> ${registeredDate}<br>
            <strong>Last Login:</strong> ${lastLogin}
          </div>
          <div class="member-actions">
            <button class="btn" onclick="toggleUserRole('${uid}', '${
          user.role || "member"
        }')">Toggle Role</button>
            <button class="btn delete-btn" onclick="deleteMember('${uid}')">Delete</button>
          </div>
        </div>`;
      });
      html += "</div>";
      container.innerHTML = html;
    });
}

function toggleUserRole(uid, currentRole) {
  const newRole = currentRole === "admin" ? "member" : "admin";
  firestore
    .collection("users")
    .doc(uid)
    .update({ role: newRole })
    .then(() => {
      alert(`User role changed to ${newRole}`);
      renderAdminMemberList();
    });
}

function deleteMember(uid) {
  if (confirm("Hapus user ini?")) {
    firestore
      .collection("users")
      .doc(uid)
      .delete()
      .then(() => {
        alert("User deleted");
        renderAdminMemberList();
      });
  }
}
function updateMemberCount() {
  firestore
    .collection("users")
    .get()
    .then((snapshot) => {
      const count = snapshot.size;
      const memberCountEl = document.getElementById("memberCount");
      if (memberCountEl) {
        memberCountEl.textContent = `${count} Member`;
      }
    });
}

function listenMemberCount() {
  firestore.collection("users").onSnapshot((snapshot) => {
    const count = snapshot.size;
    const memberCountEl = document.getElementById("memberCount");
    if (memberCountEl) {
      memberCountEl.textContent = `${count} Member`;
    }
  });
}
// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  listenMemberCount();
});

function resetAllMembers() {
  if (!isAdmin()) {
    alert("Hanya Master Admin yang bisa reset semua member!");
    return;
  }
  if (!confirm("Yakin ingin menghapus SEMUA member?")) return;
  firestore
    .collection("users")
    .get()
    .then((snapshot) => {
      const batch = firestore.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      batch.commit().then(() => {
        alert("Semua member telah dihapus!");
        renderAdminMemberList();
        updateMemberCount();
      });
    });
}
// === Avatar Profile Tooltip ===
function initHeaderAvatar() {
  const avatarImg = document.getElementById('userAvatar');
  const tooltip = document.getElementById('userTooltip');

  if (!avatarImg || !tooltip) return;

  // Update otomatis saat user login
  auth.onAuthStateChanged(user => {
    if (user) {
      firestore.collection('users').doc(user.uid)
        .onSnapshot(doc => {
          if (doc.exists) {
            const data = doc.data();
            // Gunakan foto dari localStorage -> Firestore -> default
            avatarImg.src = localStorage.getItem('localProfilePhoto') || data.photoUrl || getDefaultAvatarSVG();
            tooltip.textContent = data.username || user.email;
          }
        });
    } else {
      // Jika belum login
      avatarImg.src = getDefaultAvatarSVG();
      tooltip.textContent = 'Guest';
    }
  });

  // Klik avatar buka modal profil
  avatarImg.addEventListener('click', () => {
    openMyProfileModal();
  });
}
document.addEventListener('DOMContentLoaded', () => {
  initHeaderAvatar();
});


function showProfileData() {
  if (!currentUser) return;
  firestore
    .collection("users")
    .doc(currentUser.uid)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const data = doc.data();
      const photoEl = document.getElementById("profilePhoto");
      if (photoEl)
        photoEl.src =
          localStorage.getItem("localProfilePhoto") ||
          data.photoUrl ||
          getDefaultAvatarSVG();
      document.getElementById("profileUsername").value = data.username || "";
      document.getElementById("profileEmail").value = data.email || "";
      document.getElementById("profilePhone").value = data.phone || "";
    });
}

function uploadProfilePhotoLocal() {
  const input = document.getElementById("profilePhotoInputLocal");
  if (!input || !input.files[0]) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const photoDataUrl = e.target.result;
    localStorage.setItem("localProfilePhoto", photoDataUrl);
    const img = document.getElementById("profilePhoto");
    if (img) img.src = photoDataUrl;
    showMessage("Foto profil disimpan di perangkat ini.", true);
  };

  reader.readAsDataURL(file);
}
function handleProfilePhotoUpload(callback) {
  const input = document.getElementById("profilePhotoInputLocal");
  if (!input || !input.files[0]) return callback("");
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const photoDataUrl = e.target.result;
    localStorage.setItem("localProfilePhoto", photoDataUrl);
    const img = document.getElementById("profilePhoto");
    if (img) img.src = photoDataUrl;
    if (window.currentUser && window.firebase) {
      const uid = currentUser.uid;
      const storageRef = firebase.storage().ref();
      const photoRef = storageRef.child(`profile_photos/${uid}.jpg`);
      photoRef
        .put(file)
        .then((snapshot) => {
          snapshot.ref.getDownloadURL().then((url) => {
            callback(url);
          });
        })
        .catch((err) => {
          console.error("Gagal upload foto ke Storage:", err);
          callback(photoDataUrl);
        });
    } else {
      callback(photoDataUrl);
    }
  };
  reader.readAsDataURL(file);
}
// === PROFILE FUNCTIONS ===
function saveProfile() {
  if (!currentUser) {
    alert("Anda belum login.");
    return;
  }
  const username = document.getElementById("profileUsername").value.trim();
  const email = document.getElementById("profileEmail").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  if (!username || !email) {
    alert("Nama dan Email wajib diisi!");
    return;
  }

  handleProfilePhotoUpload(function (photoUrl) {
    firebase
      .firestore()
      .collection("users")
      .doc(currentUser.uid)
      .set(
        {
          username,
          email,
          phone,
          photoUrl,
        },
        { merge: true }
      )
      .then(() => {
        alert("Profil berhasil disimpan!");
        document.getElementById("profilePhoto").src = photoUrl;
        showProfileData();
      })
      .catch((err) => {
        alert("Gagal menyimpan profil: " + err.message);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("profilePhotoInputLocal");
  if (input) {
    input.addEventListener("change", function () {
      handleProfilePhotoUpload(function (url) {});
    });
  }
  showProfileData();
});

function logoutUser() {
  auth.signOut().then(() => {
    currentUser = null;
    localStorage.setItem("isAdmin", "0"); // Reset status admin di localStorage
    showAuthModal(false);
    showPage("home");
  });
}
function openMyProfileModal() {
  showProfileData(); // Ambil data terbaru dari Firestore
  const modal = document.getElementById('myProfileModal');
  if (modal) modal.style.display = 'block';
}

function closeMyProfileModal() {
  document.getElementById("myProfileModal").style.display = "none";
}

function enableProfileEdit() {
  document.getElementById("profileUsername").removeAttribute("readonly");
  document.getElementById("profileEmail").removeAttribute("readonly");
  document.getElementById("profilePhone").removeAttribute("readonly");
}

function deleteProfile() {
  if (!currentUser) return;
  if (!confirm("Yakin ingin menghapus profil Anda?")) return;
  firestore
    .collection("users")
    .doc(currentUser.uid)
    .delete()
    .then(() => {
      alert("Profil dihapus!");
      logoutUser();
    });
}
function getDefaultAvatarSVG() {
  return (
    "data:image/svg+xml;base64," +
    btoa(`
    <svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
      <circle cx='50' cy='50' r='50' fill='#ccc'/>
      <text x='50%' y='55%' font-size='30' text-anchor='middle' fill='#fff' dy='.3em'>?</text>
    </svg>
  `)
  );
}

function renderUserPostCard() {
  const postCard = document.getElementById("userPostCard");
  if (!currentUser || !postCard) return;
  firestore
    .collection("posts")
    .where("uid", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        postCard.innerHTML = "<i>Belum ada postingan.</i>";
        return;
      }
      const post = snapshot.docs[0].data();
      postCard.innerHTML = `
                <div class="post-avatar"><img src="${
                  post.photoUrl || "default.jpg"
                }" alt="User"></div>
                <div class="post-content">${post.content || ""}</div>
                <div class="post-date">${
                  post.createdAt?.toDate().toLocaleString() || ""
                }</div>
            `;
    });
}

document.getElementById("homeTab").addEventListener("click", () => {
  showPage("page-home"); // pastikan fungsi showPage bekerja

  // render post user jika elemen tersedia
  if (document.getElementById("userPostCard")) {
    renderUserPostCard();
  }
});


function showAuthModal(showRegister = false) {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.style.display = "block";
  document.getElementById("tabLogin").style.background = showRegister
    ? "#eee"
    : "#2563eb";
  document.getElementById("tabLogin").style.color = showRegister
    ? "#2563eb"
    : "#fff";
  document.getElementById("tabRegister").style.background = showRegister
    ? "#2563eb"
    : "#eee";
  document.getElementById("tabRegister").style.color = showRegister
    ? "#fff"
    : "#2563eb";
  document.getElementById("loginForm").style.display = showRegister
    ? "none"
    : "block";
  document.getElementById("registerForm").style.display = showRegister
    ? "block"
    : "none";
  document.getElementById("authError").style.display = "none";
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    updateLastLogin(user.uid);
    firestore
      .collection("users")
      .doc(user.uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const role = doc.data().role || "member";
          localStorage.setItem("isAdmin", role === "admin" ? "1" : "0");
          localStorage.setItem("userRole", role);
          checkAdminFabVisibility(role);
        }
        closeModal("authModal");
        showPage("home");
        showProfileData();
      });
  } else {
    currentUser = null;
    localStorage.setItem("isAdmin", "0");
    showAuthModal(false);
  }
});

function showModal(type) {
  let content = "";

  if (type === "privacy") {
    content = `
      <h3>Kebijakan Privasi</h3>
      <p>Kami menghargai privasi Anda. Informasi pengguna hanya digunakan untuk keperluan internal aplikasi dan tidak akan dibagikan ke pihak ketiga.</p>
      <p>Pengguna dapat menggunakan aplikasi ini tanpa memberikan informasi pribadi, kecuali jika dibutuhkan untuk login, pembelian, atau fitur lain.</p>
    
       <h3>Privacy Policy</h3>
       <p>We respect your privacy. User information is used only for internal application purposes and will not be shared with third parties.</p>
       <p>Users can use this application without providing personal information, except when required for login, purchases, or other features.</p>
   `;
  } else if (type === "terms") {
    content = `
      <h3>Syarat & Ketentuan</h3>
      <p>Dengan menggunakan aplikasi ini, Anda setuju untuk mematuhi semua peraturan yang berlaku.</p>
      <p>Kami tidak bertanggung jawab atas kesalahan data pengguna, dan semua transaksi melalui aplikasi ini dianggap sah.</p>
    
        <h3>Terms & Conditions</h3>
        <p>By using this application, you agree to comply with all applicable regulations.</p>
        <p>We are not responsible for any errors in user data, and all transactions through this application are considered valid.</p>
    `;
  }
  document.getElementById("modal-content").innerHTML = content;
  document.getElementById("modal-legal").style.display = "flex";
}

function closeModalLegal() {
  document.getElementById("modal-legal").style.display = "none";
  }

window.addEventListener("click", function(event) {
  const modal = document.getElementById("modal");
  const box = document.querySelector(".modal-box");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

 function showPengurusModal(type) {
  const modal = document.getElementById("modal-pengurus");
  const content = document.getElementById("modal-pengurus-content");
  modal.style.display = "block";

  // Data direksi (semua dalam satu array)
  const direksiData = [
    { nama: "Ridhwan A.A", jabatan: "Owner / CEO", alamat: "Pekalongan - Jateng", foto: "ridhwan.jpg" },
    { nama: "SRI MURYANTO", jabatan: "KETUA UMUM (Organisasi)", alamat: "KEDIRI", foto: "sri.jpg" },
    { nama: "SYAMSU HIDAYAT", jabatan: "BENDAHARA UMUM", alamat: "SAMPANG - MADURA", foto: "syamsu.jpg" },
    { nama: "SAPRIDA, S.Sos.I", jabatan: "SEKRETARIS UMUM", alamat: "LANGSA - ACEH", foto: "saprida.jpg" },
    { nama: "ASRIN IRFHAN", jabatan: "Direktur HRD", alamat: "Brebes - Jateng", foto: "asrin.jpg" },
    { nama: "DEDI RAHMAT", jabatan: "Direktur PR", alamat: "Bireuen - ACEH", foto: "dedi.jpg" },
    { nama: "MUHAMAD AFRIZAL", jabatan: "CMO (Chief Marketing Officer)", alamat: "Sumatra Selatan", foto: "afrizal.jpg" },
    { nama: "(Kosong)", jabatan: "CTO (Chief Technology Officer)", alamat: "(Belum ditentukan)", foto: "default.jpg" },
    { nama: "(Kosong)", jabatan: "COO (Chief Operating Officer)", alamat: "(Belum ditentukan)", foto: "default.jpg" }
  ];

  // Fungsi buat 1 kartu direksi
  function generateDireksiCard(data) {
    const fotoURL = `https://raw.githubusercontent.com/Evanadua/MyProject_CPiN/main/assets/images/direksi/${data.foto}`;
    return `
      <div class="card">
        <img src="${fotoURL}" alt="${data.nama}" 
             style="border-radius:50%; width:100px; height:100px; object-fit:cover; margin-bottom:10px;">
        <h4>${data.nama}</h4>
        <p><strong>${data.jabatan}</strong></p>
        <p style="font-size: 0.85em; color: #555;">${data.alamat}</p>
      </div>
    `;
  }

  if (type === 'company') {
  content.innerHTML = `
    <div class="company-profile">
      <h2>Company Profile: <span>Conspindo</span></h2>
      <p><strong>Nama Perusahaan:</strong> Conspindo</p>
      <p><strong>Tagline:</strong> Connecting People with Innovation and Business.</p>
      <p><strong>Tahun Berdiri:</strong> 2023</p>
      <p><strong>Versi Dokumen:</strong> Juli 2025</p>

      <h3>Kata Pengantar</h3>
      <p>Dengan semangat kolaborasi dan inovasi, Conspindo hadir untuk menjadi penghubung antar individu...</p>

      <h3>Tentang Kami</h3>
      <p>Conspindo adalah sebuah nama yang Legal dan Teregistrasi. (on Process).<br>
      Singkatan dari Consortium Pi Network (Pioneers) Indonesia...</p>

      <h3>Visi</h3>
      <p>Menjadi bermanfaat untuk masyarakat luas...</p>

      <h3>Misi</h3>
      <ul>
        <li>Memberdayakan komunitas global melalui teknologi.</li>
        <li>Membangun platform yang aman dan transparan.</li>
        <li>Menyediakan sarana komunikasi, edukasi, dan perdagangan digital.</li>
        <li>Sebagai jembatan bagi seluruh Pioneers dunia...</li>
      </ul>

      <hr>

      <h2>Company Profile: <span>Conspindo</span></h2>
      <p><strong>Company Name:</strong> Conspindo</p>
      <p><strong>Tagline:</strong> Connecting People with Innovation and Business.</p>
      <p><strong>Year Established:</strong> 2023</p>
      <p><strong>Document Version:</strong> July 2025</p>

      <h3>Foreword</h3>
      <p>With a spirit of collaboration and innovation, Conspindo exists to be a bridge...</p>

      <h3>About Us</h3>
      <p>Conspindo is a legal and registered name (in process)...</p>

      <h3>Vision</h3>
      <p>To be beneficial to the wider community...</p>

      <h3>Mission</h3>
      <ul>
        <li>Empowering the global community through technology.</li>
        <li>Building a secure and transparent platform.</li>
        <li>Providing communication, education, and digital commerce.</li>
        <li>Serving as a bridge for all Pioneers worldwide...</li>
      </ul>
    </div>
  `;
}

 else if (type === 'direksi') {
    const cardsHTML = direksiData.map(generateDireksiCard).join("");
    content.innerHTML = `
      <h3>DIREKSI / HEAD OFFICE</h3>
      <div class="struktur-container">
        ${cardsHTML}
      </div>
    `;
  }

  else if (type === 'harian') {
    content.innerHTML = `
      <h3>STRUKTUR PENGURUS HARIAN</h3>
      <img src="assets/images/struktur-pengurus-harian.png" alt="Struktur Pengurus Harian" style="width:100%; max-width:800px; border-radius:10px; margin-top:15px;" />
    `;
  }
}
function closePengurusModal() {
  document.getElementById("modal-pengurus").style.display = "none";
}


// Global Variables
let currentGroupId = null;
let currentProfile = null;
let blogPage = 1;
const BLOGS_PER_PAGE = 12;

// Start header slider

// Load saved images

// Header Slider Functions
function startHeaderSlider() {
  const slides = document.querySelectorAll("#header-slider .slide");
  let index = 0;
  if (slides.length === 0) return;

  slides[index].classList.add("active");

  setInterval(() => {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
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
       <div class="page" id="page-home" style="display: none;">
  <h2>Selamat Datang</h2>
  <p style="font-size:1.05em; color:#333; margin-bottom:8px;">
    Welcome to ConsPIndo App. Empowering Pi Network Community Connections through Knowledge and Innovation.<br>
    You can join here to get much benefits together with others and Us.
  </p>

  <!-- Struktur Pengurus -->
  <div class="dropdown" style="margin-top: 30px;">
    <button class="dropdown-button">About Us ▾</button>
    <div class="dropdown-content">
       <a href="#" onclick="showPengurusModal('company')">Perusahaan</a>
       <a href="#" onclick="showPengurusModal('direksi')">Direksi</a>
       <a href="#" onclick="showPengurusModal('harian')">Pengurus Harian</a>
    </div>
  </div>

  <!-- Modal Pengurus (khusus Home) -->
<div class="modal-overlay" id="modal-pengurus">
  <div class="modal-box">
    <span class="modal-close" onclick="closePengurusModal()">&times;</span>
    <div id="modal-pengurus-content"></div>
  </div>
</div>
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
  
  <div id="serviceList"></div>
  <div id="serviceDetailContent"></div>
  
  <h2>Daftar Layanan</h2>

  <!-- Admin Login/Logout -->
  <div id="adminLoginBox">
  <button class="btn" onclick="toggleAdminLogin()">Login Admin</button>
  <div id="adminLoginForm" style="display:none; margin-top: 10px;">
    <input type="password" id="adminPasswordInput" placeholder="Masukkan Password Admin">
    <button class="btn" onclick="submitAdminLogin()">Masuk</button>
  </div>
</div>

  </div>
  <div id="adminLogoutBox" style="display:none;">
    <button class="btn" onclick="logoutServiceAdmin()">Logout Admin</button>
  </div>

  <!-- Search & Add -->
  <div id="serviceSearch">
    <input type="text" id="serviceSearchInput" placeholder="Cari layanan..." oninput="filterServices()">
    <button class="btn" onclick="filterServices()">Search</button>
    <button id="addServiceBtn" class="btn" onclick="showAddServiceForm()" style="display:none;">Tambah Layanan</button>
  </div>

  <!-- Daftar -->
  <div id="serviceList"></div>

  <!-- Form Tambah -->
  <div id="addServiceForm" style="display:none;">
    <h3>Tambah Layanan Baru</h3>
    <input type="text" id="serviceTitle" placeholder="Judul Layanan"><br>
    <textarea id="serviceDesc" placeholder="Deskripsi Layanan"></textarea><br>
    <input type="text" id="serviceIcon" placeholder="Icon (misal: 🔧)"><br>
    <button class="btn" onclick="saveService()">Simpan Layanan</button>
    <button class="btn delete-btn" onclick="hideAddServiceForm()">Batal</button>
  </div>

  <!-- Detail -->
  <div id="serviceDetailContent" style="margin-top:20px;"></div>
  <button class="btn" onclick="renderServices()">Kembali ke Daftar Layanan</button>

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
                <button class="btn" onclick="hideArticleForm()">Batal</button>
            </div>
        </div>
    `,
       
  profile: `
        <h2>My Profile</h2>
        <div style="text-align:center;margin-bottom:12px;">
            <img id="profilePhoto" src="" alt="Foto Profil">
            <br>
           <input type="file" id="profilePhotoInputLocal">

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
            <button class="btn" onclick="enableProfileEdit()">Edit Profil</button>
<button class="btn delete-btn" onclick="deleteProfile()">Hapus Profil</button>
        </div>
    `,

    legal: `
    <div class="page" id="page-legal" style="display: none;">
  <h2>Informasi Legal</h2>

  <!-- Dropdown Kebijakan -->
  <div class="dropdown" style="margin-top: 20px;">
    <button class="dropdown-button">Kebijakan ▾</button>
    <div class="dropdown-content">
      <a href="#" onclick="showModal('privacy')">Kebijakan Privasi</a>
      <a href="#" onclick="showModal('terms')">Syarat & Ketentuan</a>
    </div>
  </div>

  <div class="modal-overlay" id="modal-legal">
    <div class="modal-box">
      <span class="modal-close" onclick="closeModalLegal()">&times;</span>
      <div id="modal-content"></div>
    </div>
  </div>
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
        <div style="margin-bottom:10px;">
  <input type="text" id="filterLocation" placeholder="Cari Lokasi Produk..." style="padding:6px; width:180px;">
  <button class="btn" onclick="filterShopByLocation()">Filter</button>
  <button class="btn" onclick="resetShopFilter()">Reset</button>
</div>
        <div id="shopProducts"></div>
        <hr>
        <button onclick="showCart()">Lihat Keranjang (<span id="cartCount">0</span>)</button>
        <div id="cartModalContent" style="margin-top:10px;"></div>
    `,
};

// --- SERVICES SECTION FIREBASE ---
// === ADMIN UI ===
// Cek Admin
    function isServiceAdmin() {
      return localStorage.getItem("isServiceAdmin") === "true";
    }

    function updateServiceAdminUI() {
      document.getElementById("adminLoginBox").style.display = isServiceAdmin() ? "none" : "block";
      document.getElementById("adminLogoutBox").style.display = isServiceAdmin() ? "block" : "none";
      document.getElementById("addServiceBtn").style.display = isServiceAdmin() ? "inline-block" : "none";
      const btn = document.getElementById("addServiceBtn");
if (btn) {
  btn.style.display = isServiceAdmin() ? "inline-block" : "none";
} else {
  console.warn("Element #addServiceBtn tidak ditemukan.");
}
      const searchInput = document.getElementById("serviceSearchInput");
      if (searchInput) {
        searchInput.placeholder = isServiceAdmin() ? "Cari layanan..." : "Hanya admin yang bisa mencari layanan";
        searchInput.disabled = !isServiceAdmin();
      }
      const serviceList = document.getElementById("serviceList");
      if (serviceList) {
        serviceList.innerHTML = isServiceAdmin() ? "" : "<p>Hanya admin yang bisa melihat layanan.</p>";
      }
      const serviceDetailContent = document.getElementById("serviceDetailContent");
      if (serviceDetailContent) {
        serviceDetailContent.innerHTML = isServiceAdmin() ? "" : "<p>Hanya admin yang bisa melihat detail layanan.</p>";
      }
    }

    function loginAsServiceAdmin() {
      localStorage.setItem("isServiceAdmin", "true");
      updateServiceAdminUI();
      renderServices();
    }

    function toggleAdminLogin() {
  const form = document.getElementById("adminLoginForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
}

function submitAdminLogin() {
  const password = document.getElementById("adminPasswordInput").value;
  const correctPassword = "Adua#22adua!"; // bisa Anda ganti sesuai kebutuhan

  if (password === correctPassword) {
    localStorage.setItem("isServiceAdmin", "true");
    updateServiceAdminUI();
    renderServices();
    alert("Login berhasil sebagai Admin");
  } else {
    alert("Password salah!");
  }

  document.getElementById("adminPasswordInput").value = "";
  document.getElementById("adminLoginForm").style.display = "none";
}


    function logoutServiceAdmin() {
      localStorage.removeItem("isServiceAdmin");
      updateServiceAdminUI();
      renderServices();
    }

    // Render Services
    function renderServices() {
      const container = document.getElementById("serviceList");
      const detail = document.getElementById("serviceDetailContent");
      container.innerHTML = "<p>Memuat layanan...</p>";
      detail.innerHTML = "";

      firestore.collection("services").orderBy("createdAt", "desc").get()
        .then(snapshot => {
          container.innerHTML = "";
          snapshot.forEach(doc => {
            const svc = doc.data();
            const id = doc.id;
            const div = document.createElement("div");
            div.className = "service-card";
            div.innerHTML = `
              <strong>${svc.icon || "🔧"} ${svc.title}</strong>
              <p>${svc.desc}</p>
              <button class="btn" onclick="showServiceDetail('${id}')">Lihat Detail</button>
            `;
            container.appendChild(div);
          });
        })
        .catch(error => {
          console.error("Gagal memuat layanan:", error);
          container.innerHTML = "<p>Gagal memuat layanan.</p>";
        });
    }

    function saveService() {
      const title = document.getElementById("serviceTitle").value.trim();
      const desc = document.getElementById("serviceDesc").value.trim();
      const icon = document.getElementById("serviceIcon").value.trim();

      if (!title || !desc || !icon) {
        alert("Semua kolom wajib diisi!");
        return;
      }

      firestore.collection("services").add({
        title,
        desc,
        icon,
        createdAt: new Date(),
      }).then(() => {
        alert("Layanan berhasil disimpan");
        hideAddServiceForm();
        renderServices();
      }).catch(error => {
        alert("Gagal menyimpan layanan.");
        console.error(error);
      });
    }

    function showAddServiceForm() {
      document.getElementById("addServiceForm").style.display = "block";
      document.getElementById("serviceTitle").value = "";
      document.getElementById("serviceDesc").value = "";
      document.getElementById("serviceIcon").value = "";
    }

    function hideAddServiceForm() {
      document.getElementById("addServiceForm").style.display = "none";
    }

    function showServiceDetail(id) {
  firestore.collection("services").doc(id).get()
    .then(doc => {
      if (!doc.exists) {
        alert("Layanan tidak ditemukan");
        return;
      }

      const data = doc.data();
      const isAdmin = isServiceAdmin();

      let html = `
        <h3>${data.icon || "🔧"} ${data.title}</h3>
        <p>${data.desc}</p>
        <button class="btn" onclick="alert('Fitur pemesanan segera tersedia')">Pesan Sekarang</button>
      `;

      if (isAdmin) {
        html += `
          <div id="editForm" style="margin-top:20px; display:none;">
            <input type="text" id="editServiceTitle" value="${data.title}" placeholder="Judul Layanan"><br>
            <textarea id="editServiceDesc" placeholder="Deskripsi">${data.desc}</textarea><br>
            <input type="text" id="editServiceIcon" value="${data.icon}" placeholder="Icon (misal: 🔧)"><br>
            <button class="btn" onclick="submitEditService('${id}')">Simpan</button>
            <button class="btn delete-btn" onclick="deleteService('${id}')">Hapus</button>
            <button class="btn" onclick="cancelEdit()">Batal</button>
          </div>

          <button class="btn" onclick="document.getElementById('editForm').style.display='block'">Edit</button>
        `;
      }

      
      document.getElementById("serviceDetailContent").innerHTML = html;
      document.getElementById("serviceList").innerHTML = "";
    });
}

function cancelEdit() {
  document.getElementById("editForm").style.display = "none";
}

function submitEditService(id) {
  const newTitle = document.getElementById("editServiceTitle").value.trim();
  const newDesc = document.getElementById("editServiceDesc").value.trim();
  const newIcon = document.getElementById("editServiceIcon").value.trim();

  if (!newTitle || !newDesc || !newIcon) {
    alert("Semua kolom harus diisi!");
    return;
  }

  firestore.collection("services").doc(id).update({
    title: newTitle,
    desc: newDesc,
    icon: newIcon
  }).then(() => {
    alert("Layanan berhasil diperbarui.");
    renderServices();
  }).catch(error => {
    console.error("Gagal update:", error);
    alert("Gagal memperbarui layanan.");
  });
}

function deleteService(id) {
  if (!confirm("Yakin ingin menghapus layanan ini?")) return;

  firestore.collection("services").doc(id).delete()
    .then(() => {
      alert("Layanan berhasil dihapus.");
      renderServices();
    })
    .catch(error => {
      console.error("Gagal menghapus:", error);
      alert("Gagal menghapus layanan.");
    });
}

    function updateService(id) {
      const newDesc = document.getElementById("editDesc").value.trim();
      const newIcon = document.getElementById("editIcon").value.trim();

      firestore.collection("services").doc(id).update({
        desc: newDesc,
        icon: newIcon,
      }).then(() => {
        alert("Layanan diperbarui");
        renderServices();
      });
    }

    function deleteService(id) {
      if (confirm("Yakin hapus layanan ini?")) {
        firestore.collection("services").doc(id).delete().then(() => {
          alert("Layanan dihapus");
          renderServices();
        });
      }
    }

    function filterServices() {
      const keyword = document.getElementById("serviceSearchInput").value.toLowerCase();
      const cards = document.querySelectorAll("#serviceList .service-card");
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(keyword) ? "block" : "none";
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      updateServiceAdminUI();
      renderServices();
    });

// === INITIALIZE ===



// Function to initialize the schedule calendar
// ✅ Function to initialize the schedule calendar
function initScheduleCalendar() {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    console.warn("Elemen #calendar tidak ditemukan!");
    return;
  }

  calendarEl.innerHTML = ""; // Clear kontainer sebelum render ulang

  firestore
    .collection("events")
    .get()
    .then((snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          start: data.start.toDate(),
          end: data.end ? data.end.toDate() : null,
          description: data.description || "",
        };
      });

      // ✅ Inisialisasi Kalender setelah data didapat
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        events: events,
        dateClick: function (info) {
          openEventAddModal({
            start: info.dateStr,
          });
        },
        eventClick: function (info) {
          openEventEditModal({
            id: info.event.id,
            title: info.event.title,
            titleInput: info.event.title,
            start: info.event.start.toISOString().slice(0, 16),
            end: info.event.end
              ? info.event.end.toISOString().slice(0, 16)
              : "",
            deleteBtn: info.event.extendedProps?.deleteBtn || "",
            description: info.event.extendedProps?.description || "",
          });
        },
      });

      calendar.render(); // ✅ Jangan lupa render!
    })
    .catch((error) => {
      console.error("Gagal mengambil data events:", error);
    });
}

// ✅ Buka Modal Edit Event
function openEventEditModal(eventData = {}) {
  if (!eventData || typeof eventData !== "object") {
    console.warn("Data event tidak valid!");
    return;
  }

  const modal = document.getElementById("eventEditModal");
  if (!modal) return;

  const title = document.getElementById("modalTitleEdit");
  const idInput = document.getElementById("eventEditId");
  const titleInput = document.getElementById("eventEditTitle");
  const startInput = document.getElementById("eventEditStart");
  const endInput = document.getElementById("eventEditEnd");
  const descInput = document.getElementById("eventEditDesc");
  const deleteBtn = document.getElementById("eventEditDeleteBtn");

  if (!title || !idInput || !titleInput || !startInput || !descInput) {
    console.warn("Input dalam #eventEditModal tidak lengkap!");
    return;
  }

  modal.style.display = "flex";
  title.innerText = "Edit Jadwal";
  idInput.value = eventData.id || "";
  titleInput.value = eventData.title || "";
  startInput.value = eventData.start || "";
  endInput.value = eventData.end || "";
  descInput.value = eventData.description || "";

  if (eventData.end) {
    const endDate = new Date(eventData.end);
    const now = new Date();
    const isPast = endDate < now;

    deleteBtn.style.display = isPast ? "inline-block" : "none";
    deleteBtn.disabled = !isPast;
  } else {
    deleteBtn.style.display = "none";
  }
}

function saveNewEvent() {
  const id = document.getElementById("eventAddId").value;
  const title = document.getElementById("eventAddTitle").value;
  const start = document.getElementById("eventAddStart").value;
  const end = document.getElementById("eventAddEnd").value;
  const desc = document.getElementById("eventAddDesc").value;

  if (!title || !start) {
    alert("Judul dan tanggal mulai wajib diisi!");
    return;
  }

  const eventData = {
    title,
    start: firebase.firestore.Timestamp.fromDate(new Date(start)),
    end: end ? firebase.firestore.Timestamp.fromDate(new Date(end)) : null,
    description,
  };

  firestore
    .collection("events")
    .add(eventData)
    .then(() => {
      closeModal("eventAddModal");
      initScheduleCalendar(); // refresh kalender
      alert("Jadwal berhasil disimpan!");
    })
    .catch((err) => {
      console.error("Gagal menyimpan event:", err);
      alert("Terjadi kesalahan saat menyimpan event.");
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
  const inviteCode = document.getElementById("inviteCode").innerText;
  navigator.clipboard.writeText(inviteCode).then(() => {
    alert("Kode undangan telah disalin: " + inviteCode);
  });
}

// ✅ FIRESTORE: Member List Modal
// =========================

function showMemberListModal() {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  firestore
    .collection("users")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        tbody.innerHTML = '<tr><td colspan="3">Belum ada member</td></tr>';
        return;
      }

      let html = "";
      snapshot.forEach((doc) => {
        const user = doc.data();
        const uid = doc.id;
        html += `
        <tr>
          <td>${user.email || "-"}</td>
          <td>${user.role || "member"}</td>
          <td>
            <button onclick="toggleUserRole('${uid}', '${
          user.role || "member"
        }')">Ubah Role</button>
            <button onclick="deleteMember('${uid}')">Hapus</button>
          </td>
        </tr>
      `;
      });
      tbody.innerHTML = html;
      openModal("memberListModal");
    })
    .catch((err) => {
      tbody.innerHTML = `<tr><td colspan="3" style="color:red;">${err.message}</td></tr>`;
    });
}

function refreshMemberList() {
  showMemberListModal();
}

function toggleUserRole(uid, currentRole) {
  const newRole = currentRole === "admin" ? "member" : "admin";
  firestore
    .collection("users")
    .doc(uid)
    .update({ role: newRole })
    .then(() => {
      alert("Role diubah menjadi " + newRole);
      showMemberListModal();
    });
}

function deleteMember(uid) {
  if (!confirm("Yakin ingin hapus member ini?")) return;
  firestore
    .collection("users")
    .doc(uid)
    .delete()
    .then(() => {
      alert("Member dihapus");
      showMemberListModal();
    });
}

// =========================
// ✅ END: Member List Modal
// =========================

// Page Management
function showPage(page) {
  // 1. Kosongkan pageContent, lalu isi dari pages[]
  const contentArea = document.getElementById("pageContent");
  contentArea.innerHTML = pages[page] || "<p>Halaman tidak ditemukan.</p>";

  // 2. Sembunyikan semua .page (DOM element yang ada di index.html, termasuk modals jika perlu)
  const pageSections = document.querySelectorAll(".page");
  pageSections.forEach(p => p.style.display = "none");

  // 3. Tampilkan elemen page-${page} jika ada di dalam HTML baru dimuat
  // 3. Cari elemen page yang berada di dalam #pageContent
const currentPageEl = contentArea.querySelector(`#page-${page}`);
if (currentPageEl) {
  currentPageEl.style.display = "block";
} else {
  console.warn(`Halaman '${page}' tidak ditemukan di dalam pageContent`);
}


  // 4. Inisialisasi khusus berdasarkan halaman
  if (page === "group") {
    setTimeout(() => {
      renderGroupList();
      showAdminGroupBtns();
    }, 50);
  }

  if (page === "blog") {
    setTimeout(renderArticles, 100);
  }

  if (page === "shop") {
    setTimeout(() => {
      renderShopProducts();
      showAdminShopBtns();
    }, 50);
  }

  if (page === "profile") {
    showProfileData();
  }

  if (page === "schedule") {
    setTimeout(() => {
      const calendarEl = document.getElementById("calendar");
      const eventForm = document.getElementById("eventForm");
      if (calendarEl && eventForm) {
        initScheduleCalendar();
      }
    }, 100);
  }

  // 5. Pasang kembali handler interaktif (dropdown, modal, dsb)
  setTimeout(setupEventHandlers, 100);
}
function setupEventHandlers() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector(".dropdown-button");
    const content = dropdown.querySelector(".dropdown-content");

    // Hindari duplikasi klik
    button.onclick = () => {
      content.style.display = content.style.display === "block" ? "none" : "block";
    };
  });

  // Pastikan hanya ada satu listener global untuk klik luar dropdown
  if (!window._dropdownListenerAttached) {
    document.addEventListener("click", (e) => {
      document.querySelectorAll(".dropdown-content").forEach(content => {
        if (!content.parentElement.contains(e.target)) {
          content.style.display = "none";
        }
      });
    });
    window._dropdownListenerAttached = true;
  }
}



document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("tabLogin").onclick = () => showAuthPage(false);
  document.getElementById("tabRegister").onclick = () => showAuthPage(true);
});
document.getElementById("loginBtn").onclick = () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  loginUser(email, password);
};

document.getElementById("registerBtn").onclick = () => {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regPassword2").value;
  if (password !== confirm) {
    showMessage("Password tidak sama");
    return;
  }
  registerUser(email, password);
};

const eventForm = document.getElementById("eventForm");
if (eventForm) {
  eventForm.onsubmit = function (e) {
    e.preventDefault();
    const id = document.getElementById("eventId").value;
    const title = document.getElementById("eventTitle").value;
    const start = document.getElementById("eventStart").value;
    const end = document.getElementById("eventEnd").value;
    const description = document.getElementById("eventDesc").value;

    const deleteBtn = document.getElementById("deleteBtn");
    if (deleteBtn) {
      deleteBtn.onclick = function () {
        const id = document.getElementById("eventId").value;
        if (id && confirm("Yakin ingin menghapus jadwal ini?")) {
          firestore
            .collection("events")
            .doc(id)
            .delete()
            .then(() => {
              closeModal("eventModal");
              initScheduleCalendar(); // 🔁 Refresh kalender
            });
        }
      };
    }
    if (!title || !start) {
      alert("Judul dan tanggal mulai harus diisi!");
      return;
    }
    const eventData = {
      title,
      start: firebase.firestore.Timestamp.fromDate(new Date(start)),
      end: end ? firebase.firestore.Timestamp.fromDate(new Date(end)) : null,
      description,
    };

    if (id) {
      // Update event
      firestore
        .collection("events")
        .doc(id)
        .update(eventData)
        .then(() => {
          closeModal("eventModal");
          initScheduleCalendar();
        });
    } else {
      // Add new event
      firestore
        .collection("events")
        .add(eventData)
        .then(() => {
          closeModal("eventModal");
          initScheduleCalendar();
        });
    }
  };
}

// Modal Functions

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error('Modal dengan id "' + id + '" tidak ditemukan!');
    return;
  }
  el.style.display = "flex"; // lebih baik daripada 'block' untuk modal fleksibel
  el.classList.add("active-modal"); // opsional jika kamu pakai efek CSS
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  el.classList.remove("active-modal");
}

// Copy Functions
function copyInviteCode() {
  const codeEl = document.getElementById("inviteCode");
  const code = codeEl.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function () {
      alert("Invite code copied!");
    });
  } else {
    const temp = document.createElement("input");
    document.body.appendChild(temp);
    temp.value = code;
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    alert("Invite code copied!");
  }
}

function copyGroupInviteCode() {
  let codeEl =
    document.getElementById("groupInviteCodeModal") ||
    document.getElementById("groupInviteCode");
  if (!codeEl) {
    alert("Kode invite tidak ditemukan!");
    return;
  }
  const code = codeEl.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function () {
      alert("Invite code copied!");
    });
  } else {
    const temp = document.createElement("input");
    document.body.appendChild(temp);
    temp.value = code;
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
    alert("Invite code copied!");
  }
}

// Tab Management
function setActiveTab(tabId) {
  document
    .querySelectorAll(".tab-menu button")
    .forEach((btn) => btn.classList.remove("active"));
  if (tabId) {
    document.getElementById(tabId).classList.add("active");
  }
}

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", function () {
  startHeaderSlider();

  // Load saved images
  const savedLogo = localStorage.getItem("customLogo");
  if (savedLogo) {
    const logoImg = document.getElementById("logoImg");
    if (logoImg) {
      logoImg.src = savedLogo;
    }
  }

  const bg = localStorage.getItem("headerBg");
  if (bg) document.getElementById("headerBg").src = bg;

  const saveEventBtn = document.getElementById("saveEventBtn");
  if (saveEventBtn) {
    saveEventBtn.onclick = function () {
      // Ambil data dari input
      const title = document.getElementById("eventTitle").value;
      const date = document.getElementById("eventDate").value;
      // Simpan ke Firestore atau array, lalu refresh kalender
      // ...implementasi simpan event...
    };
  }
});

function setupEventHandlers() {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      loginUser(email, password);
    };
  }

  const registerBtn = document.getElementById("registerBtn");
  if (registerBtn) {
    registerBtn.onclick = () => {
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const confirm = document.getElementById("regPassword2").value;
      if (password !== confirm) {
        showMessage("Password tidak sama");
        return;
      }
      registerUser(email, password);
      updateMemberCount();

      const tabRegister = document.getElementById("tabRegister");
      if (tabRegister) {
        tabRegister.onclick = switchToRegister;
      }
    };
  }
}

function openEventAddModal(eventData = {}) {
  const modal = document.getElementById("eventAddModal");
  if (!modal) return;

  document.getElementById("eventAddId").value = "";
  document.getElementById("eventAddTitle").value = "";
  document.getElementById("eventAddStart").value = eventData.start || "";
  document.getElementById("eventAddEnd").value = "";
  document.getElementById("eventAddDesc").value = "";
  modal.style.display = "flex";
}

function openEventEditModal(eventData = {}) {
  const modal = document.getElementById("eventEditModal");
  if (!modal) return;

  const title = document.getElementById("modalTitleEdit");
  const idInput = document.getElementById("eventEditId");
  const titleInput = document.getElementById("eventEditTitle");
  const startInput = document.getElementById("eventEditStart");
  const endInput = document.getElementById("eventEditEnd");
  const descInput = document.getElementById("eventEditDesc");
  const deleteBtn = document.getElementById("eventEditDeleteBtn");

  if (
    !title ||
    !idInput ||
    !titleInput ||
    !startInput ||
    !endInput ||
    !descInput ||
    !deleteBtn
  ) {
    console.warn("Input dalam #eventEditModal tidak lengkap!");
    return;
  }

  modal.style.display = "flex";
  title.innerText = "Edit Jadwal";
  idInput.value = eventData.id || "";
  titleInput.value = eventData.title || "";
  startInput.value = eventData.start || "";
  endInput.value = eventData.end || "";
  descInput.value = eventData.description || "";

  if (eventData.end) {
    const endDate = new Date(eventData.end);
    const now = new Date();
    const isPast = endDate < now;
    deleteBtn.style.display = isPast ? "inline-block" : "none";
    deleteBtn.disabled = !isPast;
  } else {
    deleteBtn.style.display = "none";
  }
}

function saveNewEvent() {
  const id = document.getElementById("eventAddId").value;
  const title = document.getElementById("eventAddTitle").value;
  const start = document.getElementById("eventAddStart").value;
  const end = document.getElementById("eventAddEnd").value;
  const desc = document.getElementById("eventAddDesc").value;

  if (!title || !start) {
    alert("Judul dan tanggal mulai wajib diisi!");
    return;
  }

  const eventData = {
    title,
    start: firebase.firestore.Timestamp.fromDate(new Date(start)),
    end: end ? firebase.firestore.Timestamp.fromDate(new Date(end)) : null,
    description: desc,
  };

  firestore
    .collection("events")
    .add(eventData)
    .then(() => {
      closeModal("eventAddModal");
      initScheduleCalendar();
    });
}

function saveEventEdit() {
  const id = document.getElementById("eventEditId").value;
  const title = document.getElementById("eventEditTitle").value;
  const start = document.getElementById("eventEditStart").value;
  const end = document.getElementById("eventEditEnd").value;
  const desc = document.getElementById("eventEditDesc").value;

  if (!id || !title || !start) {
    alert("ID, Judul, dan Tanggal mulai wajib diisi!");
    return;
  }

  const eventData = {
    title,
    start: firebase.firestore.Timestamp.fromDate(new Date(start)),
    end: end ? firebase.firestore.Timestamp.fromDate(new Date(end)) : null,
    description: desc,
  };

  firestore
    .collection("events")
    .doc(id)
    .update(eventData)
    .then(() => {
      closeModal("eventEditModal");
      initScheduleCalendar();
    });
}
// Setup event handlers
setupEventHandlers();

// Let Firebase Auth State Observer handle authentication
// The auth state observer will show the appropriate content
function setupEventHandlers() {
  const tabIds = [
    { id: "homeTab", page: "home" },
    { id: "scheduleTab", page: "schedule" },
    { id: "servicesTab", page: "services" },
    { id: "blogTab", page: "blog" },
  ];

  tabIds.forEach((tab) => {
    const el = document.getElementById(tab.id);
    if (el) {
      el.onclick = () => {
        setActiveTab(tab.id);
        showPage(tab.page);
      };
    }
  });

  // Bottom nav
  const legalMenu = document.getElementById("legalMenu");
  if (legalMenu) {
  legalMenu.onclick = (e) => {
    e.preventDefault();
    setActiveTab("legalMenu");
    showPage("legal");
  };
}

  const myProfileMenu = document.getElementById("myProfileMenu");
  if (myProfileMenu) {
    myProfileMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab("profileMenuBtn");
      showPage("profile");
    };
  }

  const groupMenu = document.getElementById("groupMenu");
  if (groupMenu) {
    groupMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab("groupMenu");
      showPage("group");
    };
  }

  const shopMenu = document.getElementById("shopMenu");
  if (shopMenu) {
    shopMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab("shopMenu");

      setTimeout(() => {
        showPage("shop"); // ✅ Panggil dengan penundaan agar isAdmin() sudah siap
      }, 100);
    };
  }

  const servicesMenu = document.getElementById("servicesMenu");
  if (servicesMenu) {
    servicesMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab("servicesMenu");
      showPage("Services");
    };
  }

  // Admin button handler
  const adminMenuBtn = document.getElementById("adminMenuBtn");
  if (adminMenuBtn) {
    adminMenuBtn.onclick = function () {
      if (!isAdmin()) {
        document.getElementById("adminMenuBtn").style.display = "none";
      }
      if (!isAdmin()) {
        alert("You do not have permission to access this page.");
        return;
      }
      setActiveTab("adminMenuBtn");
      showPage("admin");
      setTimeout(renderAdminMemberList, 100); // ✅ tambahkan delay agar DOM siap
    };
  }
}

// Additional placeholder functions (to be implemented)
function showAuthPage(showRegister = false) {
  showAuthModal(showRegister);
}

function showChangePasswordForm() {
  openModal("changePwdModal");
}

function renderAdminMemberList() {
  if (!isAdmin()) {
    document.getElementById("adminMemberList").innerHTML =
      "<p>Access denied. Admin privileges required.</p>";
    return;
  }
  firestore
    .collection("users")
    .get()
    .then((snapshot) => {
      let html = '<div class="member-list">';
      snapshot.forEach((doc) => {
        const user = doc.data();
        const uid = doc.id;
        html += `
                <div class="member-card">
                    <div class="member-info">
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Role:</strong> ${user.role || "member"}<br>
                        <strong>Registered:</strong> ${
                          user.registeredAt?.toDate().toLocaleDateString() ||
                          "N/A"
                        }<br>
                        <strong>Last Login:</strong> ${
                          user.lastLogin?.toDate().toLocaleDateString() ||
                          "Never"
                        }
                    </div>
                    <div class="member-actions">
                        <button class="btn" onclick="toggleUserRole('${uid}', '${
          user.role || "member"
        }')">Toggle Role</button>
                        <button class="btn delete-btn" onclick="deleteMember('${uid}')">Delete</button>
                    </div>
                </div>`;
      });
      html += "</div>";
      document.getElementById("adminMemberList").innerHTML = html;
    });
}
function renderArticles() {
  const blogContent = document.getElementById("blogContent");
  if (!blogContent) return;

  firestore
    .collection("articles")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        blogContent.innerHTML = "<i>Belum ada artikel.</i>";
        return;
      }

      let html = "";
      snapshot.forEach((doc) => {
        const art = doc.data();
        const id = doc.id;
        const createdAt = art.createdAt?.toDate().toLocaleString() || "-";
        const author = art.author || "Anonim";

        html += `
        <div class="blog-post" onclick="toggleArticle(this)" style="cursor:pointer;">
          <h3 class="article-title">${art.title}</h3>
          ${
            art.image
              ? `<img class="article-image" src="${art.image}" style="max-width:100%;border-radius:6px;margin-bottom:8px;">`
              : ""
          }
          <div class="article-content" style="display:none;margin-top:6px;">
            <div>${art.content}</div>
            <small><i>Dibuat: ${createdAt} oleh ${author}</i></small>
            ${
              isAdmin()
                ? `
              <div style="margin-top:8px;">
                <button class="btn" onclick="event.stopPropagation(); editArticle('${id}')">Edit</button>
                <button class="btn delete-btn" onclick="event.stopPropagation(); deleteArticle('${id}')">Hapus</button>
              </div>
            `
                : ""
            }
          </div>
        </div>
        <hr>
      `;
      });

      blogContent.innerHTML = html;
    });
}
// Jika ada gambar, baca dulu base64-nya

function editArticle(id) {
  firestore
    .collection("articles")
    .doc(id)
    .get()
    .then((doc) => {
      if (!doc.exists) return alert("Artikel tidak ditemukan!");
      const art = doc.data();
      document.getElementById("articleForm").style.display = "block";
      document.getElementById("addArticleButton").style.display = "none";
      document.getElementById("articleTitle").value = art.title;
      if (window.quill) window.quill.root.innerHTML = art.content || "";
      // Simpan id artikel yang diedit
      document.getElementById("articleForm").setAttribute("data-edit-id", id);
    });
}

function deleteArticle(id) {
  if (!confirm("Yakin ingin menghapus artikel ini?")) return;
  firestore
    .collection("articles")
    .doc(id)
    .delete()
    .then(() => {
      alert("Artikel dihapus!");
      renderArticles();
    });
}
function saveArticle() {
  const title = document.getElementById("articleTitle").value.trim();
  const imageFile = document.getElementById("articleImage").files[0];
  const content = window.quill?.root.innerHTML || "";
  const form = document.getElementById("articleForm");
  const editId = form.getAttribute("data-edit-id");

  if (!title || !content) {
    alert("Judul dan isi artikel wajib diisi!");
    return;
  }

  // Ambil username dari profil Firestore
  firestore
    .collection("users")
    .doc(currentUser.uid)
    .get()
    .then((userDoc) => {
      const username = userDoc.exists
        ? userDoc.data().username || currentUser.email
        : currentUser.email;

      const articleData = {
        title,
        content,
        createdAt: firebase.firestore.Timestamp.now(),
        author: username, // Simpan username, bukan email
      };

      function afterSave() {
        alert(
          editId ? "Artikel berhasil diupdate!" : "Artikel berhasil disimpan!"
        );
        hideArticleForm();
        renderArticles();
        form.removeAttribute("data-edit-id");
      }

      if (imageFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
          articleData.image = e.target.result;
          if (editId) {
            firestore
              .collection("articles")
              .doc(editId)
              .update(articleData)
              .then(afterSave);
          } else {
            firestore.collection("articles").add(articleData).then(afterSave);
          }
        };
        reader.readAsDataURL(imageFile);
      } else {
        if (editId) {
          firestore
            .collection("articles")
            .doc(editId)
            .update(articleData)
            .then(afterSave);
        } else {
          firestore.collection("articles").add(articleData).then(afterSave);
        }
      }
    });
}

function showArticleForm() {
  document.getElementById("articleForm").style.display = "block";
  document.getElementById("addArticleButton").style.display = "none";

  // ✅ Pastikan Quill sudah diinisialisasi
  if (!window.quill) {
    const quillContainer = document.getElementById("editor");
    if (quillContainer) {
      window.quill = new Quill(quillContainer, { theme: "snow" });
    } else {
      console.error("Elemen editor tidak ditemukan!");
      return;
    }
    // ✅ Inisialisasi ulang Quill hanya jika belum ada
    if (!window.quill && document.getElementById("editor")) {
      window.quill = new Quill("#editor", { theme: "snow" });
    }
  }
}
function hideArticleForm() {
  document.getElementById("articleForm").style.display = "none";
  document.getElementById("addArticleButton").style.display = "block";
}

function toggleArticle(el) {
  const content = el.querySelector(".article-content");
  if (!content) return;

  const isVisible = content.style.display === "block";

  // Sembunyikan semua artikel lain
  document
    .querySelectorAll(".article-content")
    .forEach((c) => (c.style.display = "none"));

  // Toggle tampilan yang diklik
  content.style.display = isVisible ? "none" : "block";

  // Gulung ke atas jika menutup
  if (isVisible) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function addGroup() {
  // Tampilkan prompt atau modal untuk input nama dan deskripsi grup
  const groupName = prompt("Nama Group:");
  if (!groupName) return alert("Nama group wajib diisi!");
  const groupDesc = prompt("Deskripsi Group:") || "";

  firestore
    .collection("groups")
    .add({
      name: groupName,
      description: groupDesc,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      adminId: auth.currentUser?.uid,
    })
    .then(() => {
      alert("Group berhasil dibuat!");
      renderGroupList();
    })
    .catch((err) => {
      alert("Gagal membuat group: " + err.message);
    });
}
function showAdminGroupBtns() {
  const adminBtns = document.getElementById("adminGroupBtns");
  if (!adminBtns) return;
  adminBtns.innerHTML = isAdmin()
    ? `
        <button class="btn" onclick="addGroup()">Tambah Group</button>
        <button class="btn" onclick="refreshGroupList()">Refresh Group</button>
        <button class="btn" onclick="logoutAdmin()">Logout Admin</button>
        <button class="btn" onclick="loginAdmin()">Login Admin</button>
        `
    : `
    `;
}

// Gabung Group 
function joinGroup(groupId) {
  const user = auth.currentUser;
  if (!user) return alert("Harap login terlebih dahulu");
  if (!confirm("Yakin ingin bergabung ke grup ini?")) return;

  firestore
    .collection("groups")
    .doc(groupId)
    .update({
      members: firebase.firestore.FieldValue.arrayUnion(user.uid),
    })
    .then(() => {
      alert("Berhasil bergabung ke grup!");
      renderGroupList();
    });
}



function renderGroupList() {
  const container = document.getElementById("groupList");
  if (!container) return;

  firestore
    .collection("groups")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        container.innerHTML = "<p>Belum ada grup.</p>";
        return;
      }

      const currentUid = auth.currentUser?.uid;
      let html = "";

      snapshot.forEach((doc) => {
        const group = doc.data();
        const id = doc.id;

        const isAdminGroup = group.adminId === currentUid || isAdmin();
        const memberList = Array.isArray(group.members) ? group.members : [];
        const isMember = memberList.includes(currentUid);

        html += `
          <div class="group-item">
            <h4>${group.name}</h4>
            <p>${group.description || ""}</p>
            <button onclick="openGroupChat('${id}', '${group.name}')">Chat</button>
            ${
              isAdminGroup
                ? `
              <button onclick="editGroup('${id}')">Edit</button>
              <button onclick="deleteGroup('${id}')">Hapus</button>
              <button onclick="clearGroupChat('${id}')">Clear Chat</button>
              `
                : isMember
                ? `<button onclick="leaveGroup('${id}')">Keluar</button>`
                : `<button onclick="joinGroup('${id}')">Gabung</button>`
            }
          </div>
        `;
      });

      container.innerHTML = html;
    });
}


function leaveGroup(groupId) {
  const user = auth.currentUser;
  if (!user) return alert("Harap login terlebih dahulu");
  if (!confirm("Yakin ingin keluar dari grup ini?")) return;

  firestore
    .collection("groups")
    .doc(groupId)
    .update({
      members: firebase.firestore.FieldValue.arrayRemove(user.uid),
    })
    .then(() => {
      alert("Anda telah keluar dari grup.");
      renderGroupList();
    });
}

// Edit Group Modal (contoh sederhana)
function editGroup(groupId) {
  firestore
    .collection("groups")
    .doc(groupId)
    .get()
    .then((doc) => {
      if (!doc.exists) return alert("Group tidak ditemukan");
      const group = doc.data();
      const newName = prompt("Edit Nama Group:", group.name);
      const newDesc = prompt("Edit Deskripsi Group:", group.description || "");
      if (newName) {
        firestore
          .collection("groups")
          .doc(groupId)
          .update({
            name: newName,
            description: newDesc,
          })
          .then(() => {
            alert("Group berhasil diupdate");
            renderGroupList();
          });
      }
    });
}
// Hapus Group (hanya admin group)
function deleteGroup(groupId) {
  firestore
    .collection("groups")
    .doc(groupId)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const group = doc.data();
      const currentUid = auth.currentUser?.uid;
      if (group.adminId !== currentUid) {
        alert("Hanya admin group yang bisa menghapus group!");
        return;
      }
      if (!confirm("Yakin ingin menghapus grup ini?")) return;
      firestore
        .collection("groups")
        .doc(groupId)
        .delete()
        .then(() => {
          alert("Grup berhasil dihapus");
          renderGroupList();
        });
    });
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

function getContrastYIQ(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

function openGroupChat(groupId, groupName) {
  currentGroupId = groupId;
  document.getElementById("groupChatTitle").innerText =
    "Group Chat - " + groupName;
  document.getElementById("groupChatMessages").innerHTML = "Memuat pesan...";
  openModal("groupChatModal");
  // Ambil pesan dari Firestore
  firestore
    .collection("groups")
    .doc(groupId)
    .collection("chats")
    .orderBy("timestamp")
    .onSnapshot((snapshot) => {
      const chatBox = document.getElementById("groupChatMessages");
      chatBox.innerHTML = "";

      snapshot.forEach((doc) => {
        const chat = doc.data();
        const displayName = chat.username || chat.user || "Anonim";

        const bgColor = stringToColor(displayName);
        const textColor = getContrastYIQ(bgColor);

        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";
        bubble.style.backgroundColor = bgColor;
        bubble.style.color = textColor;

        bubble.innerHTML = `
        <div class="chat-username">${displayName}</div>
        <div class="chat-message">${chat.message}</div>
      `;

        const timestamp = chat.timestamp
          ? chat.timestamp
              .toDate()
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Unknown";
        const timeEl = document.createElement("div");
        timeEl.className = "chat-timestamp";
        timeEl.innerText = timestamp;
        bubble.appendChild(timeEl);

        chatBox.appendChild(bubble);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function sendGroupChat() {
  const msg = document.getElementById("groupChatInput").value.trim();
  // Ambil username dari Firestore user profile, fallback ke email atau 'Anonim'
  let username = "";
  if (currentUser) {
    // Coba ambil dari Firestore user profile
    firestore
      .collection("users")
      .doc(currentUser.uid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          username = doc.data().username || currentUser.email || "Anonim";
        } else {
          username = currentUser.email || "Anonim";
        }
        if (!msg || !currentGroupId) return;
        firestore
          .collection("groups")
          .doc(currentGroupId)
          .collection("chats")
          .add({
            username,
            message: msg,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            document.getElementById("groupChatInput").value = "";
          });
      });
  } else {
    // Jika belum login
    if (!msg || !currentGroupId) return;
    firestore
      .collection("groups")
      .doc(currentGroupId)
      .collection("chats")
      .add({
        username: "Anonim",
        message: msg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => {
        document.getElementById("groupChatInput").value = "";
      });
  }
}

// Clear Chat (hanya admin group)
function clearGroupChat(groupId) {
  firestore
    .collection("groups")
    .doc(groupId)
    .get()
    .then((doc) => {
      if (!doc.exists) return;
      const group = doc.data();
      const currentUid = auth.currentUser?.uid;
      if (group.adminId !== currentUid) {
        alert("Hanya admin group yang bisa clear chat!");
        return;
      }
      if (!confirm("Yakin ingin menghapus semua chat di grup ini?")) return;
      firestore
        .collection("groups")
        .doc(groupId)
        .collection("chats")
        .get()
        .then((snapshot) => {
          const batch = firestore.batch();
          snapshot.forEach((chatDoc) => {
            batch.delete(chatDoc.ref);
          });
          batch.commit().then(() => {
            alert("Semua chat di grup telah dihapus.");
            openGroupChat(groupId, group.name);
          });
        });
    });
}
// Jalankan saat halaman group aktif
if (window.location.hash.includes("group")) {
  setTimeout(renderGroupList, 200);
}

// ✅ Fix untuk error classList dan klik tab
function setActiveTab(tabId) {
  document
    .querySelectorAll(".tab-menu button")
    .forEach((btn) => btn.classList.remove("active"));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const myProfileMenu = document.getElementById("myProfileMenu");
  if (myProfileMenu) {
    myProfileMenu.onclick = (e) => {
      e.preventDefault();
      setActiveTab("profileMenuBtn");
      showPage("profile");
    };
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const homeTab = document.getElementById("homeTab");
  if (homeTab) {
    homeTab.addEventListener("click", () => {
      showPage("home");

      // tampilkan post jika elemen ada
      if (document.getElementById("userPostCard")) {
        renderUserPostCard();
      }
    });
  }
});


// Navigasi Halaman
document.querySelectorAll(".nav-link").forEach((link) => {
  link.onclick = function (e) {
    e.preventDefault();
    const pageName = this.getAttribute("data-page");
    if (pageName) {
      navigateTo(pageName);
      setActiveTab(`tab-${pageName}`);
    } else {
      console.warn("Halaman tidak ditemukan untuk link ini!");
    }
  };
});


// Copy Invite Code
function copyGroupInviteCode() {
  const inviteCode = document.getElementById("groupInviteCodeModal").innerText;
  navigator.clipboard.writeText(inviteCode).then(() => {
    alert("Kode undangan telah disalin ke clipboard!");
  });
}

// Close modal when clicking outside
window.onclick = function (event) {
  [
    "scheduleModal",
    "inviteModal",
    "chatModal",
    "groupChatModal",
    "changePwdModal",
    "checkoutModal",
    "authModal",
  ].forEach(function (id) {
    var modal = document.getElementById(id);
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
};
