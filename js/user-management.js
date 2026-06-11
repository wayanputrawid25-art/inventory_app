/* ============================================
   CV EPIC Warehouse V3 - User Management API
   ============================================ */

const UserManagement = {
  // Get auth token
  getToken() {
    try {
      const auth = JSON.parse(localStorage.getItem('auth_user') || 'null');
      return auth?.access_token || null;
    } catch {
      return null;
    }
  },

  // API helper
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /* ============================================
     User CRUD Operations
     ============================================ */

  async getUsers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/users${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  },

  async getUser(userId) {
    return this.request(`/api/v1/users/${userId}`);
  },

  async createUser(userData) {
    return this.request('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUser(userId, userData) {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  async deleteUser(userId) {
    return this.request(`/api/v1/users/${userId}`, {
      method: 'DELETE'
    });
  },

  async resetPassword(userId) {
    return this.request(`/api/v1/users/${userId}/reset-password`, {
      method: 'POST'
    });
  },

  async enableUser(userId) {
    return this.request(`/api/v1/users/${userId}/enable`, {
      method: 'POST'
    });
  },

  async disableUser(userId) {
    return this.request(`/api/v1/users/${userId}/disable`, {
      method: 'POST'
    });
  },

  async getUserStats() {
    return this.request('/api/v1/users/stats');
  },

  /* ============================================
     Settings Operations
     ============================================ */

  async getProfile() {
    return this.request('/api/v1/auth/me');
  },

  async updateProfile(profileData) {
    return this.request('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
  },

  async changeEmail(newEmail, password) {
    return this.request('/api/v1/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ email: newEmail, password })
    });
  }
};

/* ============================================
   UI Helper Functions
   ============================================ */

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Format datetime
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format currency
function formatCurrency(amount) {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Format number
function formatNumber(num) {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('id-ID').format(num);
}

// Get role badge color
function getRoleBadgeClass(role) {
  const classes = {
    'admin': 'badge-danger',
    'manager': 'badge-warning',
    'staff': 'badge-info',
    'staff_gudang': 'badge-info',
    'checker_opname': 'badge-success'
  };
  return classes[role] || 'badge-info';
}

// Get status badge color
function getStatusBadgeClass(isActive) {
  return isActive ? 'badge-success' : 'badge-danger';
}

// Get status text
function getStatusText(isActive) {
  return isActive ? 'Active' : 'Inactive';
}

// Render user table
function renderUsersTable(users, tbodyId = 'usersTableBody') {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p>Belum ada pengguna</p>
        </td>
      </tr>
    `;
    return;
  }

  // Map database field names to expected names
  const normalizeUser = (user) => ({
    id: user.id,
    name: user.name || user.nama_lengkap || user.username,
    username: user.username,
    email: user.email || '',
    role: user.role || 'staff_gudang',
    is_active: user.is_active !== undefined ? user.is_active : true
  });

  tbody.innerHTML = users.map(user => {
    const u = normalizeUser(user);
    const initial = u.name ? u.name.charAt(0).toUpperCase() : '?';
    const roleLabel = u.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return `
    <tr data-user-id="${u.id}">
      <td>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="avatar" style="width: 32px; height: 32px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px;">
            ${initial}
          </div>
          <span style="font-weight: 500;">${escapeHtml(u.name)}</span>
        </div>
      </td>
      <td style="color: var(--text-secondary);">@${escapeHtml(u.username)}</td>
      <td style="color: var(--text-secondary);">${escapeHtml(u.email)}</td>
      <td>
        <span class="badge ${getRoleBadgeClass(u.role)}">
          ${escapeHtml(roleLabel)}
        </span>
      </td>
      <td>
        <span class="badge ${getStatusBadgeClass(u.is_active)}">
          ${getStatusText(u.is_active)}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-ghost btn-sm" onclick="editUser(${u.id})" title="Edit">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="resetUserPassword(${u.id})" title="Reset Password">
            <i data-lucide="key"></i>
          </button>
          ${u.is_active
            ? `<button class="btn btn-ghost btn-sm" onclick="disableUserAccount(${u.id})" title="Nonaktifkan">
                <i data-lucide="user-x"></i>
              </button>`
            : `<button class="btn btn-ghost btn-sm" onclick="enableUserAccount(${u.id})" title="Aktifkan">
                <i data-lucide="user-check"></i>
              </button>`
          }
          <button class="btn btn-ghost btn-sm" onclick="deleteUserAccount(${u.id})" title="Hapus" style="color: var(--danger);">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    </tr>
  `}).join('');

  // Re-init icons
  if (window.lucide) lucide.createIcons();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Page Initialization Functions
// ============================================

// Initialize Dashboard Page
function initDashboardPage() {
  loadDashboardKPI();
  loadDashboardCharts();
  loadRecentActivity();
}

async function loadDashboardKPI() {
  try {
    const data = await UserManagement.request('/api/kpi');
    
    if (data.success && data.data) {
      document.getElementById('kpiSales').textContent = formatCurrency(data.data.total_penjualan);
      document.getElementById('kpiSold').textContent = formatNumber(data.data.produk_terjual);
      document.getElementById('kpiUnsold').textContent = formatNumber(data.data.produk_belum_terjual);
      document.getElementById('kpiProfit').textContent = formatCurrency(data.data.profit);
    }
  } catch (error) {
    console.error('Failed to load KPI:', error);
  }
}

async function loadDashboardCharts() {
  // Initialize sales chart
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx && window.Chart) {
    try {
      const data = await UserManagement.request('/api/chart');
      // Chart will be rendered here
    } catch (error) {
      console.error('Failed to load charts:', error);
    }
  }
}

async function loadRecentActivity() {
  const tbody = document.getElementById('activityTableBody');
  if (!tbody) return;

  try {
    const data = await UserManagement.request('/api/v1/dashboard/notifications?limit=10');
    
    if (data.success && data.data?.notifications?.length > 0) {
      tbody.innerHTML = data.data.notifications.map(item => `
        <tr>
          <td>${formatDateTime(item.created_at)}</td>
          <td>${item.pesan}</td>
          <td>-</td>
          <td>
            <span class="badge badge-${item.severity === 'high' ? 'danger' : item.severity === 'medium' ? 'warning' : 'info'}">
              ${item.severity}
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted);">Belum ada aktivitas</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Failed to load activity:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted);">Gagal memuat aktivitas</td>
      </tr>
    `;
  }
}

// Initialize Users Page
function initUsersPage() {
  loadUsersList();
  
  // Search handler
  const searchInput = document.getElementById('userSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(loadUsersList, 300));
  }
  
  // Role filter handler
  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.addEventListener('change', loadUsersList);
  }
}

async function loadUsersList() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; color: var(--text-muted);">
        <div style="padding: 20px;">Memuat...</div>
      </td>
    </tr>
  `;

  try {
    const search = document.getElementById('userSearch')?.value || '';
    const role = document.getElementById('roleFilter')?.value || '';

    const data = await UserManagement.getUsers({ search, role });
    
    // API returns: { success: true, data: [...users], pagination: {...} }
    // Also handles: { success: true, data: { users: [...], total: n } }
    let users = [];
    let total = 0;

    if (Array.isArray(data.data)) {
      users = data.data;
      total = users.length;
    } else if (data.data?.users) {
      users = data.data.users;
      total = data.data.total || users.length;
    } else if (data.data?.data) {
      // Nested response
      const innerData = Array.isArray(data.data.data) ? data.data.data : data.data.data.users;
      users = Array.isArray(innerData) ? innerData : (innerData || []);
      total = data.data.data.total || users.length;
    }

    if (data.success && users.length > 0) {
      renderUsersTable(users);
      
      // Update count
      const countEl = document.getElementById('userCount');
      if (countEl) {
        countEl.textContent = `${total} pengguna`;
      }
    } else if (data.success && users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 12px;">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>Belum ada pengguna</p>
          </td>
        </tr>
      `;
      const countEl = document.getElementById('userCount');
      if (countEl) {
        countEl.textContent = '0 pengguna';
      }
    }
  } catch (error) {
    console.error('Failed to load users:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--danger);">
          Gagal memuat daftar pengguna
        </td>
      </tr>
    `;
  }
}

// Initialize Settings Page
function initSettingsPage() {
  loadSettingsProfile();
  loadSettingsUsers();
  initSettingsNav();
}

function initSettingsNav() {
  const navItems = document.querySelectorAll('.settings-nav__item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      
      // Update active
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Show/hide sections
      document.querySelectorAll('.settings-section').forEach(s => {
        s.style.display = 'none';
      });
      
      const targetSection = document.getElementById(`settings${section.charAt(0).toUpperCase() + section.slice(1)}`);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
    });
  });
}

