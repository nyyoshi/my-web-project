const list = document.getElementById("list");
const todayHeader = document.getElementById("today");
const yearMonth = document.getElementById("yearMonth");
const editButton = document.getElementById("editButton");
const listScreen = document.getElementById("listScreen");
const editorScreen = document.getElementById("editorScreen");
const editorHeader = document.getElementById("editorHeader");
const textInput = document.getElementById("textInput");
const counter = document.getElementById("counter");
const maxLength = textInput.maxLength;
const saveButton = document.getElementById("saveButton");
const backButton = document.getElementById("backButton");

let date = new Date();
let viewingMonth = date.getMonth();
let viewingYear = date.getFullYear();
let currentEditKey = "";

// ファイル保存用データ
let diaryData = {}; // key: 'YYYY-MM-DD', value: text
const diaryFileName = "diary.json";

function pad(n) {
  return n.toString().padStart(2, "0");
}

// ==============================
// ファイル操作関数
// ==============================
async function saveToFile() {
  // Androidの場合 Cordova/Capacitor の Filesystem API 使用想定
  const dataStr = JSON.stringify(diaryData);
  try {
    const fileEntry = await new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        cordova.file.dataDirectory,
        (dirEntry) => {
          dirEntry.getFile(diaryFileName, { create: true }, resolve, reject);
        },
        reject,
      );
    });

    await new Promise((resolve, reject) => {
      fileEntry.createWriter((fileWriter) => {
        fileWriter.onwriteend = resolve;
        fileWriter.onerror = reject;
        const blob = new Blob([dataStr], { type: "application/json" });
        fileWriter.write(blob);
      }, reject);
    });

    console.log("ファイル保存完了");
  } catch (err) {
    console.error("ファイル保存失敗:", err);
  }
}

async function loadFromFile() {
  try {
    const fileEntry = await new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(
        cordova.file.dataDirectory,
        (dirEntry) => {
          dirEntry.getFile(diaryFileName, {}, resolve, reject);
        },
        reject,
      );
    });

    const text = await new Promise((resolve, reject) => {
      fileEntry.file((file) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      }, reject);
    });

    diaryData = JSON.parse(text || "{}");
    console.log("ファイル読み込み完了");
  } catch (err) {
    console.warn("ファイルが存在しないか読み込み失敗:", err);
    diaryData = {};
  }
}
// ==============================
// データ更新関数
// ==============================
function saveDiary(key, value) {
  diaryData[key] = value;
  saveToFile(); // ファイルに保存
}

function updateToday() {
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const d = new Date();

  todayHeader.textContent = `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(
    d.getDate(),
  )} (${dayNames[d.getDay()]})`;
}

function renderList() {
  list.innerHTML = "";
  yearMonth.textContent = `${viewingYear}年 ${viewingMonth + 1}月`;
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const lastDay = new Date(viewingYear, viewingMonth + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(viewingYear, viewingMonth, day);
    const key = `${viewingYear}-${pad(viewingMonth + 1)}-${pad(day)}`;
    const text = diaryData[key] || "";
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
  currentEditKey = key;
  const parts = key.split("-");
  const headerContent = editorHeader.querySelector(".headerContent");
  headerContent.textContent = `${parts[0]}/${parts[1]}/${parts[2]}`;
  textInput.value = diaryData[key] || "";
  listScreen.style.display = "none";
  editorScreen.style.display = "block";

  // 編集画面を開いたら残り文字数も更新
  const remaining = maxLength - textInput.value.length;
  counter.textContent = ` ${remaining} `;
}

// ==============================
// UIイベント
// ==============================

editButton.onclick = () => {
  const d = new Date();
  const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  openEditor(key);
};

saveButton.onclick = async () => {
  if (currentEditKey) {
    diaryData[currentEditKey] = textInput.value;
    await saveToFile(); // Android ファイルに保存
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

counter.textContent = `残り ${maxLength} 文字`;

textInput.addEventListener("input", () => {
  let remaining = maxLength - textInput.value.length;
  if (remaining < 0) {
    remaining = 0; // 0未満にならないようにする
  }
  counter.textContent = ` ${remaining} `;
});

// ==============================
// スワイプ操作関数
// ==============================

let startX = 0;

const threshold = Math.max(window.innerWidth * 0.1, 30);

list.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

list.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;

  if (diff > threshold) {
    // 左スワイプ：次の月
    viewingMonth++;
    if (viewingMonth > 11) {
      viewingMonth = 0;
      viewingYear++;
    }
    renderList();
  } else if (diff < -threshold) {
    // 右スワイプ：前の月
    viewingMonth--;
    if (viewingMonth < 0) {
      viewingMonth = 11;
      viewingYear--;
    }
    renderList();
  }
});

// ==============================
// 起動時処理（Cordova/Capacitor用）
// ==============================
document.addEventListener("deviceready", async () => {
  await loadFromFile();
  updateToday();
  renderList();
});
