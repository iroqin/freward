import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyBcG-UedQ9QVdznMPJIA-0YrJGHPEPBDSA",
  authDomain: "freward-119b2.firebaseapp.com",
  projectId: "freward-119b2",
  storageBucket: "freward-119b2.firebasestorage.app",
  messagingSenderId: "215497585199",
  appId: "1:215497585199:web:b0c766cceb67ccc8814cda"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State Aplikasi
let currentUser = null;
let usersData = [];

// Data Awal: Pengguna
const initialUsers = [
    { id: "u1", name: "Ayah Qori", role: "admin", pin: "1111", points: 0 },
    { id: "u2", name: "Ibu Ririn", role: "admin", pin: "2222", points: 0 },
    { id: "u3", name: "Zafira", role: "member", pin: "3333", points: 0 },
    { id: "u4", name: "Kaivan", role: "member", pin: "4444", points: 0 }
];

// Data Awal: Katalog Tugas Lengkap
const initialTasks = [
    // KATEGORI A - Kamar Sendiri
    { id: "A1", name: "Lipat selimut & rapikan bantal", points: 3 },
    { id: "A2", name: "Rapikan tempat tidur proper", points: 5 },
    { id: "A3", name: "Rapikan meja belajar", points: 5 },
    { id: "A4", name: "Ganti sprei sendiri", points: 10 },
    { id: "A5", name: "Bersihkan kamar sendiri (sapu + rapikan)", points: 15 },
    { id: "A6", name: "Bersihkan kamar lengkap (sapu + pel + rapikan)", points: 25 },
    
    // KATEGORI B - Dapur
    { id: "B1", name: "Taruh piring kotor ke wastafel", points: 2 },
    { id: "B2", name: "Lap meja makan", points: 3 },
    { id: "B3", name: "Cuci gelas & piring milik sendiri", points: 5 },
    { id: "B4", name: "Buang sampah dapur", points: 8 },
    { id: "B5", name: "Cuci piring keluarga 1x makan", points: 15 },
    { id: "B6", name: "Cuci piring keluarga + panci/wajan", points: 20 },
    { id: "B7", name: "Bantu cuci/potong sayur", points: 12 },
    { id: "B8", name: "Bantu masak (mengaduk, pantau api)", points: 18 },
    { id: "B9", name: "Masak makanan sederhana sendiri", points: 25 },
    
    // KATEGORI C - Ruang Bersama
    { id: "C1", name: "Rapikan bantal sofa", points: 3 },
    { id: "C2", name: "Rapikan barang berserakan di ruang tamu", points: 6 },
    { id: "C3", name: "Lap meja & furnitur dengan kemoceng", points: 6 },
    { id: "C4", name: "Sapu ruang tamu / 1 ruangan", points: 8 },
    { id: "C5", name: "Sapu seluruh rumah", points: 18 },
    { id: "C6", name: "Pel 1 ruangan", points: 10 },
    { id: "C7", name: "Pel seluruh rumah", points: 22 },
    { id: "C8", name: "Sapu + pel seluruh rumah", points: 35 },
    
    // KATEGORI D - Kamar Mandi
    { id: "D1", name: "Gantung handuk rapi setelah pakai", points: 2 },
    { id: "D2", name: "Lap cermin wastafel", points: 5 },
    { id: "D3", name: "Bersihkan wastafel", points: 10 },
    { id: "D4", name: "Bersihkan toilet", points: 18 },
    { id: "D5", name: "Bersihkan kamar mandi lengkap", points: 25 },
    
    // KATEGORI E - Luar Rumah & Lain-lain
    { id: "E1", name: "Siram tanaman", points: 6 },
    { id: "E2", name: "Buang sampah ke tempat sampah luar", points: 8 },
    { id: "E3", name: "Cuci sepatu sendiri", points: 12 },
    { id: "E4", name: "Beli sesuatu di warung dekat", points: 10 },
    { id: "E5", name: "Cuci sepeda / motor (bantu)", points: 15 },

    // KATEGORI F - Belajar & Akademik
    { id: "F1", name: "Siapkan tas & buku malam sebelumnya", points: 5 },
    { id: "F2", name: "Mengerjakan PR 1 mapel", points: 15 },
    { id: "F3", name: "Mengerjakan PR 2+ mapel", points: 25 },
    { id: "F4", name: "Belajar mandiri 30 menit (tanpa disuruh)", points: 20 },
    { id: "F5", name: "Belajar mandiri 1 jam", points: 35 },
    { id: "F6", name: "Latihan soal tambahan / modul", points: 20 },
    { id: "F7", name: "Buat rangkuman / mind map pelajaran", points: 22 },
    { id: "F8", name: "Persiapan ujian intensif (1 jam)", points: 35 },

    // KATEGORI G - Membaca
    { id: "G1", name: "Membaca 15 menit", points: 10 },
    { id: "G2", name: "Membaca 30 menit", points: 18 },
    { id: "G3", name: "Membaca 1 jam", points: 30 }
];

