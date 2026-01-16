import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, remove, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  databaseURL: "SUA_DATABASE_URL",
  projectId: "SEU_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

const sounds = {
  complete: new Audio("sounds/complete.mp3"),
  reward: new Audio("sounds/reward.mp3"),
  levelup: new Audio("sounds/levelup.mp3"),
};

let uid;

function today() {
  return new Date().toISOString().split("T")[0];
}

/* 🔁 RESET AUTOMÁTICO */
async function checkReset() {
  const dateRef = ref(db, `users/${uid}/lastDate`);
  const snap = await get(dateRef);

  if (!snap.exists() || snap.val() !== today()) {
    await remove(ref(db, `users/${uid}/completedToday`));
    await set(dateRef, today());
  }
}

/* 🔐 LOGIN */
window.login = async () => {
  await signInWithEmailAndPassword(auth, email.value, password.value);
};

window.register = async () => {
  await createUserWithEmailAndPassword(auth, email.value, password.value);
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (user) {
    uid = user.uid;
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    await checkReset();
    loadMissions();
    loadStats();
  }
});

/* 📋 MISSÕES */
async function loadMissions() {
  const area = document.getElementById("missions");
  area.innerHTML = "";

  const snap = await get(ref(db, `users/${uid}/missions`));
  snap.forEach(m => {
    const div = document.createElement("div");
    div.className = "mission";
    div.innerHTML = `
      <strong>${m.val().name}</strong><br>
      <button onclick="completeMission('${m.key}', ${m.val().points})">
        Concluir
      </button>
    `;
    area.appendChild(div);
  });
}

window.completeMission = async (id, points) => {
  sounds.complete.play();

  await push(ref(db, `users/${uid}/history/${today()}`), true);
  await remove(ref(db, `users/${uid}/missions/${id}`));

  const statsRef = ref(db, `users/${uid}/stats`);
  const snap = await get(statsRef);
  const data = snap.val() || { points: 0, level: 1 };

  data.points += points;

  if (data.points >= data.level * 1000) {
    data.level++;
    sounds.levelup.play();
  }

  await set(statsRef, data);
  loadMissions();
  loadStats();
};

/* 📊 STATS */
async function loadStats() {
  const snap = await get(ref(db, `users/${uid}/stats`));
  const data = snap.val() || { points: 0, level: 1 };

  document.getElementById("points").innerText = data.points;
  document.getElementById("level").innerText = data.level;
}
