// Local Storage keys used to persist tasks, filter state, and theme.
const STORAGE_KEY = "task-tracker.tasks";
const FILTER_KEY = "task-tracker.filter";
const THEME_KEY = "task-tracker.theme";

// Available filter states.
const FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

// Cached DOM elements to avoid repeated lookups.
const elements = {
  form: document.getElementById("task-form"),
  title: document.getElementById("task-title"),
  description: document.getElementById("task-desc"),
  dueDate: document.getElementById("task-due"),
  list: document.getElementById("tasks"),
  empty: document.getElementById("empty"),
  clearCompleted: document.getElementById("clear-completed"),
  filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
  themeToggle: document.getElementById("theme-toggle"),
};

let currentFilter = loadFilter();

// Storage helpers 

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn("Failed to load tasks:", error);
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadFilter() {
  const raw = localStorage.getItem(FILTER_KEY);
  if (raw === FILTERS.ACTIVE || raw === FILTERS.COMPLETED) return raw;
  return FILTERS.ALL;
}

function saveFilter(value) {
  localStorage.setItem(FILTER_KEY, value);
}

// UI Updaters

function updateFilterUI() {
  elements.filterButtons.forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function filterTasks(tasks) {
  if (currentFilter === FILTERS.ACTIVE) return tasks.filter((t) => !t.completed);
  if (currentFilter === FILTERS.COMPLETED) return tasks.filter((t) => t.completed);
  return tasks;
}

function createTaskMarkup(task) {
  const item = document.createElement("li");
  item.className = "task-item";
  if (task.completed) item.classList.add("done");
  item.dataset.id = task.id;
  item.draggable = true;

  // Drag and Drop events
  item.addEventListener('dragstart', (e) => {
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
  });

  const checkbox = document.createElement("button");
  checkbox.setAttribute("type", "button");
  checkbox.className = "small-btn";
  checkbox.setAttribute("aria-label", task.completed ? "Mark task as pending" : "Mark task as done");
  checkbox.innerHTML = task.completed ? "✔" : "○";
  checkbox.addEventListener("click", () => toggleTaskDone(task.id));

  const main = document.createElement("div");
  main.className = "task-main";

  // Data display elements
  const dataView = document.createElement("div");
  
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const desc = document.createElement("p");
  desc.className = "task-desc";
  desc.textContent = task.description || "";

  dataView.append(title);
  if (task.description) dataView.append(desc);
  
  if (task.dueDate) {
    const due = document.createElement("span");
    due.className = "task-due";
    due.textContent = `Due: ${new Date(task.dueDate).toLocaleDateString()}`;
    dataView.append(due);
  }

  // Edit inline elements
  const editView = document.createElement("div");
  editView.style.display = "none";
  editView.className = "edit-view";
  
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.className = "edit-title";
  titleInput.value = task.title;
  
  const descInput = document.createElement("textarea");
  descInput.className = "edit-desc";
  descInput.value = task.description || "";
  
  const dueDateInput = document.createElement("input");
  dueDateInput.type = "date";
  dueDateInput.style.marginBottom = "0.25rem"
  dueDateInput.style.padding = "0.5rem"
  dueDateInput.value = task.dueDate || "";
  
  const editActions = document.createElement("div");
  editActions.className = "edit-actions";
  
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "primary";
  saveBtn.textContent = "Save";
  saveBtn.style.padding = "0.4rem 0.8rem";
  saveBtn.style.fontSize = "0.8rem";
  saveBtn.addEventListener("click", () => {
    saveTaskEdits(task.id, titleInput.value, descInput.value, dueDateInput.value);
  });
  
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "secondary";
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.padding = "0.4rem 0.8rem";
  cancelBtn.style.fontSize = "0.8rem";
  cancelBtn.addEventListener("click", () => {
    editView.style.display = "none";
    dataView.style.display = "block";
    actions.style.display = "flex";
    item.draggable = true;
  });

  editActions.append(saveBtn, cancelBtn);
  editView.append(titleInput, descInput, dueDateInput, editActions);
  
  main.append(dataView, editView);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "small-btn";
  editBtn.title = "Edit task";
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", () => {
    dataView.style.display = "none";
    actions.style.display = "none";
    editView.style.display = "block";
    item.draggable = false;
    titleInput.focus();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "small-btn";
  deleteBtn.title = "Delete task";
  deleteBtn.textContent = "🗑";
  deleteBtn.addEventListener("click", () => {
    if (!confirm("Delete this task?")) return;
    item.classList.add('removing');
    item.addEventListener('animationend', () => deleteTask(task.id));
  });

  actions.append(editBtn, deleteBtn);

  item.append(checkbox, main, actions);
  return item;
}

function updateClearCompletedButton(tasks) {
  const hasCompleted = tasks.some((t) => t.completed);
  elements.clearCompleted.disabled = !hasCompleted;
  elements.clearCompleted.classList.toggle("disabled", !hasCompleted);
}

function renderTasks() {
  const tasks = loadTasks();
  const visibleTasks = filterTasks(tasks);

  elements.list.innerHTML = "";
  updateFilterUI();
  updateClearCompletedButton(tasks);

  if (tasks.length === 0) {
    elements.empty.textContent = "No tasks yet — add one above!";
    elements.empty.style.display = "block";
    return;
  }

  if (visibleTasks.length === 0) {
    const message =
      currentFilter === FILTERS.COMPLETED
        ? "No completed tasks yet — try a different filter."
        : "No active tasks yet — try a different filter.";
    elements.empty.textContent = message;
    elements.empty.style.display = "block";
    return;
  }

  elements.empty.style.display = "none";
  // Directly append for drag/drop persistence (removes default sort order override)
  visibleTasks.forEach((task) => {
    elements.list.appendChild(createTaskMarkup(task));
  });
}

function getNextId(tasks) {
  const maxId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
  return maxId + 1;
}

function addTask(event) {
  event.preventDefault();

  const title = elements.title.value.trim();
  const description = elements.description.value.trim();
  const dueDate = elements.dueDate.value;
  if (!title) return;

  const tasks = loadTasks();
  const newTask = {
    id: getNextId(tasks),
    title,
    description,
    dueDate,
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  tasks.unshift(newTask); // Add new task to top of list
  saveTasks(tasks);
  renderTasks();
  elements.form.reset();
  elements.title.focus();
}

function toggleTaskDone(id) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.updatedAt = Date.now();
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function saveTaskEdits(id, newTitle, newDesc, newDueDate) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const trimmed = newTitle.trim();
  if (!trimmed) {
    alert("Task title cannot be empty.");
    return;
  }

  task.title = trimmed;
  task.description = newDesc.trim();
  task.dueDate = newDueDate;
  task.updatedAt = Date.now();
  
  saveTasks(tasks);
  renderTasks();
}

function setFilter(filter) {
  if (![FILTERS.ALL, FILTERS.ACTIVE, FILTERS.COMPLETED].includes(filter)) {
    filter = FILTERS.ALL;
  }

  currentFilter = filter;
  saveFilter(filter);
  renderTasks();
}

function clearCompleted() {
  const tasks = loadTasks();
  const hasDone = tasks.some((t) => t.completed);
  if (!hasDone) {
    alert("No completed tasks to clear.");
    return;
  }

  if (!confirm("Remove all completed tasks?")) return;
  saveTasks(tasks.filter((t) => !t.completed));
  renderTasks();
}

// Drag & Drop handling on list container
function handleDragOver(e) {
  e.preventDefault();
  const draggingItem = elements.list.querySelector('.dragging');
  if (!draggingItem) return;
  
  const siblings = [...elements.list.querySelectorAll('.task-item:not(.dragging)')];
  let nextSibling = siblings.find(sibling => {
    return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
  });
  
  if (nextSibling) {
    elements.list.insertBefore(draggingItem, nextSibling);
  } else {
    elements.list.appendChild(draggingItem);
  }
}

function handleDrop(e) {
  e.preventDefault();
  const draggingItem = elements.list.querySelector('.dragging');
  if (!draggingItem) return;
  
  // Reorder tasks array based on new DOM order mapping
  const currentDOMIds = [...elements.list.querySelectorAll('.task-item')].map(item => Number(item.dataset.id));
  
  const allTasks = loadTasks();
  let newOrderedTasks = [];
  
  currentDOMIds.forEach(id => {
    const task = allTasks.find(t => t.id === id);
    if(task) {
      newOrderedTasks.push(task);
      const i = allTasks.findIndex(t => t.id === id);
      allTasks.splice(i, 1);
    }
  });

  // Append remaining (e.g., currently filtered out) tasks so they aren't lost
  const finalizedList = [...newOrderedTasks, ...allTasks];
  saveTasks(finalizedList);
}

// Theme Handling
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  elements.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.textContent = '☀️';
  } else {
    elements.themeToggle.textContent = '🌙';
  }
}

function init() {
  initTheme();
  
  elements.form.addEventListener("submit", addTask);
  elements.clearCompleted.addEventListener("click", clearCompleted);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  elements.list.addEventListener('dragover', handleDragOver);
  elements.list.addEventListener('drop', handleDrop);

  renderTasks();
}

init();