// Data Awal: Katalog Hadiah Lengkap
const initialRewards = [
    // TIER 1 - Screen Time
    { id: "R1", name: "Main game 30 menit", points: 25 },
    { id: "R2", name: "Main game 1 jam", points: 45 },
    { id: "R3", name: "Nonton YouTube 30 menit", points: 20 },
    { id: "R4", name: "Nonton YouTube 1 jam", points: 35 },
    { id: "R5", name: "Nonton film/series 1 episode", points: 30 },
    
    // TIER 2 - Privilege
    { id: "R6", name: "Pilih menu makan malam", points: 30 },
    { id: "R7", name: "Pilih film keluarga malam ini", points: 35 },
    { id: "R8", name: "Bebas PR malam ini", points: 50 },
    { id: "R9", name: "Tidur 1 jam lebih malam (Weekend)", points: 60 },
    { id: "R10", name: "Ajak 1 teman main ke rumah", points: 70 },
    { id: "R11", name: "Tentukan aktivitas hari Minggu", points: 100 },
    
    // TIER 3 - Jajan & Makanan
    { id: "R12", name: "Snack / jajan pilihan (< Rp 15rb)", points: 40 },
    { id: "R13", name: "Jajan agak besar (Rp 15–30rb)", points: 70 },
    { id: "R14", name: "Makan di restoran / tempat favorit", points: 150 },
    
    // TIER 4 - Hadiah Fisik
    { id: "R15", name: "Mainan kecil (< Rp 50rb)", points: 200 },
    { id: "R16", name: "Mainan sedang (Rp 50–150rb)", points: 400 },
    { id: "R17", name: "Mainan besar (Rp 150–300rb)", points: 800 },
    { id: "R18", name: "Hadiah spesial / wishlist utama", points: 1500 }
];

// Inisialisasi Aplikasi
async function initApp() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    // Seed data jika database kosong
    if (usersSnapshot.empty) {
        for (const user of initialUsers) {
            await setDoc(doc(db, "users", user.id), user);
        }
        for (const task of initialTasks) {
            await setDoc(doc(db, "tasks", task.id), task);
        }
        for (const reward of initialRewards) {
            await setDoc(doc(db, "rewards", reward.id), reward);
        }
        alert("Database diinisialisasi dengan data lengkap. Silakan muat ulang halaman.");
        return;
    }

    usersData = [];
    usersSnapshot.forEach((doc) => usersData.push(doc.data()));
    renderUserSelection();
}

// Logika UI Login
function renderUserSelection() {
    const container = document.getElementById("user-selection");
    container.innerHTML = "";
    usersData.forEach(user => {
        const btn = document.createElement("button");
        btn.innerText = user.name;
        btn.onclick = () => showPinScreen(user);
        container.appendChild(btn);
    });
}

window.showPinScreen = function(user) {
    selectedUserForLogin = user;
    document.getElementById("user-selection").classList.add("hidden");
    document.getElementById("pin-section").classList.remove("hidden");
    document.getElementById("login-name").innerText = user.name;
};

let selectedUserForLogin = null;

window.resetLogin = function() {
    selectedUserForLogin = null;
    document.getElementById("pin-input").value = "";
    document.getElementById("user-selection").classList.remove("hidden");
    document.getElementById("pin-section").classList.add("hidden");
};

window.verifyPin = function() {
    const pin = document.getElementById("pin-input").value;
    if (pin === selectedUserForLogin.pin) {
        currentUser = selectedUserForLogin;
        loadDashboard();
    } else {
        alert("PIN Salah!");
    }
};

