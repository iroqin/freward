import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// KONFIGURASI FIREBASE ANDA
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

let currentUser = null;
let usersData = [];

// Data Awal: Pengguna
const initialUsers = [
    { id: "u1", name: "Ayah Qori", role: "admin", pin: "1111", points: 0 },
    { id: "u2", name: "Ibu Ririn", role: "admin", pin: "2222", points: 0 },
    { id: "u3", name: "Zafira", role: "member", pin: "3333", points: 0 },
    { id: "u4", name: "Kaivan", role: "member", pin: "4444", points: 0 }
];

// Data Awal: Katalog Tugas Baru
const initialTasks = [
    // Pekerjaan Rumah Tangga
    { id: "T1", name: "Rapikan kasur, selimut & bantal", points: 5, category: "Pekerjaan Rumah Tangga" },
    { id: "T2", name: "Lap meja makan", points: 3, category: "Pekerjaan Rumah Tangga" },
    { id: "T3", name: "Rapikan meja belajar", points: 5, category: "Pekerjaan Rumah Tangga" },
    { id: "T4", name: "Cuci gelas & piring milik sendiri", points: 3, category: "Pekerjaan Rumah Tangga" },
    { id: "T5", name: "Lap cermin wastafel", points: 5, category: "Pekerjaan Rumah Tangga" },
    { id: "T6", name: "Rapikan barang berserakan di ruang tamu", points: 5, category: "Pekerjaan Rumah Tangga" },
    { id: "T7", name: "Buang sampah", points: 6, category: "Pekerjaan Rumah Tangga" },
    { id: "T8", name: "Sapu ruang tamu / 1 ruangan", points: 6, category: "Pekerjaan Rumah Tangga" },
    { id: "T9", name: "Pel 1 ruangan", points: 10, category: "Pekerjaan Rumah Tangga" },
    { id: "T10", name: "Cuci piring keluarga 1x makan", points: 15, category: "Pekerjaan Rumah Tangga" },
    { id: "T11", name: "Sapu seluruh rumah", points: 18, category: "Pekerjaan Rumah Tangga" },
    { id: "T12", name: "Pel seluruh rumah", points: 20, category: "Pekerjaan Rumah Tangga" },
    { id: "T13", name: "Bersihkan kamar mandi lengkap", points: 25, category: "Pekerjaan Rumah Tangga" },

    // Akademik & Pengembangan Diri
    { id: "T14", name: "Membaca buku 30 menit", points: 15, category: "Akademik & Pengembangan Diri" },
    { id: "T15", name: "Membaca buku 1 jam", points: 30, category: "Akademik & Pengembangan Diri" },
    { id: "T16", name: "Belajar mandiri 30 menit (tanpa disuruh)", points: 15, category: "Akademik & Pengembangan Diri" },
    { id: "T17", name: "Belajar mandiri 1 jam (tanpa disuruh)", points: 30, category: "Akademik & Pengembangan Diri" },
    { id: "T18", name: "Berenang 1 jam", points: 50, category: "Akademik & Pengembangan Diri" },
    { id: "T19", name: "Jogging 1 Jam", points: 30, category: "Akademik & Pengembangan Diri" },
    { id: "T20", name: "Exercise 15 menit", points: 10, category: "Akademik & Pengembangan Diri" },
    { id: "T21", name: "Belajar alat musik 30 menit", points: 15, category: "Akademik & Pengembangan Diri" },

    // Bonus Akademik
    { id: "T22", name: "Nilai ulangan 95-100", points: 20, category: "Bonus Akademik" }
];

// Data Awal: Katalog Hadiah Baru
const initialRewards = [
    // Screen Time
    { id: "R1", name: "Nonton YouTube 30 menit", points: 20, tier: "Screen Time" },
    { id: "R2", name: "Main game 30 menit", points: 25, tier: "Screen Time" },
    { id: "R3", name: "Coding 30 menit", points: 15, tier: "Screen Time" },
    
    // Makanan & Jajan
    { id: "R4", name: "Snack / jajan pilihan sendiri (< Rp 15rb)", points: 50, tier: "Makanan & Jajan" },
    { id: "R5", name: "Jajan agak besar (Rp 15–30rb)", points: 100, tier: "Makanan & Jajan" },
    
    // Hadiah Fisik (Menabung Poin)
    { id: "R6", name: "Mainan kecil (< Rp 50rb)", points: 500, tier: "Hadiah Fisik" },
    { id: "R7", name: "Mainan sedang (Rp 50–150rb)", points: 1000, tier: "Hadiah Fisik" },
    { id: "R8", name: "Mainan besar / wishlist (Rp 150–300rb)", points: 1500, tier: "Hadiah Fisik" }
];

