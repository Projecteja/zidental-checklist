/* ============================================================
   ZIDENTAL CLINIC — DAILY CHECKLIST
   script.js
   Vanilla JS, LocalStorage only, no dependencies.
   ============================================================ */

/* ------------------------------------------------------------
   0. CONSTANTS
   ------------------------------------------------------------ */
const LS_KEYS = {
  templates: 'task_templates',
  records: 'daily_records',
  logs: 'activity_logs',
  settings: 'clinic_settings',
  staff: 'clinic_users',
  session: 'clinic_session',
};

const CATEGORIES = ['Opening', 'Reception', 'Assistant', 'Operational', 'Closing'];
const ASSIGNEES = ['Reception', 'Dental Assistant', 'Head of Clinic', 'Admin', 'All Staff'];
const ROLES = ['Head of Clinic', 'Reception', 'Dental Assistant', 'Admin'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const BRANCHES = ['Karawaci', 'Ciledug', 'Bekasi', 'Pamulang'];

// Roles allowed to manage access (add/edit/remove staff accounts & roles) and manage tasks.
const ADMIN_ROLES = ['Head of Clinic'];

const DEFAULT_SETTINGS = {
  clinicName: 'Zidental Clinic',
  branch: 'Karawaci',
};

// Staff directory now doubles as the account/login list.
// Each entry: { id, name, role, username, password }
// NOTE: this is a client-only demo login (no server), password is stored
// locally for personalization/access-gating, not real security.
const DEFAULT_STAFF = [
  { id: 'usr_dhimas', name: 'Dhimas', role: 'Head of Clinic', username: 'dhimas', password: 'admin123' },
  { id: 'usr_meli', name: 'Meli', role: 'Reception', username: 'meli', password: 'meli123' },
  { id: 'usr_widia', name: 'Widia', role: 'Dental Assistant', username: 'widia', password: 'widia123' },
  { id: 'usr_rani', name: 'Rani', role: 'Admin', username: 'rani', password: 'rani123' },
];

const DEFAULT_TEMPLATES = [
  { title: 'Nyalakan seluruh lampu klinik', category: 'Opening', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: '07:45' },
  { title: 'Nyalakan AC ruangan', category: 'Opening', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: '07:45' },
  { title: 'Cek kebersihan area reception', category: 'Opening', priority: 'High', assignedTo: 'Reception', required: true, dueTime: '08:00' },
  { title: 'Cek kesiapan ruang tunggu', category: 'Opening', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: null },
  { title: 'Cek kesiapan dental unit', category: 'Opening', priority: 'High', assignedTo: 'Dental Assistant', required: true, dueTime: '08:00' },

  { title: 'Cek pesan WhatsApp masuk', category: 'Reception', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: null },
  { title: 'Cek jadwal appointment hari ini', category: 'Reception', priority: 'High', assignedTo: 'Reception', required: true, dueTime: '08:30' },
  { title: 'Cek jadwal dokter jaga', category: 'Reception', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: null },
  { title: 'Cek rekap pembayaran kemarin', category: 'Reception', priority: 'Low', assignedTo: 'Admin', required: false, dueTime: null },
  { title: 'Cek Google Review baru', category: 'Reception', priority: 'Low', assignedTo: 'Reception', required: false, dueTime: null },

  { title: 'Cek kelengkapan instrument', category: 'Assistant', priority: 'High', assignedTo: 'Dental Assistant', required: true, dueTime: '08:15' },
  { title: 'Cek proses sterilisasi alat', category: 'Assistant', priority: 'High', assignedTo: 'Dental Assistant', required: true, dueTime: '08:15' },
  { title: 'Cek fungsi dental unit', category: 'Assistant', priority: 'High', assignedTo: 'Dental Assistant', required: true, dueTime: null },
  { title: 'Cek suction & kompresor', category: 'Assistant', priority: 'Medium', assignedTo: 'Dental Assistant', required: true, dueTime: null },
  { title: 'Cek stok consumables tindakan', category: 'Assistant', priority: 'Medium', assignedTo: 'Dental Assistant', required: true, dueTime: null },

  { title: 'Cek stok kebutuhan pasien', category: 'Operational', priority: 'Medium', assignedTo: 'All Staff', required: true, dueTime: null },
  { title: 'Cek kebersihan seluruh ruangan', category: 'Operational', priority: 'Medium', assignedTo: 'All Staff', required: true, dueTime: null },
  { title: 'Cek kondisi equipment umum', category: 'Operational', priority: 'Medium', assignedTo: 'Admin', required: true, dueTime: null },
  { title: 'Cek kelengkapan emergency kit', category: 'Operational', priority: 'High', assignedTo: 'Head of Clinic', required: true, dueTime: null },
  { title: 'Cek stok administrasi & ATK', category: 'Operational', priority: 'Low', assignedTo: 'Admin', required: false, dueTime: null },

  { title: 'Matikan seluruh komputer', category: 'Closing', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: '17:30' },
  { title: 'Matikan AC ruangan', category: 'Closing', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: '17:30' },
  { title: 'Matikan seluruh lampu', category: 'Closing', priority: 'Medium', assignedTo: 'Reception', required: true, dueTime: '17:45' },
  { title: 'Pastikan seluruh pintu terkunci', category: 'Closing', priority: 'High', assignedTo: 'Head of Clinic', required: true, dueTime: '18:00' },
];

/* ------------------------------------------------------------
   1. STATE (in-memory, mirrors localStorage)
   ------------------------------------------------------------ */
const state = {
  page: 'dashboard',
  checklistFilter: { status: 'All', category: 'All', search: '' },
  historyFilter: { date: null, staff: 'All', role: 'All', status: 'All' },
  editingTemplateId: null,
  activeMenuTaskId: null,
};

/* ------------------------------------------------------------
   2. STORAGE HELPERS
   ------------------------------------------------------------ */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse storage key', key, e);
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save storage key', key, e);
  }
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dateKeyOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLong(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------
   3. DATA ACCESSORS
   ------------------------------------------------------------ */
function loadSettings() {
  const s = loadJSON(LS_KEYS.settings, null);
  if (!s) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...s };
}
function saveSettings(settings) {
  saveJSON(LS_KEYS.settings, settings);
}

function loadTemplates() {
  return loadJSON(LS_KEYS.templates, []);
}
function saveTemplates(list) {
  saveJSON(LS_KEYS.templates, list);
}

function loadRecords() {
  return loadJSON(LS_KEYS.records, {});
}
function saveRecords(obj) {
  saveJSON(LS_KEYS.records, obj);
}

function loadLogs() {
  return loadJSON(LS_KEYS.logs, []);
}
function saveLogs(list) {
  saveJSON(LS_KEYS.logs, list);
}

function loadStaffDirectory() {
  return loadJSON(LS_KEYS.staff, DEFAULT_STAFF);
}
function saveStaffDirectory(list) {
  saveJSON(LS_KEYS.staff, list);
}

