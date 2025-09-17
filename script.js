// Замените API_URL на адрес вашего Replit
const API_URL = "https://acckids-parkandrei.replit.app/data.json"; 

let currentUser = null;
let currentRole = null;
let allData = { users: {}, visits: {} };

// Загрузка данных
async function loadData() {
  const res = await fetch(API_URL);
  allData = await res.json();
}

// Сохранение данных
async function saveData() {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allData)
  });
}

// Вход
async function login() {
  await loadData();
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();

  if (allData.users[u] && allData.users[u].password === p) {
    currentUser = u;
    currentRole = allData.users[u].role;
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("diary-screen").style.display = "block";
    document.getElementById("welcome").innerText = "Здравствуйте, " + allData.users[u].name;
    if (currentRole === "admin" || currentRole === "superadmin") {
      document.getElementById("admin-panel").style.display = "block";
    }
    renderVisits();
  } else {
    document.getElementById("login-error").innerText = "Неверный логин или пароль!";
  }
}

// Выход
function logout() {
  currentUser = null;
  document.getElementById("diary-screen").style.display = "none";
  document.getElementById("login-screen").style.display = "block";
}

// Добавление посещения
async function addVisit() {
  const now = new Date().toLocaleString();
  const v = {
    date: now,
    посещение: parseInt(document.getElementById("visit").value || 0),
    активность: parseInt(document.getElementById("activity").value || 0),
    поведение: parseInt(document.getElementById("behavior").value || 0),
    стих: parseInt(document.getElementById("poem").value || 0)
  };

  if (!allData.visits[currentUser]) allData.visits[currentUser] = [];
  allData.visits[currentUser].push(v);
  await saveData();
  renderVisits();
}

// Отображение
function renderVisits() {
  const container = document.getElementById("visits");
  container.innerHTML = "<h3>Журнал посещений</h3>";
  const visits = allData.visits[currentUser] || [];
  visits.forEach(v => {
    const sum = v.посещение + v.активность + v.поведение + v.стих;
    container.innerHTML += `
      <div class="visit-entry">
        <b>${v.date}</b><br>
        Посещение: ${v.посещение}, Активность: ${v.активность}, Поведение: ${v.поведение}, Стих: ${v.стих}<br>
        Сумма: ${sum}
      </div>`;
  });
}