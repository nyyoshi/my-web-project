const list = document.getElementById("list");
const todayHeader = document.getElementById("today");
const monthLabel = document.getElementById("monthLabel");
const editButton = document.getElementById("editButton");
const listScreen = document.getElementById("listScreen");
const editorScreen = document.getElementById("editorScreen");
const editorHeader = document.getElementById("editorHeader");
const textInput = document.getElementById("textInput");
const saveButton = document.getElementById("saveButton");
const backButton = document.getElementById("backButton");

let date = new Date();
let viewingMonth = date.getMonth();
let viewingYear = date.getFullYear();
let currentEditKey = "";

function pad(n) {
  return n.toString().padStart(2, "0");
}

function updateToday() {
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const d = new Date();

  todayHeader.textContent = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(
    d.getDate()
  )} (${dayNames[d.getDay()]})`;
}

function renderList() {
  list.innerHTML = "";
  monthLabel.textContent = `${viewingYear}年 ${viewingMonth + 1}月`;
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const lastDay = new Date(viewingYear, viewingMonth + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(viewingYear, viewingMonth, day);
    const key = `${viewingYear}-${pad(viewingMonth + 1)}-${pad(day)}`;
    const text = localStorage.getItem(key) || "";
    const entry = document.createElement("div");
    entry.className = "day-entry";
    const label = document.createElement("div");
    label.className = "day-label";
    // 日付と曜日を別々のdivにする
    const dayNumber = document.createElement("div");
    dayNumber.textContent = pad(day);

    const dayName = document.createElement("div");
    dayName.textContent = dayNames[d.getDay()];

    // 土日で色分け
    if (d.getDay() === 0) {
      // 日曜
      dayNumber.classList.add("sunday");
      dayName.classList.add("sunday");
    } else if (d.getDay() === 6) {
      // 土曜
      dayNumber.classList.add("saturday");
      dayName.classList.add("saturday");
    }

    label.appendChild(dayNumber);
    label.appendChild(dayName);
    const textSpace = document.createElement("div");
    textSpace.className = "text-space";
    textSpace.textContent = text;
    textSpace.onclick = () => openEditor(key);
    entry.appendChild(label);
    entry.appendChild(textSpace);
    list.appendChild(entry);
  }
}

function openEditor(key) {
  console.log("openEditor called with key:", key);
  currentEditKey = key;
  const parts = key.split("-");
  editorHeader.textContent = `${parts[0]}/${parts[1]}/${parts[2]}`;
  textInput.value = localStorage.getItem(key) || "";
  listScreen.style.display = "none";
  editorScreen.style.display = "block";
}

editButton.onclick = () => {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  openEditor(key);
};

saveButton.onclick = () => {
  if (currentEditKey) {
    localStorage.setItem(currentEditKey, textInput.value);
    renderList();
  }
  listScreen.style.display = "block";
  editorScreen.style.display = "none";
};

backButton.onclick = () => {
  listScreen.style.display = "block";
  editorScreen.style.display = "none";
};

updateToday();
renderList();

let startX = 0;

list.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

list.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (diff > 50) {
    // 左スワイプ：次の月
    viewingMonth++;
    if (viewingMonth > 11) {
      viewingMonth = 0;
      viewingYear++;
    }
    renderList();
  } else if (diff < -50) {
    // 右スワイプ：前の月
    viewingMonth--;
    if (viewingMonth < 0) {
      viewingMonth = 11;
      viewingYear--;
    }
    renderList();
  }
});

document.getElementById("prevMonth").addEventListener("click", () => {
  viewingMonth--;
  if (viewingMonth < 0) {
    viewingMonth = 11;
    viewingYear--;
  }
  renderList();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  viewingMonth++;
  if (viewingMonth > 11) {
    viewingMonth = 0;
    viewingYear++;
  }
  renderList();
});