/* ------------------------------------------------------------
   3b. AUTH / SESSION
   ------------------------------------------------------------ */
function loadSession() {
  return loadJSON(LS_KEYS.session, null);
}
function saveSession(userId) {
  saveJSON(LS_KEYS.session, { userId, loginAt: new Date().toISOString() });
}
function clearSession() {
  localStorage.removeItem(LS_KEYS.session);
}

function getActiveUser() {
  const session = loadSession();
  if (!session) return null;
  const staff = loadStaffDirectory();
  const u = staff.find((s) => s.id === session.userId);
  return u || null;
}

function isLoggedIn() {
  return !!getActiveUser();
}

function canManageAccess() {
  const u = getActiveUser();
  return !!u && ADMIN_ROLES.includes(u.role);
}

function canManageTasks() {
  const u = getActiveUser();
  return !!u && ADMIN_ROLES.includes(u.role);
}

function attemptLogin(username, password) {
  const staff = loadStaffDirectory();
  const uname = (username || '').trim().toLowerCase();
  const user = staff.find((s) => (s.username || '').toLowerCase() === uname && s.password === password);
  if (!user) return null;
  saveSession(user.id);
  return user;
}

function logout() {
  clearSession();
  renderLoginScreen();
  document.getElementById('app').classList.remove('authed');
  document.getElementById('loginScreen').classList.add('open');
}

function logActivity(action, taskTitle, dateKey) {
  const user = getActiveUser();
  if (!user) return;
  const logs = loadLogs();
  const settings = loadSettings();
  logs.unshift({
    timestamp: new Date().toISOString(),
    user: user.name,
    role: user.role,
    action,
    task: taskTitle,
    date: dateKey || todayKey(),
    branch: settings.branch,
  });
  saveLogs(logs.slice(0, 500));
}

/* ------------------------------------------------------------
   4. SEEDING
   ------------------------------------------------------------ */
function buildTaskFromTemplate(tpl, dateKey, branch) {
  return {
    id: uid('task'),
    templateId: tpl.id,
    title: tpl.title,
    category: tpl.category,
    priority: tpl.priority,
    assignedTo: tpl.assignedTo,
    required: tpl.required,
    dueTime: tpl.dueTime || null,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
    completedBy: null,
    completedByRole: null,
    date: dateKey,
    branch,
  };
}

function seedIfEmpty() {
  // Staff/accounts are seeded independently of templates so that upgrading
  // from an older version of this app (which had no username/password
  // fields) doesn't leave a broken/incompatible account list behind.
  const existingStaff = loadJSON(LS_KEYS.staff, null);
  const staffLooksValid = Array.isArray(existingStaff) && existingStaff.length > 0 &&
    existingStaff.every((s) => s && s.username && s.password);
  if (!staffLooksValid) {
    saveStaffDirectory(DEFAULT_STAFF);
  }

  const existingTemplates = loadTemplates();
  if (existingTemplates.length > 0) return;

  const settings = loadSettings();
  saveSettings(settings);

  const templates = DEFAULT_TEMPLATES.map((t) => ({ id: uid('tpl'), ...t }));
  saveTemplates(templates);

  const logs = [];
  const records = {};

  // Seed 2 previous days with realistic completion so History/Reports have data.
  const demoStaffByAssignee = {
    Reception: { name: 'Meli', role: 'Reception' },
    'Dental Assistant': { name: 'Widia', role: 'Dental Assistant' },
    'Head of Clinic': { name: 'Dhimas', role: 'Head of Clinic' },
    Admin: { name: 'Rani', role: 'Admin' },
    'All Staff': { name: 'Meli', role: 'Reception' },
  };

  [-2, -1].forEach((offset, dayIdx) => {
    const dateKey = dateKeyOffset(offset);
    const completionTarget = dayIdx === 0 ? 0.83 : 0.92; // 2 days ago 83%, yesterday 92%
    const tasks = templates.map((tpl, i) => {
      const t = buildTaskFromTemplate(tpl, dateKey, settings.branch);
      const shouldComplete = (i / templates.length) < completionTarget;
      if (shouldComplete) {
        const completer = demoStaffByAssignee[tpl.assignedTo] || demoStaffByAssignee['Reception'];
        const hour = 7 + Math.floor(i / 3);
        const minute = (i * 7) % 60;
        const completedDate = new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
        t.status = 'Completed';
        t.completedAt = completedDate.toISOString();
        t.completedBy = completer.name;
        t.completedByRole = completer.role;
        logs.push({
          timestamp: completedDate.toISOString(),
          user: completer.name,
          role: completer.role,
          action: 'completed',
          task: t.title,
          date: dateKey,
          branch: settings.branch,
        });
      }
      return t;
    });
    const completedCount = tasks.filter((t) => t.status === 'Completed').length;
    records[dateKey] = {
      date: dateKey,
      branch: settings.branch,
      tasks,
      totalTasks: tasks.length,
      completedTasks: completedCount,
      completionRate: Math.round((completedCount / tasks.length) * 100),
    };
  });

  saveRecords(records);
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  saveLogs(logs);
}

/* Ensure today's daily record exists (auto daily snapshot / reset). */
function ensureTodayRecord() {
  const records = loadRecords();
  const key = todayKey();
  if (!records[key]) {
    const templates = loadTemplates();
    const settings = loadSettings();
    const tasks = templates.map((tpl) => buildTaskFromTemplate(tpl, key, settings.branch));
    records[key] = {
      date: key,
      branch: settings.branch,
      tasks,
      totalTasks: tasks.length,
      completedTasks: 0,
      completionRate: 0,
    };
    saveRecords(records);
  }
  return records[key];
}

function getRecord(dateKey) {
  const records = loadRecords();
  return records[dateKey] || null;
}

function updateRecordStats(record) {
  const completed = record.tasks.filter((t) => t.status === 'Completed').length;
  record.totalTasks = record.tasks.length;
  record.completedTasks = completed;
  record.completionRate = record.tasks.length ? Math.round((completed / record.tasks.length) * 100) : 0;
}

function saveRecord(record) {
  const records = loadRecords();
  updateRecordStats(record);
  records[record.date] = record;
  saveRecords(records);
}

/* ------------------------------------------------------------
   5. TASK OPERATIONS (today only — history is immutable)
   ------------------------------------------------------------ */
function calculateProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending, percent };
}

function computeDisplayStatus(task) {
  if (task.status === 'Completed') return 'Completed';
  if (task.dueTime && task.date === todayKey()) {
    const now = new Date();
    const [h, m] = task.dueTime.split(':').map(Number);
    const due = new Date();
    due.setHours(h, m, 0, 0);
    if (now > due) return 'Overdue';
  } else if (task.dueTime && task.date < todayKey()) {
    // past days: any task not completed with a due time is considered overdue for reporting
    return 'Overdue';
  }
  return 'Pending';
}

