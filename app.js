import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, updateDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// Data Awal
const initialUsers = [
    { id: "u1", name: "Ayah Qori", role: "admin", pin: "1111", points: 0 },
    { id: "u2", name: "Ibu Ririn", role: "admin", pin: "2222", points: 0 },
    { id: "u3", name: "Zafira", role: "member", pin: "3333", points: 0 },
    { id: "u4", name: "Kaivan", role: "member", pin: "4444", points: 0 }
];

const initialTasks = [
    { id: "t1", name: "Rapikan tempat tidur", points: 5 },
    { id: "t2", name: "Cuci piring keluarga", points: 15 },
    { id: "t3", name: "Mengerjakan PR", points: 15 }
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
        alert("Database diinisialisasi. Silakan muat ulang halaman.");
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
    const taskContainer = document.getElementById("tasks-list");
    taskContainer.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "tasks"));
    
    querySnapshot.forEach((docSnap) => {
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
    onSnapshot(userRef, async (userDoc) => {
        const currentPoints = userDoc.data().points;
        await updateDoc(userRef, { points: currentPoints + points });
    }, { once: true });
};

// Jalankan saat halaman dimuat
initApp();