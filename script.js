// ─────────────────────────────────────────────
//  JobTrackr — script.js
//  All data stored in localStorage as JSON array
// ─────────────────────────────────────────────

// Load jobs from localStorage, or start with empty array
let jobs = JSON.parse(localStorage.getItem("jobs")) || [];

// Track which job is currently being edited (-1 = none)
let editingIndex = -1;

// ── Colour / label map for each status ──
const STATUS_META = {
  Applied:   { color: "#3b82f6", bg: "#eff6ff", emoji: "🔵" },
  Interview: { color: "#f97316", bg: "#fff7ed", emoji: "🟠" },
  Offer:     { color: "#22c55e", bg: "#f0fdf4", emoji: "🟢" },
  Rejected:  { color: "#ef4444", bg: "#fef2f2", emoji: "🔴" },
};

// ─────────────────────────────────────────────
//  SAVE helpers
// ─────────────────────────────────────────────
function saveToStorage() {
  localStorage.setItem("jobs", JSON.stringify(jobs));
}

// ─────────────────────────────────────────────
//  ADD JOB
// ─────────────────────────────────────────────
function addJob() {
  const company = document.getElementById("company").value.trim();
  const role    = document.getElementById("role").value.trim();
  const status  = document.getElementById("status").value;
  const date    = document.getElementById("date").value;
  const notes   = document.getElementById("notes").value.trim();

  // Validation — company and role are required
  if (!company || !role) {
    showToast("⚠️ Please enter both Company and Role.", "error");
    return;
  }

  // Build the job object (date defaults to today if left blank)
  const job = {
    id: Date.now(),           // unique ID using timestamp
    company,
    role,
    status,
    date: date || new Date().toISOString().split("T")[0],
    notes,
  };

  jobs.unshift(job);          // unshift = add at the beginning (newest first)
  saveToStorage();
  clearForm();
  renderJobs();
  updateStats();
  showToast(`✅ "${company}" added successfully!`, "success");
}

// Clear the add-form inputs after adding
function clearForm() {
  document.getElementById("company").value = "";
  document.getElementById("role").value    = "";
  document.getElementById("notes").value   = "";
  document.getElementById("date").value    = "";
  document.getElementById("status").value  = "Applied";
}

// ─────────────────────────────────────────────
//  RENDER JOBS (with search + filter + sort)
// ─────────────────────────────────────────────
function renderJobs() {
  const query        = document.getElementById("search").value.toLowerCase();
  const filterStatus = document.getElementById("filterStatus").value;
  const sortBy       = document.getElementById("sortBy").value;

  // 1. Filter by search text
  let result = jobs.filter(job =>
    job.company.toLowerCase().includes(query) ||
    job.role.toLowerCase().includes(query)
  );

  // 2. Filter by status dropdown
  if (filterStatus !== "All") {
    result = result.filter(job => job.status === filterStatus);
  }

  // 3. Sort
  if (sortBy === "oldest") {
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === "company") {
    result.sort((a, b) => a.company.localeCompare(b.company));
  }
  // "newest" is already default order (unshift on add)

  const grid     = document.getElementById("jobList");
  const emptyMsg = document.getElementById("emptyMsg");

  grid.innerHTML = "";

  if (result.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  result.forEach(job => {
    // Find the REAL index in the jobs array (needed for edit/delete)
    const realIndex = jobs.findIndex(j => j.id === job.id);
    const meta      = STATUS_META[job.status] || STATUS_META["Applied"];

    const card = document.createElement("div");
    card.className = "job-card";
    // Apply a coloured left border using inline style (dynamic per status)
    card.style.borderLeftColor = meta.color;

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3 class="card-company">${escapeHTML(job.company)}</h3>
          <p class="card-role">${escapeHTML(job.role)}</p>
        </div>
        <span class="status-badge" style="background:${meta.bg}; color:${meta.color};">
          ${meta.emoji} ${job.status}
        </span>
      </div>

      <div class="card-meta">
        <span>📅 ${formatDate(job.date)}</span>
        ${job.notes ? `<span class="card-notes">📝 ${escapeHTML(job.notes)}</span>` : ""}
      </div>

      <div class="card-actions">
        <button class="btn-edit"   onclick="openEditModal(${realIndex})">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteJob(${realIndex})">🗑️ Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────────
//  DELETE JOB
// ─────────────────────────────────────────────
function deleteJob(index) {
  // Simple confirm before deleting
  if (!confirm(`Delete "${jobs[index].company}"?`)) return;
  jobs.splice(index, 1);
  saveToStorage();
  renderJobs();
  updateStats();
  showToast("🗑️ Application deleted.", "info");
}

// ─────────────────────────────────────────────
//  EDIT MODAL
// ─────────────────────────────────────────────
function openEditModal(index) {
  editingIndex = index;
  const job = jobs[index];

  document.getElementById("editCompany").value = job.company;
  document.getElementById("editRole").value    = job.role;
  document.getElementById("editDate").value    = job.date;
  document.getElementById("editStatus").value  = job.status;
  document.getElementById("editNotes").value   = job.notes || "";

  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  editingIndex = -1;
}

function saveEdit() {
  if (editingIndex === -1) return;

  const company = document.getElementById("editCompany").value.trim();
  const role    = document.getElementById("editRole").value.trim();

  if (!company || !role) {
    showToast("⚠️ Company and Role cannot be empty.", "error");
    return;
  }

  jobs[editingIndex] = {
    ...jobs[editingIndex],         // keep id and other fields
    company,
    role,
    status: document.getElementById("editStatus").value,
    date:   document.getElementById("editDate").value,
    notes:  document.getElementById("editNotes").value.trim(),
  };

  saveToStorage();
  closeModal();
  renderJobs();
  updateStats();
  showToast("✅ Application updated!", "success");
}

// Close modal if user clicks the dark overlay outside the card
document.getElementById("modal").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

// ─────────────────────────────────────────────
//  STATS DASHBOARD
// ─────────────────────────────────────────────
function updateStats() {
  const counts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };

  jobs.forEach(job => {
    if (counts[job.status] !== undefined) counts[job.status]++;
  });

  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = `
    <div class="stat-card" style="--accent:#6366f1">
      <span class="stat-number">${jobs.length}</span>
      <span class="stat-label">Total</span>
    </div>
    <div class="stat-card" style="--accent:#3b82f6">
      <span class="stat-number">${counts.Applied}</span>
      <span class="stat-label">Applied</span>
    </div>
    <div class="stat-card" style="--accent:#f97316">
      <span class="stat-number">${counts.Interview}</span>
      <span class="stat-label">Interviews</span>
    </div>
    <div class="stat-card" style="--accent:#22c55e">
      <span class="stat-number">${counts.Offer}</span>
      <span class="stat-label">Offers</span>
    </div>
    <div class="stat-card" style="--accent:#ef4444">
      <span class="stat-number">${counts.Rejected}</span>
      <span class="stat-label">Rejected</span>
    </div>
  `;
}

// ─────────────────────────────────────────────
//  TOAST NOTIFICATION
// ─────────────────────────────────────────────
let toastTimer = null;

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = `toast toast-${type} show`;

  // Auto-hide after 3 seconds
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// ─────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────

// Prevent XSS — escape special HTML characters before injecting user text
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Turn "2024-05-15" → "May 15, 2024"
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00"); // force local time
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────
//  INITIALISE on page load
// ─────────────────────────────────────────────
renderJobs();
updateStats();