function toggleTaskStatus(taskId) {
  const record = ensureTodayRecord();
  const task = record.tasks.find((t) => t.id === taskId);
  if (!task) return;
  const user = getActiveUser();

  if (task.status === 'Completed') {
    task.status = 'Pending';
    task.completedAt = null;
    task.completedBy = null;
    task.completedByRole = null;
    saveRecord(record);
    logActivity('reset', task.title);
  } else {
    task.status = 'Completed';
    task.completedAt = new Date().toISOString();
    task.completedBy = user.name;
    task.completedByRole = user.role;
    saveRecord(record);
    logActivity('completed', task.title);
    showToast('Task completed', `"${task.title}"`, 'success');
  }
  renderAll();
}

function resetTaskToPending(taskId) {
  const record = ensureTodayRecord();
  const task = record.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.status = 'Pending';
  task.completedAt = null;
  task.completedBy = null;
  task.completedByRole = null;
  saveRecord(record);
  logActivity('reset', task.title);
  showToast('Task reset', `"${task.title}" is pending again`);
  renderAll();
}

function addTaskTemplate(data) {
  const templates = loadTemplates();
  const tpl = { id: uid('tpl'), ...data };
  templates.push(tpl);
  saveTemplates(templates);

  // Also add to today's checklist immediately.
  const record = ensureTodayRecord();
  const settings = loadSettings();
  record.tasks.push(buildTaskFromTemplate(tpl, record.date, settings.branch));
  saveRecord(record);

  logActivity('created', tpl.title);
  showToast('Task added', `"${tpl.title}" was added`);
  renderAll();
}

function editTaskTemplate(templateId, data) {
  const templates = loadTemplates();
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) return;
  Object.assign(tpl, data);
  saveTemplates(templates);

  // Patch today's matching task (title/category/priority/assignedTo/required/dueTime only).
  const record = ensureTodayRecord();
  const task = record.tasks.find((t) => t.templateId === templateId);
  if (task) {
    task.title = data.title;
    task.category = data.category;
    task.priority = data.priority;
    task.assignedTo = data.assignedTo;
    task.required = data.required;
    task.dueTime = data.dueTime || null;
    saveRecord(record);
  }

  logActivity('edited', tpl.title);
  showToast('Task updated', `"${tpl.title}" was updated`);
  renderAll();
}

function deleteTaskTemplate(templateId) {
  const templates = loadTemplates();
  const tpl = templates.find((t) => t.id === templateId);
  if (!tpl) return;
  saveTemplates(templates.filter((t) => t.id !== templateId));

  // Remove from today's record too (past history stays untouched).
  const record = ensureTodayRecord();
  record.tasks = record.tasks.filter((t) => t.templateId !== templateId);
  saveRecord(record);

  logActivity('deleted', tpl.title);
  showToast('Task deleted', `"${tpl.title}" was removed`);
  renderAll();
}

function filterTasks(tasks, filter) {
  const search = (filter.search || '').trim().toLowerCase();
  return tasks.filter((t) => {
    const displayStatus = computeDisplayStatus(t);
    const statusOk =
      filter.status === 'All' ||
      (filter.status === 'Completed' && t.status === 'Completed') ||
      (filter.status === 'Pending' && t.status !== 'Completed');
    const categoryOk = filter.category === 'All' || t.category === filter.category;
    const searchOk = !search || t.title.toLowerCase().includes(search);
    return statusOk && categoryOk && searchOk;
  });
}

/* ------------------------------------------------------------
   6. TOASTS
   ------------------------------------------------------------ */
function showToast(title, sub) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-title">✓ ${escapeHTML(title)}</div>
    ${sub ? `<div class="toast-sub">${escapeHTML(sub)}</div>` : ''}
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 260);
  }, 2400);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/* ------------------------------------------------------------
   7. NAVIGATION
   ------------------------------------------------------------ */
function navigate(page) {
  state.page = page;
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.bottom-nav button').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  closeSidebar();
  renderPage(page);
}

function renderPage(page) {
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'checklist': renderChecklist(); break;
    case 'tasks': renderTasksPage(); break;
    case 'history': renderHistory(); break;
    case 'reports': renderReports(); break;
    case 'settings': renderSettingsPage(); break;
  }
}

