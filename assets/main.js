//DOM Elements
const AddInput = document.querySelector(".addTask");
const control = document.querySelector(".todoControl");
const container = document.querySelector(".boxContainer");
const clearCompleted = document.querySelector(".clearCompleted");
const filterAll = document.querySelector(".filterAll");
const filterActive = document.querySelector(".filterActive");
const filterCompleted = document.querySelector(".filterCompleted");
const themeToggle = document.querySelector(".toggleTheme");
const addBtn = document.querySelector(".addBtn");
const addDeadline = document.querySelector(".addDeadline");
const sortBtn = document.querySelector(".sortBtn");

// state
let tasks = [];
let InputValue = "";
let currentFilter = "all"; // all | active | completed
let dragId = null;
let sortDir = localStorage.getItem("todoSortDir") || "newest"; // newest | oldest

// Initialize app
(function init() {
  loadTasks();
  filterAll.classList.add("active-filter");
  updateSortBtn();
  render();
  // refresh deadline colours (soon / overdue) every minute
  setInterval(() => {
    if (!dragId) render();
  }, 60000);
})();

// ── Storage helpers ──────────────────────────────────────────────
function loadTasks() {
  tasks = JSON.parse(localStorage.getItem("todoTasks") || "[]");
  tasks.forEach((t) => {
    if (t.deadline === undefined) t.deadline = null;
  });
}

function saveTasks() {
  localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── CRUD ─────────────────────────────────────────────────────────
function addTask() {
  if (!InputValue) return;
  const newTask = {
    _id: generateId(),
    title: InputValue,
    completed: false,
    deadline: addDeadline.value || null,
  };
  // "newest first": new task on top, "oldest first": new task at the bottom
  if (sortDir === "newest") tasks.unshift(newTask);
  else tasks.push(newTask);
  saveTasks();
  render();
}

function DeleteTask(id) {
  tasks = tasks.filter((t) => t._id !== id);
  saveTasks();
}

function markCompleted(id) {
  const task = tasks.find((t) => t._id === id);
  if (task) task.completed = !task.completed;
  saveTasks();
}

// ── Ordering helpers ─────────────────────────────────────────────
function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function render() {
  DisplayTasks(getVisibleTasks());
}

// Put the visible tasks in the given order, using the same "slots"
// they already occupy in the full list (so hidden tasks stay put).
function applyVisibleOrder(ids) {
  const set = new Set(ids);
  const slots = [];
  tasks.forEach((t, i) => {
    if (set.has(t._id)) slots.push(i);
  });
  const byId = Object.fromEntries(tasks.map((t) => [t._id, t]));
  ids.forEach((id, k) => {
    tasks[slots[k]] = byId[id];
  });
  saveTasks();
}

// Flip the order of ALL tasks (newest first <-> oldest first)
function toggleSort() {
  tasks.reverse();
  sortDir = sortDir === "newest" ? "oldest" : "newest";
  localStorage.setItem("todoSortDir", sortDir);
  saveTasks();
  updateSortBtn();
  render();
}

function updateSortBtn() {
  sortBtn.textContent =
    sortDir === "newest" ? "\u21C5 Newest first" : "\u21C5 Oldest first";
}

function setDeadline(id, value) {
  const task = tasks.find((t) => t._id === id);
  if (task) task.deadline = value || null;
  saveTasks();
  render();
}

function formatDeadline(value) {
  const d = new Date(value);
  const opts = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleString([], opts);
}

// ── UI Functions ─────────────────────────────────────────────────
function DisplayTasks(listOfTasks = tasks) {
  countRemainingTasks();

  // Remove currently displayed task elements
  container.querySelectorAll(".task").forEach((el) => el.remove());

  listOfTasks.forEach((task) => {
    let TaskElement = document.createElement("div");
    TaskElement.className = task.completed ? "task completed" : "task";
    TaskElement.setAttribute("data-id", task._id);
    TaskElement.draggable = true;

    let checkBox = document.createElement("input");
    checkBox.classList.add("checkAtTask");
    checkBox.type = "checkbox";
    checkBox.checked = task.completed;

    // title + deadline
    let body = document.createElement("div");
    body.classList.add("taskBody");

    let taskTitle = document.createElement("p");
    taskTitle.classList.add("taskTitle");
    if (task.completed) taskTitle.classList.add("checked");
    taskTitle.textContent = task.title;

    let wrap = document.createElement("div");
    wrap.classList.add("deadlineWrap");

    let deadlineEl = document.createElement("span");
    deadlineEl.classList.add("deadline");
    if (task.deadline) {
      let text = "\u{1F4C5} " + formatDeadline(task.deadline);
      const diff = new Date(task.deadline) - new Date();
      if (task.completed) {
        deadlineEl.classList.add("done");
      } else if (diff < 0) {
        deadlineEl.classList.add("overdue");
        text += " \u00B7 Overdue";
      } else if (diff < 24 * 60 * 60 * 1000) {
        deadlineEl.classList.add("soon");
      }
      deadlineEl.textContent = text;
    } else {
      deadlineEl.classList.add("empty");
      deadlineEl.textContent = "+ Add deadline";
    }

    let deadlineInput = document.createElement("input");
    deadlineInput.type = "datetime-local";
    deadlineInput.classList.add("deadlineInput");
    deadlineInput.value = task.deadline || "";
    deadlineInput.tabIndex = -1;

    wrap.append(deadlineEl, deadlineInput);
    body.append(taskTitle, wrap);

    // delete
    let actions = document.createElement("div");
    actions.classList.add("taskActions");

    let DeleteIcon = document.createElement("img");
    DeleteIcon.classList.add("deleteIcon");
    DeleteIcon.src = "./images/icon-cross.svg";
    DeleteIcon.alt = "delete";

    actions.append(DeleteIcon);

    TaskElement.append(checkBox, body, actions);
    container.insertBefore(TaskElement, control);
  });
}

function countRemainingTasks() {
  document.querySelector(".remainTasKsCount")?.remove();
  const remaining = tasks.filter((t) => !t.completed).length;
  const remainEl = document.createElement("p");
  remainEl.classList.add("remainTasKsCount");
  remainEl.textContent = `${remaining} items left`;
  document
    .querySelector(".todoControl")
    .insertBefore(remainEl, document.querySelector(".filterTasks"));
}

function animateButton(btn) {
  btn.classList.add("btn-press");
  setTimeout(() => btn.classList.remove("btn-press"), 200);
}

function handleAddTask() {
  if (InputValue) {
    addTask();
    InputValue = "";
    AddInput.value = "";
    addDeadline.value = "";
    animateButton(addBtn);
  }
}

// ── Event Listeners ──────────────────────────────────────────────
AddInput.addEventListener("input", () => {
  InputValue = AddInput.value.trim();
});

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleAddTask();
});

