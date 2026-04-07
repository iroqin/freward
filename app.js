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
    onSnapshot(doc(db, "users", currentUser.id), (doc) => {
        if(doc.exists()) document.getElementById("user-points").innerText = doc.data().points;
    });
}

async function loadMemberTasksAndRewards() {
    // Memuat Tugas berdasar Kategori (Accordion)
    const taskContainer = document.getElementById("tasks-list");
    taskContainer.innerHTML = "Memuat...";
    
    onSnapshot(collection(db, "tasks"), (snapshot) => {
        const tasks = [];
        snapshot.forEach(doc => tasks.push({id: doc.id, ...doc.data()}));
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

    // Memuat Hadiah berdasar Tier (Accordion)
    const rewardContainer = document.getElementById("rewards-list");
    rewardContainer.innerHTML = "Memuat...";
    
    onSnapshot(collection(db, "rewards"), (snapshot) => {
        const rewards = [];
        snapshot.forEach(doc => rewards.push({id: doc.id, ...doc.data()}));
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
    // Gunakan onSnapshot agar langsung terbarui saat diedit
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