function renderAll() {
  renderHeader();
  renderPage(state.page);
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ------------------------------------------------------------
   8. HEADER
   ------------------------------------------------------------ */
function renderHeader() {
  const settings = loadSettings();
  const user = getActiveUser();
  if (!user) return;
  const record = ensureTodayRecord();
  const progress = calculateProgress(record.tasks);

  document.getElementById('clinicNameHeader').textContent = settings.clinicName;
  document.getElementById('clinicBranchHeader').textContent = settings.branch;
  document.getElementById('dateHeader').textContent = formatDateLong(todayKey());
  document.getElementById('userNameHeader').textContent = user.name;
  document.getElementById('userRoleHeader').textContent = user.role;
  document.getElementById('userAvatar').textContent = (user.name || '?').charAt(0).toUpperCase();

  const circumference = 2 * Math.PI * 19;
  const offset = circumference - (progress.percent / 100) * circumference;
  document.getElementById('sidebarRingFill').style.strokeDasharray = circumference;
  document.getElementById('sidebarRingFill').style.strokeDashoffset = offset;
  document.getElementById('sidebarRingValue').textContent = `${progress.percent}%`;
  document.getElementById('sidebarProgressLabel').textContent = `${progress.completed} / ${progress.total} tasks`;

  const overdueCount = record.tasks.filter((t) => computeDisplayStatus(t) === 'Overdue').length;
  document.getElementById('notifDot').hidden = overdueCount === 0;

  const tasksNav = document.querySelector('.nav-item[data-page="tasks"]');
  if (tasksNav) tasksNav.style.opacity = '1';

  applyRoleVisibility(user);
}

/* Hide nav items / controls that this role shouldn't see. Everyone sees
   Dashboard, Daily Checklist, History, Reports. Only Head of Clinic sees
   Tasks (task templates management) and Access Control (in Settings). */
function applyRoleVisibility(user) {
  const canManage = ADMIN_ROLES.includes(user.role);
  const tasksNav = document.querySelector('.nav-item[data-page="tasks"]');
  const tasksBottomNav = document.querySelector('.bottom-nav button[data-page="tasks"]');
  if (tasksNav) tasksNav.style.display = canManage ? '' : 'none';
  if (tasksBottomNav) tasksBottomNav.style.display = canManage ? '' : 'none';

  const accessPanel = document.getElementById('accessControlPanel');
  if (accessPanel) accessPanel.style.display = canManage ? '' : 'none';
}

/* ------------------------------------------------------------
   9. DASHBOARD
   ------------------------------------------------------------ */
/* Tasks visible to the current user: admins (Head of Clinic) see everything,
   everyone else only sees tasks assigned to their own role (or "All Staff"). */
function tasksForCurrentUser(tasks) {
  const user = getActiveUser();
  if (!user) return [];
  if (ADMIN_ROLES.includes(user.role)) return tasks;
  return tasks.filter((t) => t.assignedTo === user.role || t.assignedTo === 'All Staff');
}

function renderDashboard() {
  const user = getActiveUser();
  if (!user) return;
  const record = ensureTodayRecord();
  const myTasks = tasksForCurrentUser(record.tasks);
  const progress = calculateProgress(myTasks);
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Good Morning' : hour < 15 ? 'Good Afternoon' : hour < 19 ? 'Good Evening' : 'Good Night';

  document.getElementById('greetingText').textContent = `${greeting}, ${user.name.split(' ')[0]} 👋`;
  document.getElementById('dashboardDate').textContent = formatDateLong(todayKey());

  document.getElementById('statTotal').textContent = progress.total;
  document.getElementById('statCompleted').textContent = progress.completed;
  document.getElementById('statPending').textContent = progress.pending;
  document.getElementById('statCompletion').textContent = `${progress.percent}%`;
  document.getElementById('statCompletionBar').style.width = `${progress.percent}%`;

  // Staff performance (Head of Clinic only)
  const staffPanel = document.getElementById('staffPerformancePanel');
  if (canManageTasks()) {
    staffPanel.style.display = '';
    renderStaffPerformance(document.getElementById('staffPerformanceList'), record.tasks);
  } else {
    staffPanel.style.display = 'none';
  }

  // Recent activity
  const logs = loadLogs().slice(0, 8);
  const feed = document.getElementById('recentActivityFeed');
  if (logs.length === 0) {
    feed.innerHTML = `<p class="empty-inline">No activity yet today.</p>`;
  } else {
    feed.innerHTML = logs.map((log) => `
      <div class="activity-item">
        <span class="activity-dot"></span>
        <div>
          <div class="activity-text"><strong>${escapeHTML(log.user)}</strong> ${escapeHTML(actionVerb(log.action))} "${escapeHTML(log.task)}"</div>
          <div class="activity-time">${formatTime(log.timestamp)} · ${formatDateShort(log.date)}</div>
        </div>
      </div>
    `).join('');
  }
}

function actionVerb(action) {
  const map = { completed: 'completed', reset: 'reset', created: 'created', edited: 'edited', deleted: 'deleted' };
  return map[action] || action;
}

function renderStaffPerformance(container, tasks) {
  const staff = loadStaffDirectory();
  const rows = staff.map((s) => {
    const assigned = tasks.filter((t) => t.assignedTo === s.role || t.assignedTo === 'All Staff');
    const completed = assigned.filter((t) => t.status === 'Completed' && (t.completedByRole === s.role || t.completedBy === s.name));
    const pct = assigned.length ? Math.round((completed.length / assigned.length) * 100) : 0;
    return { ...s, total: assigned.length, completed: completed.length, pct };
  }).filter((r) => r.total > 0);

  if (rows.length === 0) {
    container.innerHTML = `<p class="empty-inline">No staff data yet.</p>`;
    return;
  }

  container.innerHTML = rows.map((r) => `
    <div class="staff-row">
      <div class="staff-row-avatar">${escapeHTML(r.name.charAt(0))}</div>
      <div class="staff-row-info">
        <div class="staff-row-name">${escapeHTML(r.name)}</div>
        <div class="staff-row-role">${escapeHTML(r.role)}</div>
        <div class="staff-row-bar"><div class="staff-row-bar-fill" style="width:${r.pct}%"></div></div>
      </div>
      <div class="staff-row-stats">
        <div class="staff-row-pct">${r.pct}%</div>
        <div class="staff-row-frac">${r.completed}/${r.total}</div>
      </div>
    </div>
  `).join('');
}

/* ------------------------------------------------------------
   10. DAILY CHECKLIST
   ------------------------------------------------------------ */
function renderChecklist() {
  const record = ensureTodayRecord();
  const myTasks = tasksForCurrentUser(record.tasks);
  const progress = calculateProgress(myTasks);

  document.getElementById('checklistProgressLabel').textContent = `${progress.completed} / ${progress.total} Tasks Completed`;
  document.getElementById('checklistProgressFill').style.width = `${progress.percent}%`;

  const addBtn = document.getElementById('openAddTaskBtn');
  addBtn.style.display = canManageTasks() ? '' : 'none';

  const filtered = filterTasks(myTasks, state.checklistFilter);
  const groupsEl = document.getElementById('checklistGroups');
  const emptyEl = document.getElementById('checklistEmptyState');

  if (filtered.length === 0) {
    groupsEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const cats = state.checklistFilter.category === 'All' ? CATEGORIES : [state.checklistFilter.category];
  let html = '';
  cats.forEach((cat) => {
    const items = filtered.filter((t) => t.category === cat);
    if (items.length === 0) return;
    html += `
      <div class="category-group">
        <div class="category-group-head">
          <h3>${escapeHTML(cat)}</h3>
          <span class="category-group-count">${items.length} task${items.length > 1 ? 's' : ''}</span>
        </div>
        <div class="task-list">
          ${items.map(renderTaskCard).join('')}
        </div>
      </div>
    `;
  });
  groupsEl.innerHTML = html;

  groupsEl.querySelectorAll('[data-check]').forEach((el) => {
    el.addEventListener('click', () => toggleTaskStatus(el.dataset.check));
  });
  groupsEl.querySelectorAll('[data-menu]').forEach((el) => {
    el.addEventListener('click', (e) => openTaskMenu(e, el.dataset.menu));
  });
}

function renderTaskCard(task) {
  const displayStatus = computeDisplayStatus(task);
  const completed = task.status === 'Completed';
  const priorityClass = `badge-priority-${task.priority.toLowerCase()}`;
  const statusClass = `status-${displayStatus.toLowerCase()}`;

  let statusHtml;
  if (displayStatus === 'Completed') {
    statusHtml = `<span class="task-status-text ${statusClass}">Completed<span class="task-status-time">${formatTime(task.completedAt)}</span></span>`;
  } else if (displayStatus === 'Overdue') {
    statusHtml = `<span class="task-status-text ${statusClass}">Overdue<span class="task-status-time">Due ${task.dueTime}</span></span>`;
  } else {
    statusHtml = `<span class="task-status-text ${statusClass}">Pending${task.dueTime ? `<span class="task-status-time">Due ${task.dueTime}</span>` : ''}</span>`;
  }

  return `
    <div class="task-card ${completed ? 'completed' : ''} ${displayStatus === 'Overdue' ? 'overdue' : ''}">
      <button class="task-checkbox" data-check="${task.id}" aria-label="Toggle task">${completed ? '✓' : ''}</button>
      <div class="task-main">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <div class="task-meta">
          <span class="badge badge-category">${escapeHTML(task.category)}</span>
          <span class="badge badge-assignee">${escapeHTML(task.assignedTo)}</span>
          <span class="badge ${priorityClass}">${task.priority.toUpperCase()}</span>
          ${task.required ? `<span class="badge badge-required">Required</span>` : ''}
        </div>
      </div>
      <div class="task-side">
        ${statusHtml}
        <button class="task-menu-btn" data-menu="${task.id}" aria-label="Task options">&bull;&bull;&bull;</button>
      </div>
    </div>
  `;
}

function openTaskMenu(evt, taskId) {
  evt.stopPropagation();
  const menu = document.getElementById('taskMenuPopover');
  state.activeMenuTaskId = taskId;
  const record = ensureTodayRecord();
  const task = record.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const canManage = canManageTasks();
  menu.querySelector('[data-action="complete"]').style.display = task.status === 'Completed' ? 'none' : '';
  menu.querySelector('[data-action="reset"]').style.display = task.status === 'Completed' ? '' : 'none';
  menu.querySelector('[data-action="edit"]').style.display = canManage ? '' : 'none';
  menu.querySelector('[data-action="delete"]').style.display = canManage ? '' : 'none';

  const rect = evt.target.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 6}px`;
  let left = rect.right - 170;
  if (left < 8) left = 8;
  menu.style.left = `${left}px`;
  menu.hidden = false;
}

function closeTaskMenu() {
  document.getElementById('taskMenuPopover').hidden = true;
  state.activeMenuTaskId = null;
}

/* ------------------------------------------------------------
   11. TASKS PAGE (template management)
   ------------------------------------------------------------ */
function renderTasksPage() {
  const templates = loadTemplates();
  const canManage = canManageTasks();
  document.getElementById('openAddTemplateBtn').style.display = canManage ? '' : 'none';
  document.getElementById('tasksReadonlyNotice').hidden = canManage;

  const container = document.getElementById('templateTable');
  if (templates.length === 0) {
    container.innerHTML = `<p class="empty-inline">No task templates yet.</p>`;
    return;
  }

  container.innerHTML = templates.map((tpl) => `
    <div class="template-row">
      <div>
        <div class="template-row-title">${escapeHTML(tpl.title)}</div>
        <div class="task-meta">
          ${tpl.required ? `<span class="badge badge-required">Required</span>` : `<span class="badge badge-required">Optional</span>`}
          ${tpl.dueTime ? `<span class="badge badge-required">Due ${tpl.dueTime}</span>` : ''}
        </div>
      </div>
      <span class="badge badge-category">${escapeHTML(tpl.category)}</span>
      <span class="badge badge-assignee">${escapeHTML(tpl.assignedTo)}</span>
      <span class="badge badge-priority-${tpl.priority.toLowerCase()}">${tpl.priority.toUpperCase()}</span>
      <div class="template-row-actions">
        ${canManage ? `
          <button class="icon-action" data-edit-tpl="${tpl.id}" title="Edit">✎</button>
          <button class="icon-action danger" data-delete-tpl="${tpl.id}" title="Delete">🗑</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-edit-tpl]').forEach((btn) => {
    btn.addEventListener('click', () => openTaskModal('editTemplate', btn.dataset.editTpl));
  });
  container.querySelectorAll('[data-delete-tpl]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tpl = templates.find((t) => t.id === btn.dataset.deleteTpl);
      openConfirmModal(`Delete "${tpl.title}"? This removes it from the task list and today's checklist.`, () => {
        deleteTaskTemplate(btn.dataset.deleteTpl);
      });
    });
  });
}