addBtn.addEventListener("click", handleAddTask);

container.addEventListener("click", (e) => {
  const parent = e.target.closest(".task");
  if (!parent) return;
  const id = parent.getAttribute("data-id");

  if (e.target.classList.contains("deleteIcon")) {
    DeleteTask(id);
    render();
  }

  if (e.target.classList.contains("checkAtTask")) {
    markCompleted(id);
    render();
  }

  if (e.target.classList.contains("deadline")) {
    const input = parent.querySelector(".deadlineInput");
    if (input.showPicker) input.showPicker();
    else input.focus();
  }
});

container.addEventListener("change", (e) => {
  if (!e.target.classList.contains("deadlineInput")) return;
  const parent = e.target.closest(".task");
  setDeadline(parent.getAttribute("data-id"), e.target.value);
});

// ── Drag & Drop ──────────────────────────────────────────────────
container.addEventListener("dragstart", (e) => {
  const t = e.target.closest ? e.target.closest(".task") : null;
  if (!t) return;
  dragId = t.getAttribute("data-id");
  t.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragId);
});

container.addEventListener("dragover", (e) => {
  if (!dragId) return;
  e.preventDefault();
  const over = e.target.closest(".task");
  const dragging = container.querySelector(".task.dragging");
  if (!over || !dragging || over === dragging) return;
  const rect = over.getBoundingClientRect();
  const after = e.clientY > rect.top + rect.height / 2;
  container.insertBefore(dragging, after ? over.nextSibling : over);
});

container.addEventListener("drop", (e) => {
  if (dragId) e.preventDefault();
});

container.addEventListener("dragend", () => {
  if (!dragId) return;
  const ids = [...container.querySelectorAll(".task")].map((el) =>
    el.getAttribute("data-id")
  );
  dragId = null;
  applyVisibleOrder(ids);
  render();
});

sortBtn.addEventListener("click", toggleSort);

clearCompleted.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.completed);
  saveTasks();
  render();
});

// ── Filters ──────────────────────────────────────────────────────
filterAll.addEventListener("click", () => {
  currentFilter = "all";
  setActiveFilter(filterAll);
  render();
});

filterActive.addEventListener("click", () => {
  currentFilter = "active";
  setActiveFilter(filterActive);
  render();
});

filterCompleted.addEventListener("click", () => {
  currentFilter = "completed";
  setActiveFilter(filterCompleted);
  render();
});

function setActiveFilter(activeEl) {
  [filterAll, filterActive, filterCompleted].forEach((el) =>
    el.classList.remove("active-filter")
  );
  activeEl.classList.add("active-filter");
}

// ── Theme Toggle ─────────────────────────────────────────────────
themeToggle.addEventListener("click", function () {
  document.body.classList.toggle("light-mode");
  const icon = document.getElementById("theme-icon");
  const topBg = document.getElementById("topBg");

  if (document.body.classList.contains("light-mode")) {
    icon.src = "./images/icon-moon.svg";
    topBg.classList.replace("bgDark", "bgLight");
    addBtn.classList.replace("btnDark", "btnLight");
  } else {
    icon.src = "./images/icon-sun.svg";
    topBg.classList.replace("bgLight", "bgDark");
    addBtn.classList.replace("btnLight", "btnDark");
  }
});