// Fungsi utilitas mengelompokkan data
function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key] || 'Lainnya';
        (result[groupKey] = result[groupKey] || []).push(currentValue);
        return result;
    }, {});
}

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
        alert("Database diinisialisasi dengan data baru. Silakan muat ulang halaman.");
        return;
    }

    usersData = [];
    usersSnapshot.forEach((doc) => usersData.push({id: doc.id, ...doc.data()}));
    renderUserSelection();
}

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

let selectedUserForLogin = null;
window.showPinScreen = function(user) {
    selectedUserForLogin = user;
    document.getElementById("user-selection").classList.add("hidden");
    document.getElementById("pin-section").classList.remove("hidden");
    document.getElementById("login-name").innerText = user.name;
};

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

function loadDashboard() {
    document.getElementById("login-screen").classList.remove("active");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-screen").classList.remove("hidden");
    document.getElementById("main-screen").classList.add("active");
    document.getElementById("welcome-text").innerText = `Halo, ${currentUser.name}`;

    if (currentUser.role === "admin") {
        document.getElementById("admin-view").classList.remove("hidden");
        document.getElementById("member-view").classList.add("hidden");
        switchAdminTab('approval');
        listenToPendingTasks();
        loadAdminCatalog();
    } else {
        document.getElementById("admin-view").classList.add("hidden");
        document.getElementById("member-view").classList.remove("hidden");
        listenToUserPoints();
        loadMemberTasksAndRewards();
    }
}

// ================= FITUR MEMBER (ANAK) =================

function listenToUserPoints() {
    onSnapshot(doc(db, "users", currentUser.id), (docSnap) => {
        if(docSnap.exists()) document.getElementById("user-points").innerText = docSnap.data().points;
    });
}