/* ------------------------------------------------------------
   12. HISTORY PAGE
   ------------------------------------------------------------ */
function getAllRecordDates() {
  const records = loadRecords();
  return Object.keys(records).sort((a, b) => (a < b ? 1 : -1));
}

function renderHistoryDateOptions() {
  const select = document.getElementById('historyDateSelect');
  const dates = getAllRecordDates();
  if (!state.historyFilter.date || !dates.includes(state.historyFilter.date)) {
    state.historyFilter.date = dates[0] || todayKey();
  }
  select.innerHTML = dates.map((d) => `<option value="${d}" ${d === state.historyFilter.date ? 'selected' : ''}>${formatDateLong(d)}</option>`).join('');
}

function renderHistoryStaffOptions() {
  const select = document.getElementById('historyStaffSelect');
  const staff = loadStaffDirectory();
  const current = state.historyFilter.staff;
  select.innerHTML = `<option value="All">All Staff</option>` + staff.map((s) => `<option value="${escapeHTML(s.name)}" ${current === s.name ? 'selected' : ''}>${escapeHTML(s.name)}</option>`).join('');
}

function renderHistory() {
  ensureTodayRecord();
  renderHistoryDateOptions();
  renderHistoryStaffOptions();
  document.getElementById('historyRoleSelect').value = state.historyFilter.role;
  document.getElementById('historyStatusSelect').value = state.historyFilter.status;

  const record = getRecord(state.historyFilter.date);
  if (!record) return;
  const progress = calculateProgress(record.tasks);

  document.getElementById('historySummaryCards').innerHTML = `
    <div class="summary-card">
      <span class="summary-label">Completion Rate</span>
      <span class="summary-value">${progress.percent}%</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Completed</span>
      <span class="summary-value">${progress.completed}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Pending</span>
      <span class="summary-value">${progress.pending}</span>
    </div>
  `;

  let tasks = record.tasks.filter((t) => {
    const displayStatus = computeDisplayStatus(t);
    const staffOk = state.historyFilter.staff === 'All' || t.completedBy === state.historyFilter.staff;
    const roleOk = state.historyFilter.role === 'All' || t.assignedTo === state.historyFilter.role || t.completedByRole === state.historyFilter.role;
    const statusOk = state.historyFilter.status === 'All' || displayStatus === state.historyFilter.status;
    return staffOk && roleOk && statusOk;
  });

  // Sort: completed tasks by completion time desc, pending tasks after.
  const completedTasks = tasks.filter((t) => t.status === 'Completed').sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const pendingTasks = tasks.filter((t) => t.status !== 'Completed');

  const timeline = document.getElementById('historyTimeline');
  if (completedTasks.length === 0 && pendingTasks.length === 0) {
    timeline.innerHTML = `<p class="empty-inline">No matching activity for this date.</p>`;
    return;
  }

  let html = completedTasks.map((t) => `
    <div class="timeline-item">
      <div class="timeline-time">${formatTime(t.completedAt)}</div>
      <div class="timeline-body">
        <div class="timeline-title">✓ ${escapeHTML(t.title)}</div>
        <div class="timeline-sub">Completed by ${escapeHTML(t.completedBy || '—')} · ${escapeHTML(t.completedByRole || '—')}</div>
      </div>
    </div>
  `).join('');

  if (pendingTasks.length > 0) {
    html += pendingTasks.map((t) => `
      <div class="timeline-item">
        <div class="timeline-time">—</div>
        <div class="timeline-body">
          <div class="timeline-title">${escapeHTML(t.title)}</div>
          <div class="timeline-sub">${computeDisplayStatus(t)} · Assigned to ${escapeHTML(t.assignedTo)}</div>
        </div>
      </div>
    `).join('');
  }

  timeline.innerHTML = html;
}

