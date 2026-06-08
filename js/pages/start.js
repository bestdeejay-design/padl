// ============================================================
// PADELPRO — ЛЕНДИНГ
// ============================================================

const StartPage = {
  render() {
    App.setTitle('PadelPro');
    App.setHeaderActions('');
    App.setSidebar([]);
    App.setBottomNav([]);
    $('.page-header').style.display = 'none';
    $('.main-content').style.background = '#f8fafc';

    App.renderPage(`
      <div class="landing">

        <!-- HERO -->
        <section class="hero reveal">
          <div class="hero-content">
            <div class="hero-badge anim-badge">
              <i class="fa-solid fa-table-tennis-paddle-ball"></i> SaaS для падел-клубов
            </div>
            <h1 class="hero-title anim-title">Padel<span>Pro</span></h1>
            <p class="hero-subtitle anim-sub">Первый специализированный SaaS для управления падел-клубом в России и СНГ</p>
            <p class="hero-desc anim-scroll">Автоматизация финансов &bull; Контроль тренеров &bull; Аналитика кортов</p>
          </div>
          <div class="hero-scroll"><i class="fa-solid fa-chevron-down"></i></div>
        </section>

        <!-- LIVE STATS -->
        <section class="stats-section reveal">
          <div class="stats-grid">
            <div class="stat-item"><div class="stat-value" data-target="25">0%</div><div class="stat-label">потерь от левачества</div></div>
            <div class="stat-item"><div class="stat-value" data-target="5">0</div><div class="stat-label">часов экономии в день</div></div>
            <div class="stat-item"><div class="stat-value" data-target="100">0%</div><div class="stat-label">прозрачность P&L</div></div>
            <div class="stat-item"><div class="stat-value" data-target="24">0</div><div class="stat-label">/ 7 доступ с телефона</div></div>
          </div>
        </section>

        <!-- FEATURES -->
        <section class="features-section section reveal">
          <div class="section-inner">
            <div class="section-label">Что вы получаете</div>
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon fi-1"><i class="fa-solid fa-chart-line"></i></div>
                <h3>P&L в реальном времени</h3>
                <p>Выручка, расходы, чистая прибыль обновляются автоматически с каждой бронью. Открыли телефон — увидели всю картину.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon fi-2"><i class="fa-solid fa-shield-halved"></i></div>
                <h3>Честный корт</h3>
                <p>QR-код + IP-камера. Двойной контроль. Левачество исключено физически, а не зависит от доверия к персоналу.</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon fi-3"><i class="fa-solid fa-coins"></i></div>
                <h3>Авторасчёт зарплат</h3>
                <p>Система сама считает часы и начисляет зарплату на основе проведённых тренировок. Ведомость в один клик.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- MODULES -->
        <section class="modules-section section reveal">
          <div class="section-inner">
            <h2 class="section-title">5 модулей. Один инструмент.</h2>
            <div class="module-list">
              <div class="module-row"><span class="module-num">01</span><div><div class="module-name">Финансы и P&L</div><div class="module-desc">Выручка, расходы, чистая прибыль обновляются автоматически</div></div></div>
              <div class="module-row"><span class="module-num">02</span><div><div class="module-name">Контроль тренеров</div><div class="module-desc">QR-код + IP-камера: двойной контроль левачества</div></div></div>
              <div class="module-row"><span class="module-num">03</span><div><div class="module-name">Авторасчёт зарплат</div><div class="module-desc">Часы и начисления считаются автоматически</div></div></div>
              <div class="module-row"><span class="module-num">04</span><div><div class="module-name">Аналитика кортов</div><div class="module-desc">Загрузка, выручка, пиковые часы по каждому корту</div></div></div>
              <div class="module-row"><span class="module-num">05</span><div><div class="module-name">Абонементы и клиенты</div><div class="module-desc">Автосписание визитов и история каждого клиента</div></div></div>
            </div>
          </div>
        </section>

        <!-- ROLES -->
        <section class="roles-section">
          <div class="roles-header reveal">
            <div class="section-label">Демо-доступ</div>
            <h2 class="roles-title">Попробуйте прямо сейчас</h2>
            <p class="roles-subtitle">Три роли — три интерфейса. Выберите, чтобы войти.</p>
          </div>
          <div class="roles-grid reveal">
            <div class="role-card" data-role="client">
              <div class="role-icon ri-1"><i class="fa-solid fa-user"></i></div>
              <div class="role-name">Клиент</div>
              <div class="role-desc">Запись на тренировки, сканер QR, управление абонементом</div>
              <div class="role-hint"><i class="fa-solid fa-mobile-screen"></i>+7 900 123-45-67</div>
            </div>
            <div class="role-card" data-role="trainer">
              <div class="role-icon ri-2"><i class="fa-solid fa-user-tie"></i></div>
              <div class="role-name">Тренер</div>
              <div class="role-desc">Расписание, генерация QR-кода, зарплата</div>
              <div class="role-hint"><i class="fa-solid fa-key"></i>Код 1111</div>
            </div>
            <div class="role-card" data-role="admin">
              <div class="role-icon ri-3"><i class="fa-solid fa-gear"></i></div>
              <div class="role-name">Администратор</div>
              <div class="role-desc">Дашборд, сетка расписания, аналитика, CSV</div>
              <div class="role-hint"><i class="fa-solid fa-lock"></i>admin / admin123</div>
            </div>
          </div>
        </section>

        <!-- PRICING -->
        <section class="pricing-section section reveal">
          <div class="section-inner">
            <div class="pricing-card">
              <div class="pricing-label">Прозрачная цена</div>
              <div class="pricing-price">50 000 ₽</div>
              <div class="pricing-period">/ месяц</div>
              <ul class="pricing-features">
                <li><i class="fa-solid fa-check"></i> Все 5 модулей</li>
                <li><i class="fa-solid fa-check"></i> Честный корт (QR + камера)</li>
                <li><i class="fa-solid fa-check"></i> Бесплатные обновления</li>
                <li><i class="fa-solid fa-check"></i> Техподдержка 24/7</li>
                <li><i class="fa-solid fa-check"></i> Интеграция с YClients, Telegram</li>
              </ul>
              <p class="pricing-note">Пробный период 1–2 месяца бесплатно. Никаких скрытых платежей.</p>
              <div class="pricing-btn">Попробовать бесплатно</div>
            </div>
          </div>
        </section>

        <!-- FOOTER -->
        <footer class="footer">
          <div class="footer-grid">
            <div>
              <div class="footer-brand">PadelPro</div>
              <p class="footer-desc">Первый специализированный SaaS для управления падел-клубом в России и СНГ.</p>
            </div>
            <div class="footer-col">
              <h4>Продукт</h4>
              <a href="#/admin">Финансы и P&L</a>
              <a href="#/admin/trainers">Управление тренерами</a>
              <a href="#/admin/courts">Аналитика кортов</a>
              <a href="#/admin/clients">Абонементы</a>
            </div>
            <div class="footer-col">
              <h4>Контакты</h4>
              <a href="mailto:hello@padelpro.ru">hello@padelpro.ru</a>
              <a href="tel:+74951234567">+7 495 123-45-67</a>
            </div>
          </div>
          <div class="footer-bottom">&copy; 2026 PadelPro. Все права защищены.</div>
        </footer>
      </div>
    `);

    // Role card clicks
    $$('.role-card').forEach(function(card) {
      card.addEventListener('click', function() {
        window.location.hash = '#/login/' + this.dataset.role;
      });
    });

    // Reveal on scroll
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    $$('.reveal').forEach(function(el) { observer.observe(el); });

    // Count-up
    var statObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.dataset.target) || 0;
          var start = performance.now();
          var duration = 1800;
          function update(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.round(eased * target);
            var suffix = (target === 25 || target === 100) ? '%' : '';
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
          }
          requestAnimationFrame(update);
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    $$('.stat-value[data-target]').forEach(function(el) { statObserver.observe(el); });

    window.addEventListener('hashchange', function() {
      $('.page-header').style.display = '';
      $('.main-content').style.background = '';
    }, { once: true });
  }
};
