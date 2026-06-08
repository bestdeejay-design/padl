// ============================================================
// PADELPRO — MAIN APP SHELL
// ============================================================

const App = {
  state: null,
  role: null,
  userId: null,

  init() {
    this.state = DataService.init();

    // Restore session from sessionStorage
    const saved = sessionStorage.getItem('padelpro_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        this.role = s.role;
        this.userId = s.userId;
      } catch(e) {}
    }

    this.renderShell();
    this.bindEvents();
    this.route();

    window.addEventListener('hashchange', () => this.route());
    EventBus.on('data-changed', () => { this.state = DataService.state; });
  },

  login(role, userId) {
    this.role = role;
    this.userId = userId;
    sessionStorage.setItem('padelpro_session', JSON.stringify({ role, userId }));
  },

  logout() {
    this.role = null;
    this.userId = null;
    sessionStorage.removeItem('padelpro_session');
    window.location.hash = '#/';
  },

  renderShell() {
    document.body.innerHTML = `
      <div class="app-layout">
        <div class="sidebar" id="sidebar">
          <div class="sidebar-demo-badge">ДЕМО-ВЕРСИЯ</div>
          <div class="sidebar-brand">Padel<span>Pro</span></div>
          <nav class="sidebar-nav" id="sidebar-nav"></nav>
          <div class="sidebar-footer">
            &copy; PadelPro &bull; 50&nbsp;000&nbsp;₽/мес &bull; пробный период 1&ndash;2&nbsp;мес
          </div>
        </div>

        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <div class="main-content">
          <header class="page-header">
            <button class="mobile-toggle" id="btn-menu">☰</button>
            <div class="page-title" id="page-title">PadelPro</div>
            <div id="header-actions"></div>
          </header>
          <div class="page-body" id="page-body"></div>
        </div>
      </div>

      <div class="bottom-nav" id="bottom-nav" style="display:none;"></div>

      <div class="modal-overlay" id="modal-overlay"></div>
      <div class="toast-container" id="toast-container"></div>
    `;
  },

  bindEvents() {
    $('#btn-menu').addEventListener('click', () => this.toggleSidebar());
    $('#sidebar-overlay').addEventListener('click', () => this.toggleSidebar());
    $('#modal-overlay').addEventListener('click', (e) => {
      if (e.target === $('#modal-overlay')) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  toggleSidebar() {
    const sb = $('#sidebar');
    const overlay = $('#sidebar-overlay');
    sb.classList.toggle('open');
    overlay.classList.toggle('show');
  },

  setTitle(title) {
    $('#page-title').innerHTML = title;
    document.title = title + ' — PadelPro';
  },

  setBreadcrumbs(crumbs) {
    const el = $('#page-title');
    if (!crumbs || crumbs.length === 0) return;
    el.innerHTML = crumbs.map((c, i) => {
      if (c.route) return `<a href="${c.route}" style="color:var(--text-muted);font-size:13px;">${c.label}</a>${i < crumbs.length-1 ? ' <span style="color:var(--text-muted);margin:0 4px;">/</span> ' : ''}`;
      return `<span style="font-weight:700;font-size:13px;">${c.label}</span>`;
    }).join('');
  },

  setHeaderActions(html) {
    $('#header-actions').innerHTML = html || '';
  },

  setSidebar(items) {
    const layout = $('.app-layout');
    if (!items || items.length === 0) {
      layout.classList.add('no-sidebar');
      $('#sidebar-nav').innerHTML = '';
      return;
    }
    layout.classList.remove('no-sidebar');
    $('#sidebar-nav').innerHTML = items.map(item => {
      if (item.section) return '<div class="sidebar-section">' + item.section + '</div>';
      return `
        <div class="sidebar-item ${item.active ? 'active' : ''}" data-route="${item.route || ''}">
          <i class="${item.icon || 'fa-solid fa-circle'}"></i>
          <span>${item.label}</span>
          ${item.badge ? '<span class="sidebar-badge">' + item.badge + '</span>' : ''}
        </div>
      `;
    }).join('');

    $$('.sidebar-item').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.route;
        if (route) {
          window.location.hash = route;
          this.toggleSidebar();
        }
      });
    });
  },

  setBottomNav(items) {
    const el = $('#bottom-nav');
    if (!items || items.length === 0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'flex';
    el.innerHTML = items.map(item => `
      <button class="bottom-nav-item ${item.active ? 'active' : ''}" data-route="${item.route || ''}">
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      </button>
    `).join('');

    $$('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        if (route) window.location.hash = route;
      });
    });
  },

  renderPage(html) {
    $('#page-body').innerHTML = html;
    window.scrollTo(0, 0);
  },

  // --- MODAL ---

  openModal(html) {
    const overlay = $('#modal-overlay');
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    overlay.classList.add('active');

    const closeBtn = $('.modal-close', overlay);
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
  },

  closeModal() {
    const overlay = $('#modal-overlay');
    overlay.classList.remove('active');
    overlay.innerHTML = '';
  },

  // --- TOAST ---

  toast(message, type = 'info') {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.2s';
      setTimeout(() => el.remove(), 200);
    }, 3000);
  },

  // --- ROUTING (placeholder, will expand) ---

  route() {
    // Reset header (hidden by landing page)
    $('.page-header').style.display = '';
    $('.main-content').style.background = '';

    // stop scanner & timers when navigating away
    if (typeof ClientPage !== 'undefined' && ClientPage._stopScanner) {
      ClientPage._stopScanner();
    }
    if (typeof activeTimerInterval !== 'undefined' && activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }
    if (typeof qrTimerInterval !== 'undefined' && qrTimerInterval) {
      clearInterval(qrTimerInterval);
      qrTimerInterval = null;
    }

    const hash = window.location.hash || '#/';

    // Start page
    if (hash === '#/' || hash === '') {
      return StartPage.render();
    }

    // Login pages
    if (hash === '#/login/client') return ClientPage.renderLogin();
    if (hash === '#/login/trainer') return TrainerPage.renderLogin();
    if (hash === '#/login/admin') return AdminPage.renderLogin();
    // Admin pages
    if (hash === '#/admin') return AdminPage.render();
    if (hash === '#/admin/schedule' || hash.startsWith('#/admin/schedule/') || hash.startsWith('#/admin/schedule?')) return AdminPage.renderSchedule();
    if (hash === '#/admin/bookings') return AdminPage.renderBookings();
    if (hash === '#/admin/trainers') return AdminPage.renderTrainers();
    if (hash === '#/admin/clients') return AdminPage.renderClients();
    if (hash === '#/admin/courts') return AdminPage.renderCourts();
    if (hash === '#/admin/finance') return AdminPage.renderFinance();
    if (hash === '#/admin/registry') return AdminPage.renderRegistry();

    // Client pages
    if (hash === '#/client') return ClientPage.render();
    if (hash === '#/client/book') return ClientPage.renderBook();
    if (hash === '#/client/scan') return ClientPage.renderScan();
    if (hash === '#/client/profile') return ClientPage.renderProfile();

    // Trainer pages
    if (hash === '#/trainer') return TrainerPage.render();
    if (hash === '#/trainer/salary' || hash.startsWith('#/trainer/salary/')) return TrainerPage.renderSalary();
    if (hash === '#/trainer/profile') return TrainerPage.renderProfile();

    // Fallback
    App.renderPage('<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Страница не найдена</div></div>');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