/* ------------------------------------------------------------
   13. REPORTS PAGE
   ------------------------------------------------------------ */
function renderReports() {
  ensureTodayRecord();
  const records = loadRecords();
  const allDates = Object.keys(records).sort();
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthDates = allDates.filter((d) => d.startsWith(monthPrefix));

  document.getElementById('monthlyReportTitle').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let monthTotal = 0, monthCompleted = 0;
  const staffTotals = {};
  monthDates.forEach((d) => {
    const rec = records[d];
    monthTotal += rec.tasks.length;
    monthCompleted += rec.tasks.filter((t) => t.status === 'Completed').length;
    rec.tasks.forEach((t) => {
      const role = t.assignedTo === 'All Staff' ? null : t.assignedTo;
      if (!role || role === 'Head of Clinic') return;
      staffTotals[role] = staffTotals[role] || { total: 0, completed: 0 };
      staffTotals[role].total += 1;
      if (t.status === 'Completed') staffTotals[role].completed += 1;
    });
  });
  const monthPct = monthTotal ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  document.getElementById('monthlyReportCards').innerHTML = `
    <div class="summary-card">
      <span class="summary-label">Total Tasks</span>
      <span class="summary-value">${monthTotal}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Completed</span>
      <span class="summary-value">${monthCompleted}</span>
    </div>
    <div class="summary-card">
      <span class="summary-label">Completion Rate</span>
      <span class="summary-value">${monthPct}%</span>
    </div>
  `;

  const staffRows = Object.entries(staffTotals).map(([role, v]) => ({
    name: role,
    role: '',
    pct: v.total ? Math.round((v.completed / v.total) * 100) : 0,
    completed: v.completed,
    total: v.total,
  }));
  const staffContainer = document.getElementById('monthlyStaffPerformance');
  if (staffRows.length === 0) {
    staffContainer.innerHTML = `<p class="empty-inline">No data for this month yet.</p>`;
  } else {
    staffContainer.innerHTML = staffRows.map((r) => `
      <div class="staff-row">
        <div class="staff-row-avatar">${escapeHTML(r.name.charAt(0))}</div>
        <div class="staff-row-info">
          <div class="staff-row-name">${escapeHTML(r.name)}</div>
          <div class="staff-row-bar"><div class="staff-row-bar-fill" style="width:${r.pct}%"></div></div>
        </div>
        <div class="staff-row-stats">
          <div class="staff-row-pct">${r.pct}%</div>
          <div class="staff-row-frac">${r.completed}/${r.total}</div>
        </div>
      </div>
    `).join('');
  }

  // Last 7 days bar chart
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const key = dateKeyOffset(-i);
    const rec = records[key];
    const progress = rec ? calculateProgress(rec.tasks) : { percent: 0, total: 0 };
    last7.push({ key, percent: progress.percent, hasData: !!rec });
  }
  document.getElementById('weekBarChart').innerHTML = last7.map((d) => `
    <div class="bar-chart-col">
      <div class="bar-chart-value">${d.hasData ? d.percent + '%' : '—'}</div>
      <div class="bar-chart-track">
        <div class="bar-chart-fill" style="height:${d.hasData ? d.percent : 0}%"></div>
      </div>
      <div class="bar-chart-label">${formatDateShort(d.key)}</div>
    </div>
  `).join('');

  // Today's / selected date category breakdown
  const todayRec = records[todayKey()];
  document.getElementById('dailyReportTitle').textContent = `Today's Breakdown — ${formatDateLong(todayKey())}`;
  const breakdown = document.getElementById('categoryBreakdown');
  if (!todayRec) {
    breakdown.innerHTML = `<p class="empty-inline">No data yet today.</p>`;
  } else {
    breakdown.innerHTML = CATEGORIES.map((cat) => {
      const catTasks = todayRec.tasks.filter((t) => t.category === cat);
      if (catTasks.length === 0) return '';
      const catProgress = calculateProgress(catTasks);
      return `
        <div class="cb-row">
          <div class="cb-row-head"><span>${escapeHTML(cat)}</span><span>${catProgress.percent}%</span></div>
          <div class="cb-bar"><div class="cb-bar-fill" style="width:${catProgress.percent}%"></div></div>
        </div>
      `;
    }).join('');
  }

  // Daily history table
  const tableDates = allDates.slice().sort((a, b) => (a < b ? 1 : -1)).slice(0, 14);
  const table = document.getElementById('reportTable');
  let tableHtml = `
    <div class="report-table-row head">
      <span>Date</span><span>Total</span><span>Completed</span><span>Completion</span>
    </div>
  `;
  tableHtml += tableDates.map((d) => {
    const rec = records[d];
    const progress = calculateProgress(rec.tasks);
    return `
      <div class="report-table-row">
        <span>${formatDateShort(d)}</span>
        <span>${progress.total}</span>
        <span>${progress.completed}</span>
        <span>${progress.percent}%</span>
      </div>
    `;
  }).join('');
  table.innerHTML = tableHtml;
}

/* ------------------------------------------------------------
   14. SETTINGS PAGE
   ------------------------------------------------------------ */
function renderSettingsPage() {
  const settings = loadSettings();
  const user = getActiveUser();
  if (!user) return;

  document.getElementById('settingClinicName').value = settings.clinicName;
  document.getElementById('settingBranch').value = settings.branch;

  // Profile card is read-only info + password change (identity/role is
  // managed centrally via Access Control, not self-edited).
  document.getElementById('profileNameDisplay').textContent = user.name;
  document.getElementById('profileRoleDisplay').textContent = user.role;
  document.getElementById('profileUsernameDisplay').textContent = user.username;
  document.getElementById('newPasswordInput').value = '';

  // Access Control panel: only render/show for Head of Clinic.
  const accessPanel = document.getElementById('accessControlPanel');
  if (accessPanel) {
    accessPanel.style.display = canManageAccess() ? '' : 'none';
    if (canManageAccess()) renderAccessControlList();
  }
}

function saveClinicSettings() {
  const settings = loadSettings();
  settings.clinicName = document.getElementById('settingClinicName').value.trim() || DEFAULT_SETTINGS.clinicName;
  settings.branch = document.getElementById('settingBranch').value;
  saveSettings(settings);
  showToast('Clinic settings saved');
  renderAll();
}

function saveProfile() {
  const user = getActiveUser();
  if (!user) return;
  const newPassword = document.getElementById('newPasswordInput').value;
  if (!newPassword) {
    showToast('Nothing to update', 'Enter a new password to change it');
    return;
  }
  const staff = loadStaffDirectory();
  const target = staff.find((s) => s.id === user.id);
  if (target) {
    target.password = newPassword;
    saveStaffDirectory(staff);
  }
  document.getElementById('newPasswordInput').value = '';
  showToast('Password updated');
}