window.logout = function() {
    currentUser = null;
    resetLogin();
    document.getElementById("main-screen").classList.remove("active");
    document.getElementById("main-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.add("active");
    document.getElementById("login-screen").classList.remove("hidden");
};

// Logika Dashboard
function loadDashboard() {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    document.getElementById("main-screen").classList.add("active");
    document.getElementById("welcome-text").innerText = `Halo, ${currentUser.name}`;

    if (currentUser.role === "admin") {
        document.getElementById("admin-view").classList.remove("hidden");
        document.getElementById("member-view").classList.add("hidden");
        listenToPendingTasks();
    } else {
        document.getElementById("admin-view").classList.add("hidden");
        document.getElementById("member-view").classList.remove("hidden");
        listenToUserPoints();
        loadTasksAndRewards();
    }
}

// Fitur Member (Anak)
function listenToUserPoints() {
    onSnapshot(doc(db, "users", currentUser.id), (doc) => {
        document.getElementById("user-points").innerText = doc.data().points;
    });
}

async function loadTasksAndRewards() {
    // Memuat Tugas
    const taskContainer = document.getElementById("tasks-list");
    taskContainer.innerHTML = "";
    const tasksSnapshot = await getDocs(collection(db, "tasks"));
    
    tasksSnapshot.forEach((docSnap) => {
        const task = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div>
                <strong>${task.name}</strong><br>
                <small>${task.points} Poin</small>
            </div>
            <button onclick="claimTask('${docSnap.id}', '${task.name}', ${task.points})">Klaim</button>
        `;
        taskContainer.appendChild(div);
    });

    // Memuat Hadiah
    const rewardContainer = document.getElementById("rewards-list");
    rewardContainer.innerHTML = "";
    const rewardsSnapshot = await getDocs(collection(db, "rewards"));
    
    rewardsSnapshot.forEach((docSnap) => {
        const reward = docSnap.data();
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
            <div>
                <strong>${reward.name}</strong><br>
                <small>${reward.points} Poin</small>
            </div>
            <button class="secondary" onclick="redeemReward('${reward.name}', ${reward.points})">Tukar</button>
        `;
        rewardContainer.appendChild(div);
    });
}

window.claimTask = async function(taskId, taskName, points) {
    if (confirm(`Klaim tugas: ${taskName}?`)) {
        await addDoc(collection(db, "task_logs"), {
            userId: currentUser.id,
            userName: currentUser.name,
            taskId: taskId,
            taskName: taskName,
            points: points,
            status: "pending",
            timestamp: new Date()
        });
        alert("Tugas diklaim. Menunggu persetujuan dari Ayah atau Ibu.");
    }
};

window.redeemReward = async function(rewardName, pointsCost) {
    if (confirm(`Tukar ${pointsCost} poin untuk: ${rewardName}?`)) {
        const userRef = doc(db, "users", currentUser.id);
        const userDoc = await getDoc(userRef);
        const currentPoints = userDoc.data().points;

        if (currentPoints >= pointsCost) {
            await updateDoc(userRef, { points: currentPoints - pointsCost });
            alert(`Berhasil! Kamu telah menukar poin dengan: ${rewardName}.`);
        } else {
            alert(`Poin kamu tidak cukup. Kamu butuh ${pointsCost - currentPoints} poin lagi.`);
        }
    }
};

// Fitur Admin (Orang Tua)
function listenToPendingTasks() {
    const q = query(collection(db, "task_logs"), where("status", "==", "pending"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById("pending-tasks-list");
        container.innerHTML = "";
        snapshot.forEach((docSnap) => {
            const log = docSnap.data();
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <div>
                    <strong>${log.userName}</strong>: ${log.taskName}<br>
                    <small>+${log.points} Poin</small>
                </div>
                <div>
                    <button onclick="approveTask('${docSnap.id}', '${log.userId}', ${log.points})">Setuju</button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

window.approveTask = async function(logId, userId, points) {
    await updateDoc(doc(db, "task_logs", logId), { status: "approved" });
    
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const currentPoints = userDoc.data().points;
    await updateDoc(userRef, { points: currentPoints + points });
};

window.addNewTask = async function() {
    const nameInput = document.getElementById("new-task-name");
    const pointsInput = document.getElementById("new-task-points");
    
    const name = nameInput.value.trim();
    const points = parseInt(pointsInput.value);

    if (name === "" || isNaN(points)) {
        alert("Mohon isi nama tugas dan jumlah poin dengan benar.");
        return;
    }

    try {
        await addDoc(collection(db, "tasks"), {
            name: name,
            points: points
        });
        alert(`Tugas "${name}" berhasil ditambahkan ke katalog!`);
        nameInput.value = "";
        pointsInput.value = "";
    } catch (error) {
        console.error("Error menambah tugas: ", error);
        alert("Gagal menambah tugas.");
    }
};

// Jalankan saat halaman dimuat
initApp();
