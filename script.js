// --- DATABASE LOKAL SEMENTARA ---
// Biar langsung jalan di GitHub tanpa setup server rumit, kita pakai LocalStorage
let products = JSON.parse(localStorage.getItem('produk_daffa')) || [];
let cart = [];
let kasbonList = JSON.parse(localStorage.getItem('kasbon_daffa')) || [];
let transactions = JSON.parse(localStorage.getItem('transaksi_daffa')) || [];
let currentUser = '';

// --- SISTEM LOGIN ---
function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === 'admin' && pass === 'admin123') {
        currentUser = 'admin';
        berhasilLogin();
    } else if (user === 'staff' && pass === 'staff123') {
        currentUser = 'staff';
        berhasilLogin();
    } else {
        alert('Username atau Password salah!');
    }
}

function berhasilLogin() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('user-role').innerText = currentUser;
    
    // Sembunyikan menu admin kalau yang login staff
    const adminMenus = document.querySelectorAll('.admin-only');
    adminMenus.forEach(menu => {
        menu.style.display = currentUser === 'admin' ? 'block' : 'none';
    });

    showTab('kasir');
    renderStok();
    renderKasir();
    renderKasbon();
    renderLaporan();
}

function logout() {
    currentUser = '';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// --- NAVIGASI TAB ---
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById('tab-' + tabName).classList.remove('hidden');
}

// --- FITUR STOK BARANG ---
function tambahBarang() {
    const nama = document.getElementById('nama-barang').value;
    const harga = parseInt(document.getElementById('harga-barang').value);
    const stok = parseInt(document.getElementById('stok-barang').value);

    if(nama && harga && stok) {
        products.push({ id: Date.now(), nama, harga, stok });
        simpanData();
        renderStok();
        renderKasir();
        document.getElementById('nama-barang').value = '';
        document.getElementById('harga-barang').value = '';
        document.getElementById('stok-barang').value = '';
    }
}

function renderStok() {
    const list = document.getElementById('stok-list');
    list.innerHTML = '';
    products.forEach((p, index) => {
        list.innerHTML += `<li class="py-2 flex justify-between">
            <span>${p.nama} (Sisa: ${p.stok})</span> 
            <span class="font-bold">Rp ${p.harga}</span>
            <button onclick="hapusBarang(${index})" class="text-red-500 text-sm">Hapus</button>
        </li>`;
    });
}

function hapusBarang(index) {
    products.splice(index, 1);
    simpanData();
    renderStok();
    renderKasir();
}

// --- FITUR KASIR ---
function renderKasir() {
    const list = document.getElementById('product-list-kasir');
    list.innerHTML = '';
    products.forEach(p => {
        const bg = p.stok > 0 ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : 'bg-red-50 opacity-50';
        list.innerHTML += `
            <div onclick="${p.stok > 0 ? `masukKeranjang(${p.id})` : ''}" class="${bg} p-3 rounded border text-center transition">
                <div class="font-bold">${p.nama}</div>
                <div class="text-blue-600">Rp ${p.harga}</div>
                <div class="text-sm text-gray-500">Stok: ${p.stok}</div>
            </div>`;
    });
}

function masukKeranjang(id) {
    const produk = products.find(p => p.id === id);
    const itemDiKeranjang = cart.find(c => c.id === id);

    if(itemDiKeranjang) {
        if(itemDiKeranjang.qty < produk.stok) itemDiKeranjang.qty++;
    } else {
        cart.push({ ...produk, qty: 1 });
    }
    renderKeranjang();
}

function renderKeranjang() {
    const list = document.getElementById('cart-list');
    let total = 0;
    list.innerHTML = '';
    cart.forEach(c => {
        const subtotal = c.harga * c.qty;
        total += subtotal;
        list.innerHTML += `<li class="flex justify-between text-sm py-1 border-b">
            <span>${c.nama} x${c.qty}</span>
            <span>Rp ${subtotal}</span>
        </li>`;
    });
    document.getElementById('total-price').innerText = total;
}

function bayar() {
    const uang = parseInt(document.getElementById('uang-bayar').value) || 0;
    const total = parseInt(document.getElementById('total-price').innerText);
    
    if(cart.length === 0) return alert('Belum ada barang!');
    if(uang < total) return alert('Uang bayar kurang!');

    // Kurangi stok
    cart.forEach(c => {
        const p = products.find(prod => prod.id === c.id);
        p.stok -= c.qty;
    });

    // Catat Laporan
    transactions.push({ tanggal: new Date().toLocaleString(), total: total });
    
    simpanData();
    alert(`Berhasil dibayar! Kembalian: Rp ${uang - total}`);
    
    cart = [];
    document.getElementById('uang-bayar').value = '';
    renderKeranjang();
    renderKasir();
    renderStok();
    renderLaporan();
}

// --- FITUR KASBON (BISA CICIL) ---
function tambahKasbon() {
    const nama = document.getElementById('nama-ngutang').value;
    const jumlah = parseInt(document.getElementById('jumlah-ngutang').value);
    
    if(nama && jumlah) {
        kasbonList.push({ id: Date.now(), nama, sisaUtang: jumlah, tanggal: new Date().toLocaleDateString() });
        simpanData();
        renderKasbon();
        document.getElementById('nama-ngutang').value = '';
        document.getElementById('jumlah-ngutang').value = '';
    }
}

function renderKasbon() {
    const list = document.getElementById('kasbon-list');
    list.innerHTML = '';
    kasbonList.forEach(k => {
        list.innerHTML += `<li class="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b">
            <div>
                <div class="font-bold">${k.nama} <span class="text-xs font-normal text-gray-500">(${k.tanggal})</span></div>
                <div class="text-red-500">Sisa Utang: Rp ${k.sisaUtang}</div>
            </div>
            <div class="mt-2 sm:mt-0 flex gap-2">
                <input type="number" id="cicil-${k.id}" placeholder="Jml Cicil" class="border p-1 w-24 text-sm rounded">
                <button onclick="cicilUtang(${k.id})" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Bayar</button>
            </div>
        </li>`;
    });
}

function cicilUtang(id) {
    const nominal = parseInt(document.getElementById(`cicil-${id}`).value);
    const index = kasbonList.findIndex(k => k.id === id);
    
    if(nominal && nominal > 0) {
        kasbonList[index].sisaUtang -= nominal;
        if(kasbonList[index].sisaUtang <= 0) {
            alert(`${kasbonList[index].nama} Lunas!`);
            kasbonList.splice(index, 1);
        } else {
            alert(`Sisa utang ${kasbonList[index].nama} tinggal Rp ${kasbonList[index].sisaUtang}`);
        }
        simpanData();
        renderKasbon();
    }
}

// --- FITUR LAPORAN ---
function renderLaporan() {
    const list = document.getElementById('laporan-list');
    list.innerHTML = '';
    transactions.forEach(t => {
        list.innerHTML += `<li class="py-2 flex justify-between border-b text-sm">
            <span>${t.tanggal}</span>
            <span class="font-bold text-green-600">+ Rp ${t.total}</span>
        </li>`;
    });
}

// --- PENYIMPANAN ---
function simpanData() {
    localStorage.setItem('produk_daffa', JSON.stringify(products));
    localStorage.setItem('kasbon_daffa', JSON.stringify(kasbonList));
    localStorage.setItem('transaksi_daffa', JSON.stringify(transactions));
}