function resetDemoData() {
  Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key));
  clearSession();
  seedIfEmpty();
  showToast('Demo data reset');
  document.getElementById('app').classList.remove('authed');
  document.getElementById('loginScreen').classList.add('open');
  renderLoginScreen();
}

/* ------------------------------------------------------------
   14b. ACCESS CONTROL (Head of Clinic only) — manage staff accounts
   ------------------------------------------------------------ */
function renderAccessControlList() {
  const list = document.getElementById('accessControlList');
  if (!list) return;
  const staff = loadStaffDirectory();
  const me = getActiveUser();

  if (staff.length === 0) {
    list.innerHTML = `<p class="empty-inline">No accounts yet.</p>`;
    return;
  }

  list.innerHTML = staff.map((s) => `
    <div class="access-row" data-user-id="${escapeHTML(s.id)}">
      <div class="staff-row-avatar">${escapeHTML(s.name.charAt(0))}</div>
      <div class="staff-row-info">
        <div class="staff-row-name">${escapeHTML(s.name)} ${s.id === me.id ? '<span class="tag-you">You</span>' : ''}</div>
        <div class="staff-row-role">${escapeHTML(s.role)} · @${escapeHTML(s.username)}</div>
      </div>
      <div class="access-row-actions">
        <button class="btn btn-ghost btn-sm" data-access-edit="${escapeHTML(s.id)}">Edit</button>
        ${s.id !== me.id ? `<button class="btn btn-ghost btn-sm btn-danger-text" data-access-delete="${escapeHTML(s.id)}">Remove</button>` : ''}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-access-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openAccessModal('edit', btn.dataset.accessEdit));
  });
  list.querySelectorAll('[data-access-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const staffList = loadStaffDirectory();
      const target = staffList.find((s) => s.id === btn.dataset.accessDelete);
      if (!target) return;
      openConfirmModal(`Remove account for "${target.name}"? They will no longer be able to log in.`, () => {
        removeStaffAccount(target.id);
      });
    });
  });
}

let state_editingUserId = null;

function openAccessModal(mode, userId) {
  state_editingUserId = mode === 'edit' ? userId : null;
  const overlay = document.getElementById('accessModalOverlay');
  const title = document.getElementById('accessModalTitle');
  const submitBtn = document.getElementById('accessSubmitBtn');
  const form = document.getElementById('accessForm');
  form.reset();

  if (mode === 'edit') {
    const staff = loadStaffDirectory();
    const s = staff.find((x) => x.id === userId);
    if (!s) return;
    title.textContent = 'Edit Account';
    submitBtn.textContent = 'Save Changes';
    document.getElementById('accessFieldName').value = s.name;
    document.getElementById('accessFieldRole').value = s.role;
    document.getElementById('accessFieldUsername').value = s.username;
    document.getElementById('accessFieldPassword').value = '';
    document.getElementById('accessFieldPassword').placeholder = 'Leave blank to keep current password';
  } else {
    title.textContent = 'Add Account';
    submitBtn.textContent = 'Add Account';
    document.getElementById('accessFieldPassword').placeholder = '';
  }
  overlay.classList.add('open');
}

function closeAccessModal() {
  document.getElementById('accessModalOverlay').classList.remove('open');
  state_editingUserId = null;
}

function submitAccessForm(e) {
  e.preventDefault();
  const name = document.getElementById('accessFieldName').value.trim();
  const role = document.getElementById('accessFieldRole').value;
  const username = document.getElementById('accessFieldUsername').value.trim().toLowerCase();
  const password = document.getElementById('accessFieldPassword').value;

  if (!name || !username) return;

  const staff = loadStaffDirectory();
  const usernameTaken = staff.some((s) => s.username.toLowerCase() === username && s.id !== state_editingUserId);
  if (usernameTaken) {
    showToast('Username already taken', 'Choose a different username', 'error');
    return;
  }

  if (state_editingUserId) {
    const target = staff.find((s) => s.id === state_editingUserId);
    if (!target) return;
    target.name = name;
    target.role = role;
    target.username = username;
    if (password) target.password = password;
    saveStaffDirectory(staff);
    showToast('Account updated', `${name} · ${role}`);
  } else {
    if (!password) {
      showToast('Password required', 'Set a password for the new account', 'error');
      return;
    }
    staff.push({ id: uid('usr'), name, role, username, password });
    saveStaffDirectory(staff);
    showToast('Account added', `${name} · ${role}`);
  }

  closeAccessModal();
  renderAccessControlList();
  renderAll();
}

function removeStaffAccount(userId) {
  const staff = loadStaffDirectory();
  const target = staff.find((s) => s.id === userId);
  if (!target) return;
  saveStaffDirectory(staff.filter((s) => s.id !== userId));
  showToast('Account removed', `${target.name} can no longer log in`);
  renderAccessControlList();
}

/* ------------------------------------------------------------
   15. TASK MODAL (add/edit)
   ------------------------------------------------------------ */
function openTaskModal(mode, templateId) {
  state.editingTemplateId = mode === 'editTemplate' ? templateId : null;
  const overlay = document.getElementById('taskModalOverlay');
  const title = document.getElementById('taskModalTitle');
  const submitBtn = document.getElementById('submitTaskBtn');

  if (mode === 'editTemplate') {
    const tpl = loadTemplates().find((t) => t.id === templateId);
    if (!tpl) return;
    title.textContent = 'Edit Task';
    submitBtn.textContent = 'Save Changes';
    document.getElementById('fieldTaskName').value = tpl.title;
    document.getElementById('fieldCategory').value = tpl.category;
    document.getElementById('fieldPriority').value = tpl.priority;
    document.getElementById('fieldAssignedTo').value = tpl.assignedTo;
    document.getElementById('fieldDueTime').value = tpl.dueTime || '';
    document.getElementById('fieldRequired').checked = !!tpl.required;
  } else {
    title.textContent = 'Add Task';
    submitBtn.textContent = 'Add Task';
    document.getElementById('taskForm').reset();
    document.getElementById('fieldRequired').checked = true;
  }

  overlay.classList.add('open');
  setTimeout(() => document.getElementById('fieldTaskName').focus(), 100);
}

function closeTaskModal() {
  document.getElementById('taskModalOverlay').classList.remove('open');
  state.editingTemplateId = null;
}

function submitTaskForm(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('fieldTaskName').value.trim(),
    category: document.getElementById('fieldCategory').value,
    priority: document.getElementById('fieldPriority').value,
    assignedTo: document.getElementById('fieldAssignedTo').value,
    required: document.getElementById('fieldRequired').checked,
    dueTime: document.getElementById('fieldDueTime').value || null,
  };
  if (!data.title) return;

  if (state.editingTemplateId) {
    editTaskTemplate(state.editingTemplateId, data);
  } else {
    addTaskTemplate(data);
  }
  closeTaskModal();
}

/* ------------------------------------------------------------
   16. CONFIRM MODAL
   ------------------------------------------------------------ */
let pendingConfirmAction = null;

function openConfirmModal(message, onConfirm, title) {
  document.getElementById('confirmModalTitle').textContent = title || 'Are you sure?';
  document.getElementById('confirmModalMessage').textContent = message;
  pendingConfirmAction = onConfirm;
  document.getElementById('confirmModalOverlay').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirmModalOverlay').classList.remove('open');
  pendingConfirmAction = null;
}

/* ------------------------------------------------------------
   17. EVENT BINDING
   ------------------------------------------------------------ */
function bindGlobalEvents() {
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });
  document.querySelectorAll('.bottom-nav button').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Mobile sidebar toggle
  document.getElementById('hamburgerBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  // Header shortcuts
  document.getElementById('userChip').addEventListener('click', () => navigate('settings'));
  document.getElementById('notifBtn').addEventListener('click', () => {
    const record = ensureTodayRecord();
    const overdue = record.tasks.filter((t) => computeDisplayStatus(t) === 'Overdue');
    if (overdue.length === 0) {
      showToast('All caught up', 'No overdue tasks right now');
    } else {
      showToast(`${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue`, overdue[0].title);
      navigate('checklist');
    }
  });

  // Checklist toolbar
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.checklistFilter.search = e.target.value;
    renderChecklist();
  });
  document.getElementById('statusFilterPills').addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    document.querySelectorAll('#statusFilterPills .pill').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    state.checklistFilter.status = btn.dataset.status;
    renderChecklist();
  });
  document.getElementById('categoryFilterSelect').addEventListener('change', (e) => {
    state.checklistFilter.category = e.target.value;
    renderChecklist();
  });
  document.getElementById('openAddTaskBtn').addEventListener('click', () => openTaskModal('add'));
  document.getElementById('openAddTemplateBtn').addEventListener('click', () => openTaskModal('add'));

  // Task modal
  document.getElementById('taskForm').addEventListener('submit', submitTaskForm);
  document.getElementById('closeTaskModalBtn').addEventListener('click', closeTaskModal);
  document.getElementById('cancelTaskModalBtn').addEventListener('click', closeTaskModal);
  document.getElementById('taskModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'taskModalOverlay') closeTaskModal();
  });

  // Confirm modal
  document.getElementById('closeConfirmModalBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('cancelConfirmBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmActionBtn').addEventListener('click', () => {
    if (pendingConfirmAction) pendingConfirmAction();
    closeConfirmModal();
  });
  document.getElementById('confirmModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModalOverlay') closeConfirmModal();
  });

  // Task menu popover
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('taskMenuPopover');
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-menu]')) {
      closeTaskMenu();
    }
  });
  document.getElementById('taskMenuPopover').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const taskId = state.activeMenuTaskId;
    const action = btn.dataset.action;
    closeTaskMenu();
    if (!taskId) return;

    if (action === 'complete') {
      toggleTaskStatus(taskId);
    } else if (action === 'reset') {
      resetTaskToPending(taskId);
    } else if (action === 'edit') {
      const record = ensureTodayRecord();
      const task = record.tasks.find((t) => t.id === taskId);
      if (task && task.templateId) openTaskModal('editTemplate', task.templateId);
    } else if (action === 'delete') {
      const record = ensureTodayRecord();
      const task = record.tasks.find((t) => t.id === taskId);
      if (task && task.templateId) {
        openConfirmModal(`Delete "${task.title}"? This removes it from the task list and today's checklist.`, () => {
          deleteTaskTemplate(task.templateId);
        });
      }
    }
  });

  // History filters
  document.getElementById('historyDateSelect').addEventListener('change', (e) => {
    state.historyFilter.date = e.target.value;
    renderHistory();
  });
  document.getElementById('historyStaffSelect').addEventListener('change', (e) => {
    state.historyFilter.staff = e.target.value;
    renderHistory();
  });
  document.getElementById('historyRoleSelect').addEventListener('change', (e) => {
    state.historyFilter.role = e.target.value;
    renderHistory();
  });
  document.getElementById('historyStatusSelect').addEventListener('change', (e) => {
    state.historyFilter.status = e.target.value;
    renderHistory();
  });

  // Settings
  document.getElementById('saveClinicSettingsBtn').addEventListener('click', saveClinicSettings);
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    openConfirmModal('This will remove your current checklist data.', resetDemoData, 'Reset demo data?');
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    openConfirmModal('You will need your username and password to log back in.', logout, 'Log out?');
  });

  // Access Control (Head of Clinic only)
  document.getElementById('openAddAccessBtn').addEventListener('click', () => openAccessModal('add'));
  document.getElementById('accessForm').addEventListener('submit', submitAccessForm);
  document.getElementById('closeAccessModalBtn').addEventListener('click', closeAccessModal);
  document.getElementById('cancelAccessModalBtn').addEventListener('click', closeAccessModal);
  document.getElementById('accessModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'accessModalOverlay') closeAccessModal();
  });

  // Escape key closes modals/menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeConfirmModal();
      closeTaskMenu();
      closeAccessModal();
    }
  });
}

