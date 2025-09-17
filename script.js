// Новый script.js с хранением всех данных на сервере

const API_URL = "https://e-diary-backend-hu2c.onrender.com/data.json";

let data = {
  users: {},
  visits: {}
};

let currentUser = "";
let currentRole = "";

async function loadData() {
  const res = await fetch(API_URL);
  data = await res.json();
}

async function saveData() {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

function login() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;
  const user = data.users[login];
  const errorBox = document.getElementById("loginError");

  if (!user || user.password !== password) {
    errorBox.textContent = "Неверный логин или пароль";
    return;
  }

  currentUser = login;
  currentRole = user.role;
  localStorage.setItem("currentUser", login);
  showApp();
}

function showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  const user = data.users[currentUser];
  const isAdmin = user.role === "admin";
  const isSuper = user.role === "superadmin";

  document.getElementById("userTitle").textContent =
    isSuper ? "Добро пожаловать, супер-админ" :
    isAdmin ? "Добро пожаловать, воспитатель" :
    `Дневник: ${user.name}`;

  if (isAdmin || isSuper) {
    const selector = document.getElementById("selectChild");
    selector.innerHTML = "";
    for (let key in data.users) {
      if (data.users[key].role === "parent") {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = data.users[key].name;
        selector.appendChild(opt);
      }
    }
    document.getElementById("childSelector").classList.remove("hidden");
    selector.onchange = () => renderChild(selector.value, true);
    selector.dispatchEvent(new Event("change"));

    if (isSuper) {
      document.getElementById("userManagement").classList.remove("hidden");
      renderUserList();
    }
  } else {
    document.getElementById("childSelector").classList.add("hidden");
    renderChild(currentUser, false);
  }
}

function renderChild(login, editable) {
  const user = data.users[login];
  document.getElementById("childCard").classList.remove("hidden");
  document.getElementById("childName").textContent = user.name;
  document.getElementById("childSurname").textContent = user.surname || "-";
  document.getElementById("childPatronymic").textContent = user.patronymic || "-";
  document.getElementById("childDOB").textContent = user.dob || "-";
  document.getElementById("adminForm").classList.toggle("hidden", !editable);
  document.getElementById("editChildBtn").classList.toggle("hidden", !editable);

  const form = document.getElementById("visitForm");
  form.onsubmit = async function(e) {
    e.preventDefault();
    const date = document.getElementById("visitDate").value;
    const grades = [
      document.getElementById("gradeVisit").checked ? 1 : 0,
      document.getElementById("gradeActivity").checked ? 1 : 0,
      document.getElementById("gradeBehavior").checked ? 1 : 0,
      document.getElementById("gradePoem").checked ? 1 : 0
    ];
    const sum = grades.reduce((a, b) => a + b, 0);
    const gradesText = `x${sum}: посещение: ${grades[0]}, активность: ${grades[1]}, поведение: ${grades[2]}, стих: ${grades[3]}`;
    const addedAt = new Date().toLocaleString();

    if (!data.visits[login]) data.visits[login] = [];
    data.visits[login].push({ date, grades: gradesText, addedAt });
    await saveData();
    renderVisits(login);
    form.reset();
  };

  renderVisits(login);
}

function renderVisits(login) {
  const thead = document.querySelector("#visitsTable thead");
  const tbody = document.querySelector("#visitsTable tbody");
  thead.innerHTML = "<tr><th>Дата</th><th>Оценки</th><th>Внесено</th><th></th></tr>";
  tbody.innerHTML = "";
  let total = 0;
  const visits = data.visits[login] || [];
  visits.forEach((v, i) => {
    const row = document.createElement("tr");
    const del = (currentRole === "superadmin") ? `<td><button onclick=\"deleteVisit('${login}',${i})\">✖</button></td>` : "<td></td>";
    const numbers = v.grades.match(/\d+/g)?.map(Number) || [];
    const sum = numbers.slice(-4).reduce((s, n) => s + n, 0);
    total += sum;
    row.innerHTML = `
      <td>${v.date}</td>
      <td>${v.grades}</td>
      <td>${v.addedAt || "-"}</td>
      ${del}`;
    tbody.appendChild(row);
  });
  const summary = document.createElement("tr");
  summary.innerHTML = `<td colspan="4"><strong>Сумма всех баллов: ${total}</strong></td>`;
  tbody.appendChild(summary);
  document.getElementById("childScore").textContent = total;
}

async function deleteVisit(login, index) {
  if (!confirm("Удалить эту запись?")) return;
  data.visits[login].splice(index, 1);
  await saveData();
  renderVisits(login);
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

window.onload = async () => {
  await loadData();
  const saved = localStorage.getItem("currentUser");
  if (saved && data.users[saved]) {
    currentUser = saved;
    currentRole = data.users[saved].role;
    showApp();
  }
};
