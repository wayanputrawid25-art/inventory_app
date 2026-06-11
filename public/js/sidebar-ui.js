// UI-only sidebar helpers for refactor/sidebar-ui branch
// Adds functions to build the sidebar dynamically, handle mobile drawer, and manage collapsed state.

// Preserve existing global variables and functions used by the app.
// This file intentionally does not modify API/auth/business logic.

(function(window){
  if (!window) return;

  const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';

  function isSidebarCollapsed(){
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  }

  function setSidebarCollapsed(v){
    if (v) window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY,'1');
    else window.localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
    document.querySelectorAll('.sidebar').forEach(s => s.classList.toggle('sidebar--collapsed', !!v));
  }

  function toggleSidebarCollapse(){
    setSidebarCollapsed(!isSidebarCollapsed());
  }

  function openMobileMenu(){
    document.body.classList.add('sidebar-open');
    document.querySelectorAll('.sidebar').forEach(s => s.classList.add('sidebar--open'));
    const first = document.querySelector('.sidebar li');
    first?.focus?.();
  }

  function closeMobileMenu(){
    document.body.classList.remove('sidebar-open');
    document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('sidebar--open'));
  }

  function toggleMobileMenu(){
    if (document.body.classList.contains('sidebar-open')) closeMobileMenu();
    else openMobileMenu();
  }

  // Switch sidebar based on user role (V3 spec)
  function switchSidebarByRole(role) {
    const adminSidebar = document.getElementById('adminSidebar');
    const userSidebar = document.getElementById('userSidebar');
    const dbStatus = document.getElementById('sidebarDbStatus');
    
    if (!adminSidebar || !userSidebar) return;
    
    if (role === 'admin') {
      adminSidebar.style.display = 'block';
      userSidebar.style.display = 'none';
    } else {
      adminSidebar.style.display = 'none';
      userSidebar.style.display = 'block';
    }
    
    // Update database status indicator
    if (dbStatus) {
      dbStatus.textContent = 'Database Terhubung';
    }
  }

  // Build sidebar from existing markup or from allowed menus. Uses existing canAccessMenu() and getAllowedMenus()
  function buildSidebarMenu(){
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const ul = sidebar.querySelector('ul');
    if (!ul) return;
    // Keep any static items (logo) but rebuild list to ensure audit menu visibility controlled by role
    const allowed = typeof getAllowedMenus === 'function' ? getAllowedMenus() : null;
    const menus = [
      {id:'penjualan', icon:'bar-chart-3', label:'Penjualan'},
      {id:'persediaan', icon:'boxes', label:'Persediaan'},
      {id:'forecast', icon:'trending-up', label:'Forecasting'},
      {id:'opname', icon:'package-check', label:'Stok Opname'},
      {id:'approval', icon:'check-circle', label:'Approval'},
      {id:'reports', icon:'file-text', label:'Reports'},
      {id:'audit', icon:'shield', label:'Audit'},
      {id:'settings', icon:'settings', label:'Settings'}
    ];

    // Clear existing list
    ul.innerHTML = '';

    menus.forEach(menu => {
      // role filtering: if allowed provided, skip if not allowed
      if (Array.isArray(allowed) && !allowed.includes(menu.id)) {
        // Special-case: audit should be visible only to admin roles; if allowed list doesn't include it skip
        return;
      }

      const li = document.createElement('li');
      li.setAttribute('data-menu', menu.id);
      li.setAttribute('tabindex','0');
      li.setAttribute('role','button');
      li.onclick = (e) => selectMenu(e, menu.id);
      li.onkeydown = (e) => { if (e.key === 'Enter') selectMenu(e, menu.id); if (e.key === 'ArrowDown') focusNextMenuItem(li); if (e.key === 'ArrowUp') focusPrevMenuItem(li); };

      const ic = document.createElement('i');
      ic.setAttribute('data-lucide', menu.icon);
      li.appendChild(ic);

      const span = document.createElement('span');
      span.textContent = menu.label;
      li.appendChild(span);

      ul.appendChild(li);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function focusNextMenuItem(current){
    const items = Array.from(document.querySelectorAll('.sidebar li'));
    const idx = items.indexOf(current);
    const next = items[idx+1] || items[0];
    next?.focus?.();
  }
  function focusPrevMenuItem(current){
    const items = Array.from(document.querySelectorAll('.sidebar li'));
    const idx = items.indexOf(current);
    const prev = items[idx-1] || items[items.length-1];
    prev?.focus?.();
  }

  // Hook into page load
  document.addEventListener('DOMContentLoaded', function(){
    try{
      buildSidebarMenu();
      // Restore collapsed state
      setSidebarCollapsed(isSidebarCollapsed());

      // Wire mobile toggle buttons if not already using existing ones
      document.querySelectorAll('.mobile-menu-toggle').forEach(btn => {
        btn.onclick = toggleMobileMenu;
        btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); toggleMobileMenu(); } });
      });

      // Backdrop
      const backdrop = document.querySelector('.mobile-menu-backdrop');
      backdrop && backdrop.addEventListener('click', closeMobileMenu);

      // Add collapse control to sidebar
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'sidebar-collapse';
      collapseBtn.setAttribute('aria-label','Toggle sidebar');
      collapseBtn.innerHTML = '<i data-lucide="chevrons-left"></i>';
      collapseBtn.onclick = toggleSidebarCollapse;
      collapseBtn.onkeydown = (e)=>{ if(e.key==='Enter') toggleSidebarCollapse(); };
      document.querySelector('.sidebar .logo')?.appendChild(collapseBtn);
      if (window.lucide) window.lucide.createIcons();
      
      // Initialize sidebar based on current auth state
      const storedAuth = window.localStorage.getItem('auth_user');
      if (storedAuth) {
        try {
          const auth = JSON.parse(storedAuth);
          if (auth?.role) {
            switchSidebarByRole(auth.role);
          }
        } catch (e) {
          console.warn('Could not parse auth for sidebar switch', e);
        }
      }
    } catch (err) {
      console.error('sidebar-ui init error', err);
    }
  });

  // Expose functions for debugging/testing
  window.toggleSidebarCollapse = toggleSidebarCollapse;
  window.openMobileMenu = openMobileMenu;
  window.closeMobileMenu = closeMobileMenu;
  window.toggleMobileMenu = toggleMobileMenu;
  window.buildSidebarMenu = buildSidebarMenu;
  window.switchSidebarByRole = switchSidebarByRole;

})(window);