/* ------------------------------------------------------------
   17b. LOGIN SCREEN
   ------------------------------------------------------------ */
function renderLoginScreen() {
  const settings = loadSettings();
  const el = document.getElementById('loginClinicName');
  if (el) el.textContent = settings.clinicName;
  const err = document.getElementById('loginError');
  if (err) err.hidden = true;
  const form = document.getElementById('loginForm');
  if (form) form.reset();
}

function bindLoginEvents() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const user = attemptLogin(username, password);
    const err = document.getElementById('loginError');
    if (!user) {
      err.hidden = false;
      err.textContent = 'Invalid username or password.';
      return;
    }
    err.hidden = true;
    document.getElementById('loginScreen').classList.remove('open');
    document.getElementById('app').classList.add('authed');
    renderHeader();
    navigate('dashboard');
  });
}

/* ------------------------------------------------------------
   18. INIT
   ------------------------------------------------------------ */
function initApp() {
  seedIfEmpty();
  ensureTodayRecord();
  bindGlobalEvents();
  bindLoginEvents();

  if (isLoggedIn()) {
    document.getElementById('app').classList.add('authed');
    renderHeader();
    navigate('dashboard');
  } else {
    document.getElementById('loginScreen').classList.add('open');
    renderLoginScreen();
  }

  // Keep the app in sync with the real clock: re-check for a new day / overdue
  // status periodically without requiring a page refresh.
  setInterval(() => {
    if (!isLoggedIn()) return;
    ensureTodayRecord();
    renderAll();
  }, 60000);
}

document.addEventListener('DOMContentLoaded', initApp);
