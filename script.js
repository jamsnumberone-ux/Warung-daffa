// --- IMPORT FIREBASE MODULAR ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- KONFIGURASI FIREBASE LU ---
const firebaseConfig = {
    apiKey: "AIzaSyA29SSjNgg2HfTZxlWJjfZmLyj5r3MOqgg",
    authDomain: "warung-daffa.firebaseapp.com",
    projectId: "warung-daffa",
    storageBucket: "warung-daffa.firebasestorage.app",
    messagingSenderId: "577925837902",
    appId: "1:577925837902:web:106e1e5fbccbbd39467f1f",
    measurementId: "G-H0L7FFX2ZT"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- STATE LOKAL ---
let products = [];
let cart = [];
let kasbonList = [];
let transactions = [];
let currentUser = '';

// --- SISTEM REAL-TIME FIREBASE ---
// Fungsi ini buat narik data otomatis kalau ada perubahan di database
function loadDataRealtime() {
    // Tarik data Produk
    onSnapshot(collection(db, "products"), (snapshot) => {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStok();
        renderKasir();
    });

    // Tarik data Kasbon
    onSnapshot(collection(db, "kasbon"), (snapshot) => {
        kasbonList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderKasbon();
    });

    // Tarik data Transaksi Laporan
    onSnapshot(collection(db, "transactions"), (snapshot) => {
        transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Urutkan transaksi dari yang terbaru
        transactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        renderLaporan();
    });
}

// --- SISTEM LOGIN ---
window.login = function() {
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
    
    const adminMenus = document.querySelectorAll('.admin-only');
    adminMenus.forEach(menu => {
        menu.style.display = currentUser === 'admin' ? 'block' : 'none';
    });

    // Mulai narik data dari Firebase
    loadDataRealtime();
    window.showTab('kasir');
}

window.logout = function() {
    currentUser = '';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// --- NAVIGASI TAB ---
window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById('tab-' + tabName).classList.remove('hidden');
}

// --- FITUR STOK BARANG ---
window.tambahBarang = async function() {
    const nama = document.getElementById('nama-barang').value;
    const harga = parseInt(document.getElementById('harga-barang').value);
    const stok = parseInt(document.getElementById('stok-barang').value);

    if(nama && harga && stok) {
        try {
            await addDoc(collection(db, "products"), { nama, harga, stok });
            document.getElementById('nama-barang').value = '';
            document.getElementById('harga-barang').value = '';
            document.getElementById('stok-barang').value = '';
        } catch (e) {
            alert("Gagal menambah barang: " + e.message);
        }
    }
}

function renderStok() {
    const list = document.getElementById('stok-list');
    list.innerHTML = '';
    products.forEach((p) => {
        list.innerHTML += `<li class="py-2 flex justify-between">
            <span>${p.nama} (Sisa: ${p.stok})</span> 
            <span class="font-bold">Rp ${p.harga}</span>
            <button onclick="hapusBarang('${p.id}')" class="text-red-500 text-sm">Hapus</button>
        </li>`;
    });
}

window.hapusBarang = async function(id) {
    if(confirm("Yakin ingin menghapus barang ini?")) {
        await deleteDoc(doc(db, "products", id));
    }
}

// --- FITUR KASIR ---
function renderKasir() {
    const list = document.getElementById('product-list-kasir');
    list.innerHTML = '';
    products.forEach(p => {
        const bg = p.stok > 0 ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : 'bg-red-50 opacity-50';
        list.innerHTML += `
            <div onclick="${p.stok > 0 ? `masukKeranjang('${p.id}')` : ''}" class="${bg} p-3 rounded border text-center transition">
                <div class="font-bold">${p.nama}</div>
                <div class="text-blue-600">Rp ${p.harga}</div>
                <div class="text-sm text-gray-500">Stok: ${p.stok}</div>
            </div>`;
    });
}

window.masukKeranjang = function(id) {
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
        list.innerHTML += `<li class="flex justify-between items-center text-sm py-2 border-b">
            <span>${c.nama} x${c.qty}</span>
            <div class="flex items-center gap-3">
                <span>Rp ${subtotal}</span>
                <button onclick="hapusDariKeranjang('${c.id}')" class="bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold hover:bg-red-200">X</button>
            </div>
        </li>`;
    });
    document.getElementById('total-price').innerText = total;
}
window.hapusDariKeranjang = function(id) {
    const index = cart.findIndex(c => c.id === id);
    if(index !== -1) {
        cart.splice(index, 1); // Langsung hapus barang dari nota
        renderKeranjang();     // Refresh tampilan nota
    }
}