async function loadSettingsProfile() {
  try {
    const data = await UserManagement.getProfile();
    
    if (data.success && data.data) {
      document.getElementById('profileName').value = data.data.nama_lengkap || '';
      document.getElementById('profileUsername').value = data.data.username || '';
      document.getElementById('profileEmail').value = data.data.email || '';
      document.getElementById('profileRole').value = data.data.role || '';
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

async function loadSettingsUsers() {
  const tbody = document.getElementById('settingsUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; color: var(--text-muted);">Memuat...</td>
    </tr>
  `;

  try {
    const data = await UserManagement.getUsers();
    
    // Same response format handling as loadUsersList
    let users = [];
    if (Array.isArray(data.data)) {
      users = data.data;
    } else if (data.data?.users) {
      users = data.data.users;
    } else if (data.data?.data) {
      const innerData = Array.isArray(data.data.data) ? data.data.data : data.data.data.users;
      users = Array.isArray(innerData) ? innerData : (innerData || []);
    }

    if (data.success && users.length > 0) {
      renderUsersTable(users, 'settingsUsersTableBody');
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted);">Belum ada pengguna</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Failed to load settings users:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat</td>
      </tr>
    `;
  }
}

// ============================================
// Action Functions
// ============================================

async function saveProfile() {
  const name = document.getElementById('profileName')?.value;
  const email = document.getElementById('profileEmail')?.value;

  try {
    await UserManagement.updateProfile({ name, email });
    showToast('Profil berhasil disimpan', 'success');
  } catch (error) {
    showToast(error.message || 'Gagal menyimpan profil', 'error');
  }
}

function cancelProfile() {
  loadSettingsProfile();
}

async function changePassword() {
  const oldPassword = document.getElementById('oldPassword')?.value;
  const newPassword = document.getElementById('newPassword')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    showToast('Mohon isi semua field', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Password baru tidak cocok', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Password minimal 6 karakter', 'error');
    return;
  }

  try {
    await UserManagement.changePassword(oldPassword, newPassword);
    showToast('Password berhasil diubah', 'success');
    
    // Clear form
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    showToast(error.message || 'Gagal mengubah password', 'error');
  }
}

async function changeEmail() {
  const newEmail = document.getElementById('newEmail')?.value;
  const password = document.getElementById('emailConfirmPassword')?.value;

  if (!newEmail || !password) {
    showToast('Mohon isi semua field', 'error');
    return;
  }

  try {
    await UserManagement.changeEmail(newEmail, password);
    showToast('Email berhasil diubah', 'success');
    
    // Clear form
    document.getElementById('newEmail').value = '';
    document.getElementById('emailConfirmPassword').value = '';
    
    // Reload profile
    loadSettingsProfile();
  } catch (error) {
    showToast(error.message || 'Gagal mengubah email', 'error');
  }
}

// User management actions
function openAddUserModal() {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Tambah User Baru</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="addUserForm">
          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input type="text" class="form-input" id="newUserName" required>
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-input" id="newUserUsername" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="newUserEmail" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="newUserPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-input form-select" id="newUserRole" required>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff_gudang" selected>Staff Gudang</option>
              <option value="checker_opname">Checker Opname</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Batal</button>
        <button class="btn btn-primary" onclick="submitAddUser()">Buat Akun</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (window.lucide) lucide.createIcons();
}

async function submitAddUser() {
  const name = document.getElementById('newUserName')?.value;
  const username = document.getElementById('newUserUsername')?.value;
  const email = document.getElementById('newUserEmail')?.value;
  const password = document.getElementById('newUserPassword')?.value;
  const role = document.getElementById('newUserRole')?.value;

  if (!name || !username || !email || !password) {
    showToast('Mohon isi semua field', 'error');
    return;
  }

  try {
    await UserManagement.createUser({ name, username, email, password, role });
    showToast('User berhasil dibuat', 'success');
    
    // Close modal
    document.querySelector('.modal-overlay.open')?.remove();
    
    // Reload users list
    loadUsersList();
    loadSettingsUsers();
  } catch (error) {
    showToast(error.message || 'Gagal membuat user', 'error');
  }
}

async function editUser(userId) {
  try {
    const data = await UserManagement.getUser(userId);
    
    if (data.success && data.data) {
      const user = data.data;
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay open';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Edit User</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            <form id="editUserForm">
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <input type="text" class="form-input" id="editUserName" value="${user.name}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="editUserEmail" value="${user.email}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-input form-select" id="editUserRole" required>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                  <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                  <option value="staff_gudang" ${user.role === 'staff_gudang' ? 'selected' : ''}>Staff Gudang</option>
                  <option value="checker_opname" ${user.role === 'checker_opname' ? 'selected' : ''}>Checker Opname</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Batal</button>
            <button class="btn btn-primary" onclick="submitEditUser(${userId})">Simpan</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      if (window.lucide) lucide.createIcons();
    }
  } catch (error) {
    showToast(error.message || 'Gagal memuat data user', 'error');
  }
}

async function submitEditUser(userId) {
  const name = document.getElementById('editUserName')?.value;
  const email = document.getElementById('editUserEmail')?.value;
  const role = document.getElementById('editUserRole')?.value;

  try {
    await UserManagement.updateUser(userId, { name, email, role });
    showToast('User berhasil diupdate', 'success');
    
    document.querySelector('.modal-overlay.open')?.remove();
    loadUsersList();
    loadSettingsUsers();
  } catch (error) {
    showToast(error.message || 'Gagal mengupdate user', 'error');
  }
}

async function resetUserPassword(userId) {
  if (!confirm('Reset password untuk user ini?')) return;

  try {
    const data = await UserManagement.resetPassword(userId);
    showToast(`Password direset. Temporary password: ${data.data?.temp_password || 'N/A'}`, 'success');
  } catch (error) {
    showToast(error.message || 'Gagal reset password', 'error');
  }
}

async function enableUserAccount(userId) {
  if (!confirm('Aktifkan user ini?')) return;

  try {
    await UserManagement.enableUser(userId);
    showToast('User berhasil diaktifkan', 'success');
    loadUsersList();
    loadSettingsUsers();
  } catch (error) {
    showToast(error.message || 'Gagal mengaktifkan user', 'error');
  }
}

async function disableUserAccount(userId) {
  if (!confirm('Nonaktifkan user ini?')) return;

  try {
    await UserManagement.disableUser(userId);
    showToast('User berhasil dinonaktifkan', 'success');
    loadUsersList();
    loadSettingsUsers();
  } catch (error) {
    showToast(error.message || 'Gagal menonaktifkan user', 'error');
  }
}

async function deleteUserAccount(userId) {
  if (!confirm('Hapus user ini? Action ini tidak bisa dibatalkan.')) return;

  try {
    await UserManagement.deleteUser(userId);
    showToast('User berhasil dihapus', 'success');
    loadUsersList();
    loadSettingsUsers();
  } catch (error) {
    showToast(error.message || 'Gagal menghapus user', 'error');
  }
}

// Utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Make functions globally available
window.initDashboardPage = initDashboardPage;
window.initUsersPage = initUsersPage;
window.initSettingsPage = initSettingsPage;
window.saveProfile = saveProfile;
window.cancelProfile = cancelProfile;
window.changePassword = changePassword;
window.changeEmail = changeEmail;
window.openAddUserModal = openAddUserModal;
window.submitAddUser = submitAddUser;
window.editUser = editUser;
window.submitEditUser = submitEditUser;
window.resetUserPassword = resetUserPassword;
window.enableUserAccount = enableUserAccount;
window.disableUserAccount = disableUserAccount;
window.deleteUserAccount = deleteUserAccount;