async function loadMemberTasksAndRewards() {
    const taskContainer = document.getElementById("tasks-list");
    taskContainer.innerHTML = "Memuat...";
    
    onSnapshot(collection(db, "tasks"), (snapshot) => {
        const tasks = [];
        snapshot.forEach(docSnap => tasks.push({id: docSnap.id, ...docSnap.data()}));
        const groupedTasks = groupBy(tasks, 'category');
        
        taskContainer.innerHTML = "";
        for (const [category, items] of Object.entries(groupedTasks).sort()) {
            let html = `<details><summary>${category}</summary><div class="details-content card-grid">`;
            items.forEach(task => {
                html += `
                <div class="card">
                    <div><strong>${task.name}</strong><br><small>${task.points} Poin</small></div>
                    <button onclick="claimTask('${task.id}', '${task.name}', ${task.points})">Klaim</button>
                </div>`;
            });
            html += `</div></details>`;
            taskContainer.innerHTML += html;
        }
    });

    const rewardContainer = document.getElementById("rewards-list");
    rewardContainer.innerHTML = "Memuat...";
    
    onSnapshot(collection(db, "rewards"), (snapshot) => {
        const rewards = [];
        snapshot.forEach(docSnap => rewards.push({id: docSnap.id, ...docSnap.data()}));
        const groupedRewards = groupBy(rewards, 'tier');
        
        rewardContainer.innerHTML = "";
        for (const [tier, items] of Object.entries(groupedRewards).sort()) {
            let html = `<details><summary>${tier}</summary><div class="details-content card-grid">`;
            items.forEach(reward => {
                html += `
                <div class="card">
                    <div><strong>${reward.name}</strong><br><small>${reward.points} Poin</small></div>
                    <button class="secondary" onclick="redeemReward('${reward.name}', ${reward.points})">Tukar</button>
                </div>`;
            });
            html += `</div></details>`;
            rewardContainer.innerHTML += html;
        }
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
        alert("Tugas diklaim. Menunggu persetujuan.");
    }
};

window.redeemReward = async function(rewardName, pointsCost) {
    if (confirm(`Tukar ${pointsCost} poin untuk: ${rewardName}?`)) {
        const userRef = doc(db, "users", currentUser.id);
        const userDoc = await getDoc(userRef);
        const currentPoints = userDoc.data().points;

        if (currentPoints >= pointsCost) {
            await updateDoc(userRef, { points: currentPoints - pointsCost });
            alert(`Berhasil menukar poin dengan: ${rewardName}.`);
        } else {
            alert(`Poin tidak cukup. Butuh ${pointsCost - currentPoints} poin lagi.`);
        }
    }
};

// ================= FITUR ADMIN =================

window.switchAdminTab = function(tab) {
    if(tab === 'approval') {
        document.getElementById("admin-approval-section").classList.remove("hidden");
        document.getElementById("admin-manage-section").classList.add("hidden");
        document.getElementById("btn-tab-approval").classList.remove("secondary");
        document.getElementById("btn-tab-manage").classList.add("secondary");
    } else {
        document.getElementById("admin-approval-section").classList.add("hidden");
        document.getElementById("admin-manage-section").classList.remove("hidden");
        document.getElementById("btn-tab-approval").classList.add("secondary");
        document.getElementById("btn-tab-manage").classList.remove("secondary");
    }
}

function listenToPendingTasks() {
    const q = query(collection(db, "task_logs"), where("status", "==", "pending"));
    onSnapshot(q, (snapshot) => {
        const container = document.getElementById("pending-tasks-list");
        container.innerHTML = "";
        if(snapshot.empty) container.innerHTML = "<p>Tidak ada tugas tertunda.</p>";
        
        snapshot.forEach((docSnap) => {
            const log = docSnap.data();
            const div = document.createElement("div");
            div.className = "card";
            div.innerHTML = `
                <div><strong>${log.userName}</strong>: ${log.taskName}<br><small>+${log.points} Poin</small></div>
                <div>
                    <button onclick="approveTask('${docSnap.id}', '${log.userId}', ${log.points})">Setuju</button>
                    <button class="danger" onclick="rejectTask('${docSnap.id}')">Tolak</button>
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
    await updateDoc(userRef, { points: userDoc.data().points + points });
};

window.rejectTask = async function(logId) {
    if(confirm("Tolak klaim tugas ini?")) {
        await updateDoc(doc(db, "task_logs", logId), { status: "rejected" });
    }
};

// --- CRUD KELOLA DATA ---

function loadAdminCatalog() {
    const container = document.getElementById("admin-catalog-list");
    onSnapshot(collection(db, "tasks"), (snapshot) => {
        container.innerHTML = "<h4>Daftar Tugas</h4>";
        snapshot.forEach(docSnap => {
            const t = docSnap.data();
            container.innerHTML += `
            <div class="card">
                <div><strong>${t.name}</strong> (${t.category})<br><small>${t.points} Poin</small></div>
                <div>
                    <button class="secondary" onclick="editData('tasks', '${docSnap.id}', '${t.name}', ${t.points}, '${t.category}')">Edit</button>
                    <button class="danger" onclick="deleteData('tasks', '${docSnap.id}')">X</button>
                </div>
            </div>`;
        });
    });

    onSnapshot(collection(db, "rewards"), (snapshot) => {
        const div = document.createElement("div");
        div.innerHTML = "<h4 style='margin-top:20px;'>Daftar Hadiah</h4>";
        snapshot.forEach(docSnap => {
            const r = docSnap.data();
            div.innerHTML += `
            <div class="card">
                <div><strong>${r.name}</strong> (${r.tier})<br><small>${r.points} Poin</small></div>
                <div>
                    <button class="secondary" onclick="editData('rewards', '${docSnap.id}', '${r.name}', ${r.points}, '${r.tier}')">Edit</button>
                    <button class="danger" onclick="deleteData('rewards', '${docSnap.id}')">X</button>
                </div>
            </div>`;
        });
        document.getElementById("admin-catalog-list").appendChild(div);
    });
}

window.addNewTask = async function() {
    const name = document.getElementById("new-task-name").value.trim();
    const points = parseInt(document.getElementById("new-task-points").value);
    const category = document.getElementById("new-task-category").value.trim() || "Lain-lain";
    if (name === "" || isNaN(points)) return alert("Isi data dengan benar.");
    await addDoc(collection(db, "tasks"), { name, points, category });
    document.getElementById("new-task-name").value = "";
    document.getElementById("new-task-points").value = "";
};

window.addNewReward = async function() {
    const name = document.getElementById("new-reward-name").value.trim();
    const points = parseInt(document.getElementById("new-reward-points").value);
    const tier = document.getElementById("new-reward-tier").value.trim() || "Lain-lain";
    if (name === "" || isNaN(points)) return alert("Isi data dengan benar.");
    await addDoc(collection(db, "rewards"), { name, points, tier });
    document.getElementById("new-reward-name").value = "";
    document.getElementById("new-reward-points").value = "";
};

window.editData = async function(collectionName, id, oldName, oldPoints, oldGroup) {
    const newName = prompt("Nama:", oldName);
    if (newName === null || newName.trim() === "") return;
    const newPoints = prompt("Poin:", oldPoints);
    if (newPoints === null || isNaN(newPoints)) return;
    const newGroup = prompt("Kategori/Tier:", oldGroup);
    
    const updateData = { name: newName.trim(), points: parseInt(newPoints) };
    if (collectionName === "tasks") updateData.category = newGroup || "Lain-lain";
    else updateData.tier = newGroup || "Lain-lain";

    await updateDoc(doc(db, collectionName, id), updateData);
};

window.deleteData = async function(collectionName, id) {
    if (confirm("Hapus item ini dari katalog?")) {
        await deleteDoc(doc(db, collectionName, id));
    }
};

initApp();