window.bayar = async function() {
    const uang = parseInt(document.getElementById('uang-bayar').value) || 0;
    const total = parseInt(document.getElementById('total-price').innerText);
    
    if(cart.length === 0) return alert('Belum ada barang!');
    if(uang < total) return alert('Uang bayar kurang!');

    try {
        // 1. Kurangi stok di database
        for (const c of cart) {
            const p = products.find(prod => prod.id === c.id);
            const sisaStok = p.stok - c.qty;
            await updateDoc(doc(db, "products", c.id), { stok: sisaStok });
        }

        // 2. Catat Transaksi Laporan
        await addDoc(collection(db, "transactions"), { 
            tanggal: new Date().toISOString(), // Simpan format standar
            tanggal_tampil: new Date().toLocaleString(),
            total: total 
        });

        alert(`Berhasil dibayar! Kembalian: Rp ${uang - total}`);
        
        // Reset Keranjang
        cart = [];
        document.getElementById('uang-bayar').value = '';
        renderKeranjang();
    } catch (e) {
        alert("Gagal memproses pembayaran: " + e.message);
    }
}

// --- FITUR KASBON (BISA CICIL) ---
window.tambahKasbon = async function() {
    const nama = document.getElementById('nama-ngutang').value;
    const jumlah = parseInt(document.getElementById('jumlah-ngutang').value);
    
    if(nama && jumlah) {
        try {
            await addDoc(collection(db, "kasbon"), { 
                nama: nama, 
                sisaUtang: jumlah, 
                tanggal: new Date().toLocaleDateString() 
            });
            document.getElementById('nama-ngutang').value = '';
            document.getElementById('jumlah-ngutang').value = '';
        } catch (e) {
            alert("Gagal mencatat kasbon: " + e.message);
        }
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
                <button onclick="cicilUtang('${k.id}')" class="bg-green-500 text-white px-2 py-1 rounded text-sm">Bayar</button>
            </div>
        </li>`;
    });
}

window.cicilUtang = async function(id) {
    const nominal = parseInt(document.getElementById(`cicil-${id}`).value);
    const target = kasbonList.find(k => k.id === id);
    
    if(nominal && nominal > 0 && target) {
        const sisa = target.sisaUtang - nominal;
        
        try {
            if(sisa <= 0) {
                // Lunas, hapus dari database
                await deleteDoc(doc(db, "kasbon", id));
                alert(`${target.nama} Lunas!`);
            } else {
                // Update sisa utang
                await updateDoc(doc(db, "kasbon", id), { sisaUtang: sisa });
                alert(`Sisa utang ${target.nama} tinggal Rp ${sisa}`);
            }
        } catch (e) {
            alert("Gagal mengupdate kasbon: " + e.message);
        }
    }
}

// --- FITUR LAPORAN ---
function renderLaporan() {
    const list = document.getElementById('laporan-list');
    list.innerHTML = '';
    transactions.forEach(t => {
        list.innerHTML += `<li class="py-2 flex justify-between border-b text-sm">
            <span>${t.tanggal_tampil || t.tanggal}</span>
            <span class="font-bold text-green-600">+ Rp ${t.total}</span>
        </li>`;
    });
}
