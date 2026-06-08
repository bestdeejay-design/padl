// ============================================================
// PADELPRO — МОДУЛЬ ТРЕНЕРА (РАСШИРЕННЫЙ)
// ============================================================

let qrTimerInterval = null;
let activeTimerInterval = null;

const TrainerPage = {

  /* ---- LOGIN ---- */

  renderLogin() {
    App.setTitle(''); App.setHeaderActions(''); App.setSidebar([]); App.setBottomNav([]);
    const trainers = DataService.trainers().filter(t => t.active);

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <div class="mobile-logo" onclick="window.location.hash='#/'" style="cursor:pointer;">Padel<span>Pro</span></div>
          <button class="mobile-back" onclick="window.location.hash='#/'">← На главную</button>
        </div>
        <div class="mobile-body">
          <div class="mobile-section-title">Вход для тренера</div>
          <div class="mobile-section-sub">Выберите тренера или введите код</div>
          <div class="mobile-card-list">${trainers.map(t => `
            <div class="client-login-card" data-code="${t.code}">
              <div class="client-login-avatar" style="background:#d1fae5;color:#065f46;">${t.name.charAt(0)}</div>
              <div class="client-login-info">
                <div class="client-login-name">${t.name}</div>
                <div class="client-login-phone">${(t.specializations||[]).join(', ')} &bull; ${fmtMoney(t.ratePerHour)} ₽/ч</div>
              </div>
              <span class="badge badge-purple">${t.code}</span>
            </div>
          `).join('')}</div>
          <div class="mobile-divider">или введите код</div>
          <div class="mobile-input-group">
            <input type="text" class="mobile-input" id="login-code" placeholder="Код тренера">
            <div class="mobile-error" id="login-error"></div>
          </div>
          <button class="mobile-btn mobile-btn-primary" id="btn-login">Войти</button>
        </div>
      </div>
    `);
    $$('.client-login-card').forEach(c => c.addEventListener('click', () => this._doLogin(c.dataset.code)));
    $('#btn-login').addEventListener('click', () => this._doLogin($('#login-code').value.trim()));
    $('#login-code').addEventListener('keydown', e => { if (e.key === 'Enter') this._doLogin($('#login-code').value.trim()); });
  },

  _doLogin(code) {
    if (!code) { $('#login-error').textContent = 'Введите код тренера'; return; }
    const t = DataService.trainers().find(tr => tr.code === code);
    if (t) { App.login('trainer', t.id); window.location.hash = '#/trainer'; }
    else { $('#login-error').textContent = 'Тренер с таким кодом не найден'; }
  },

  /* ---- DASHBOARD ---- */

  render() {
    const trainer = DataService.findTrainer(App.userId);
    if (!trainer) { window.location.hash = '#/login/trainer'; return; }
    App.setTitle(''); App.setHeaderActions(''); App.setSidebar([]);

    const today = todayStr();
    const allBookings = DataService.bookings()
      .filter(b => b.trainerId === trainer.id).sort((a, b) => a.date.localeCompare(b.date) || b.timeStart.localeCompare(b.timeStart));
    const todayBookings = allBookings.filter(b => b.date === today && b.status !== 'cancelled');
    const tomorrowBookings = allBookings.filter(b => b.date === daysFromNow(1) && b.status !== 'cancelled');
    const weekBookings = allBookings.filter(b => b.date >= today && b.date <= daysFromNow(6) && b.status !== 'cancelled');

    const monthStart = today.slice(0,7) + '-01';
    const monthCompleted = allBookings.filter(b => b.date >= monthStart && b.status === 'completed');
    const monthHours = monthCompleted.length;
    const monthEarned = monthCompleted.reduce((s, b) => s + (b.trainerPay || 0), 0);

    // Active session
    const activeSession = allBookings.find(b => b.status === 'in_progress');
    const activeHtml = activeSession ? this._activeSessionBar(activeSession) : '';

    const renderList = (list) => {
      if (list.length === 0) return '<div class="mobile-empty"><div class="mobile-empty-icon"><i class="fa-solid fa-calendar-days"></i></div><div>Нет тренировок</div></div>';
      return list.map(b => this._bookingCard(b)).join('');
    };

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <div class="mobile-logo" onclick="window.location.hash='#/'" style="cursor:pointer;">Padel<span>Pro</span></div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-secondary);">${trainer.name}</span>
            <span class="badge badge-purple" style="font-size:10px;">${trainer.code}</span>
          </div>
          <button class="mobile-back" onclick="App.logout()">Выйти</button>
        </div>

        <div class="trainer-stats-bar">
          <div class="tstat"><div class="tstat-val">${monthHours}</div><div class="tstat-lbl">часов за месяц</div></div>
          <div class="tstat"><div class="tstat-val" style="color:var(--success);">${fmtMoney(monthEarned)} ₽</div><div class="tstat-lbl">заработано</div></div>
          <div class="tstat"><div class="tstat-val">${fmtMoney(trainer.ratePerHour)} ₽</div><div class="tstat-lbl">ставка / час</div></div>
        </div>

        ${activeHtml}

        <div class="mobile-body">
          <div class="mobile-tabs" id="trainer-tabs">
            <button class="mobile-tab active" data-tab="today">Сегодня (${todayBookings.length})</button>
            <button class="mobile-tab" data-tab="tomorrow">Завтра (${tomorrowBookings.length})</button>
          <button class="mobile-tab" data-tab="week">Неделя (${weekBookings.length})</button>
        </div>
        <div id="trainer-bookings-list">${renderList(todayBookings)}</div>
      </div>

      <div class="mobile-bottom-nav">
        <button class="mnav-item active" data-route="#/trainer"><i class="fa-solid fa-calendar-days"></i><span>Расписание</span></button>
        <button class="mnav-item" data-route="#/trainer/salary"><i class="fa-solid fa-coins"></i><span>Зарплата</span></button>
        <button class="mnav-item" data-route="#/trainer/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
      </div>
    </div>`);

    this._bindBottomNav();

    let currentTab = 'today';
    const tabData = { today: todayBookings, tomorrow: tomorrowBookings, week: weekBookings };
    $$('#trainer-tabs .mobile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('#trainer-tabs .mobile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        $('#trainer-bookings-list').innerHTML = renderList(tabData[currentTab]);
        TrainerPage._bindActions();
      });
    });

    this._bindActions();
    this._bindActiveTimer();
  },

  _activeSessionBar(b) {
    const client = DataService.findClient(b.clientId);
    const court = DataService.findCourt(b.courtId);
    return `
      <div class="active-session-bar" id="active-session" data-booking="${b.id}" data-started="${b.startedAt || ''}">
        <div class="asb-pulse"></div>
        <div class="asb-info">
          <div class="asb-label">Активная тренировка</div>
          <div class="asb-detail">${b.timeStart} — ${client?client.name:'—'} — ${court?court.name:'—'}</div>
        </div>
        <div class="asb-timer" id="asb-timer">00:00</div>
        <button class="mobile-btn mobile-btn-sm mobile-btn-danger" data-action="finish" data-id="${b.id}">Завершить</button>
      </div>
    `;
  },

  _bindActiveTimer() {
    if (activeTimerInterval) clearInterval(activeTimerInterval);
    const bar = $('#active-session');
    if (!bar) return;
    const started = bar.dataset.started;
    if (!started) return;
    const timerEl = $('#asb-timer');
    if (!timerEl) return;

    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(started).getTime()) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      timerEl.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    };
    update();
    activeTimerInterval = setInterval(update, 1000);

    const finishBtn = $('#active-session [data-action="finish"]');
    if (finishBtn) {
      finishBtn.addEventListener('click', function() {
        TrainerPage._finishTraining(this.dataset.id);
      });
    }
  },

  _bookingCard(b) {
    const client = DataService.findClient(b.clientId);
    const court = DataService.findCourt(b.courtId);
    const sc = { scheduled:'blue', in_progress:'orange', completed:'gray', cancelled:'red', no_show:'red' }[b.status] || 'gray';
    const st = { scheduled:'Запланирована', in_progress:'Идёт', completed:'Завершена', cancelled:'Отменена', no_show:'Неявка' }[b.status] || b.status;

    let actions = '';
    if (b.status === 'scheduled') {
      actions = `<button class="mobile-btn mobile-btn-sm mobile-btn-primary" data-action="start" data-id="${b.id}">Начать</button>`;
    } else if (b.status === 'in_progress') {
      actions = `<span style="font-size:12px;color:var(--warning);"><i class="fa-solid fa-clock"></i> Ожидает клиента</span>`;
    }

    return `
      <div class="mobile-booking-card">
        <div class="mbc-top">
          <div class="mbc-time"><span class="mbc-time-val">${b.timeStart.slice(0,5)}</span><span class="mbc-date">${fmtDate(b.date)}</span></div>
          <div class="mbc-info"><div class="mbc-trainer">${client?client.name:'—'}</div><div class="mbc-court">${court?court.name:'—'} &bull; ${fmtMoney(b.price)} ₽</div></div>
          <span class="badge badge-${sc}">${st}</span>
        </div>
        ${actions ? `<div class="mbc-actions">${actions}</div>` : ''}
        ${b.status === 'completed' && !b.confirmedAt ? '<div class="mbc-alert"><i class="fa-solid fa-triangle-exclamation"></i> Без подтверждения клиента</div>' : ''}
      </div>
    `;
  },

  _bindActions() {
    $$('[data-action="start"]').forEach(btn => btn.addEventListener('click', () => this._startTraining(btn.dataset.id)));
    $$('[data-action="finish"]').forEach(btn => btn.addEventListener('click', () => this._finishTraining(btn.dataset.id)));
  },

  /* ---- QR & TRAINING ---- */

  _startTraining(bookingId) {
    const b = DataService.findBooking(bookingId);
    if (!b || b.status !== 'scheduled') return;
    DataService.updateBooking(bookingId, { status: 'in_progress', startedAt: new Date().toISOString() });

    const qrData = JSON.stringify({ booking_id: b.id, trainer_id: b.trainerId, court_id: b.courtId, time: b.timeStart, date: b.date });
    const trainer = DataService.findTrainer(b.trainerId);
    const court = DataService.findCourt(b.courtId);
    const qrExpires = Date.now() + 300000; // 5 min

    App.openModal(`
      <div style="text-align:center;padding:20px;">
        <h3 style="margin-bottom:4px;"><i class="fa-solid fa-qrcode"></i> QR-код тренировки</h3>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">${b.timeStart} — ${trainer?trainer.name:''} — ${court?court.name:''}</p>
        <p style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">Клиент должен отсканировать для подтверждения</p>
        <div id="qr-code-box" style="display:flex;justify-content:center;margin-bottom:12px;"></div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">
          <i class="fa-solid fa-clock"></i> Действителен до: <strong id="qr-timer-display">05:00</strong>
        </p>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-outline btn-sm" id="btn-refresh-qr"><i class="fa-solid fa-arrows-rotate"></i> Обновить</button>
          <button class="btn btn-outline btn-sm" id="btn-close-qr">Закрыть</button>
        </div>
      </div>
    `);

    const renderQr = () => {
    const qrEl = $('#qr-code-box');
    if (!qrEl) return;
    qrEl.innerHTML = '';
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrEl, { text: qrData, width: 180, height: 180, colorDark: '#0f172a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    }
    App.toast('QR обновлён', 'info');
    };
    renderQr();

    $('#btn-refresh-qr').addEventListener('click', renderQr);

    $('#btn-close-qr').addEventListener('click', () => {
      App.closeModal();
      if (qrTimerInterval) { clearInterval(qrTimerInterval); qrTimerInterval = null; }
      window.location.hash = '#/trainer';
    });

    // Timer
    if (qrTimerInterval) clearInterval(qrTimerInterval);
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((qrExpires - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      $('#qr-timer-display').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      if (remaining <= 0) {
        clearInterval(qrTimerInterval);
        $('#qr-timer-display').textContent = 'Истёк';
        App.toast('QR-код истёк. Нажмите «Обновить»', 'error');
      }
    };
    updateTimer();
    qrTimerInterval = setInterval(updateTimer, 1000);
  },

  _finishTraining(bookingId) {
    const b = DataService.findBooking(bookingId);
    if (!b || b.status !== 'in_progress') return;
    if (qrTimerInterval) { clearInterval(qrTimerInterval); qrTimerInterval = null; }
    DataService.updateBooking(bookingId, { status: 'completed', trainerPay: DataService.findTrainer(b.trainerId)?.ratePerHour || 0 });
    App.closeModal();
    App.toast('Тренировка завершена', 'success');
    TrainerPage.render();
  },

  /* ---- SALARY ---- */

  renderSalary() {
    const trainer = DataService.findTrainer(App.userId);
    if (!trainer) { window.location.hash = '#/login/trainer'; return; }
    App.setTitle(''); App.setHeaderActions(''); App.setSidebar([]);

    const currentMonth = todayStr().slice(0, 7);
    const allCompleted = DataService.bookings()
      .filter(b => b.trainerId === trainer.id && b.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date) || b.timeStart.localeCompare(b.timeStart));
    const months = [...new Set(allCompleted.map(b => b.date.slice(0, 7)))].sort().reverse();
    const hashMonth = window.location.hash.split('/')[3] || '';
    const selectedMonth = hashMonth || months[0] || currentMonth;
    const monthStart = selectedMonth + '-01';

    const completed = allCompleted.filter(b => b.date >= monthStart && b.date <= selectedMonth + '-31');
    const total = completed.reduce((s, b) => s + (b.trainerPay || 0), 0);

    // Group by day
    const byDay = {};
    completed.forEach(b => {
      const d = b.date;
      if (!byDay[d]) byDay[d] = { total: 0, count: 0, items: [] };
      byDay[d].total += (b.trainerPay || 0);
      byDay[d].count++;
      byDay[d].items.push(b);
    });
    const days = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));

    const dayGroups = days.map(([date, day]) => {
      const itemRows = day.items.map(b => {
        const client = DataService.findClient(b.clientId);
        const court = DataService.findCourt(b.courtId);
        return `
          <div class="salary-detail-row">
            <span class="sdr-time">${b.timeStart}</span>
            <span class="sdr-client">${client ? client.name : '—'}</span>
            <span class="sdr-court">${court ? court.name : '—'}</span>
            <span class="sdr-amount">${fmtMoney(b.trainerPay || 0)} ₽</span>
          </div>
        `;
      }).join('');
      return `
        <div class="salary-day-group">
          <div class="salary-day-header" data-date="${date}">
            <i class="fa-solid fa-chevron-down sdh-arrow"></i>
            <span class="sdh-date">${fmtDate(date)}</span>
            <span class="sdh-count">${plural(day.count, 'тренировка', 'тренировки', 'тренировок')}</span>
            <span class="sdh-total">${fmtMoney(day.total)} ₽</span>
          </div>
          <div class="salary-day-body">${itemRows}</div>
        </div>
      `;
    }).join('');

    const monthOptions = months.map(m => {
      const [y, mn] = m.split('-');
      const names = ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
      const selected = m === selectedMonth ? 'selected' : '';
      return `<option value="${m}" ${selected}>${names[parseInt(mn)]} ${y}</option>`;
    }).join('');

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <button class="mobile-back" onclick="window.location.hash='#/trainer'">← Назад</button>
          <div class="mobile-logo">Моя зарплата</div>
          <span class="badge badge-purple" style="font-size:10px;">${trainer.code}</span>
        </div>
        <div class="mobile-body">
          <div class="form-group" style="margin-bottom:16px;">
            <select class="form-select" id="salary-month" onchange="window.location.hash='#/trainer/salary/'+this.value">
              ${monthOptions}
            </select>
          </div>
          <div class="salary-total-card">
            <div class="salary-total-label">Начислено за ${selectedMonth.split('-').reverse().join('.')}</div>
            <div class="salary-total-value">${fmtMoney(total)} ₽</div>
            <div class="salary-total-sub">${plural(completed.length, 'тренировка', 'тренировки', 'тренировок')} за ${plural(days.length, 'день', 'дня', 'дней')}</div>
          </div>
          <button class="mobile-btn mobile-btn-outline mobile-btn-block mt-16" onclick="TrainerPage._exportSalary()">
            <i class="fa-solid fa-download"></i> Скачать ведомость
          </button>
          ${days.length === 0 ? `<div class="mobile-empty mt-16"><div class="mobile-empty-icon"><i class="fa-solid fa-coins"></i></div><div>Нет завершённых тренировок за ${selectedMonth.split('-').reverse().join('.')}</div></div>` : `
            <div class="mobile-section-title mt-16">Детализация по дням</div>
            ${dayGroups}
          `}
        </div>
        <div class="mobile-bottom-nav">
          <button class="mnav-item" data-route="#/trainer"><i class="fa-solid fa-calendar-days"></i><span>Расписание</span></button>
          <button class="mnav-item active" data-route="#/trainer/salary"><i class="fa-solid fa-coins"></i><span>Зарплата</span></button>
          <button class="mnav-item" data-route="#/trainer/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);
    this._bindBottomNav();

    $$('.salary-day-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        if (!body) return;
        const arrow = header.querySelector('.sdh-arrow');
        body.classList.toggle('open');
        if (arrow) { arrow.classList.toggle('fa-chevron-down'); arrow.classList.toggle('fa-chevron-up'); }
      });
    });
    const firstBody = $('.salary-day-body');
    if (firstBody) firstBody.classList.add('open');
    const firstArrow = $('.sdh-arrow');
    if (firstArrow) { firstArrow.classList.remove('fa-chevron-down'); firstArrow.classList.add('fa-chevron-up'); }
  },

  _exportSalary() {
    const trainer = DataService.findTrainer(App.userId);
    if (!trainer) return;
    const hashMonth = window.location.hash.split('/')[3] || todayStr().slice(0,7);
    const ms = hashMonth + '-01';
    const completed = DataService.bookings()
      .filter(b => b.trainerId===trainer.id && b.status==='completed' && b.date>=ms && b.date<=hashMonth+'-31')
      .sort((a,b)=>a.date.localeCompare(b.date)||b.timeStart.localeCompare(b.timeStart));
    let csv = 'Дата,Время,Клиент,Корт,Начислено\n';
    completed.forEach(b => { const c=DataService.findClient(b.clientId); const r=DataService.findCourt(b.courtId); csv += [b.date,b.timeStart,c?c.name:'',r?r.name:'',b.trainerPay||0].join(',')+'\n'; });
    csv += '\nИтого,,,,' + completed.reduce((s,b)=>s+(b.trainerPay||0),0)+'\n';
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'salary_'+trainer.name.replace(/\s/g,'_')+'_'+hashMonth+'.csv'; a.click();
    URL.revokeObjectURL(url);
    App.toast('Ведомость скачана', 'success');
  },

  /* ---- PROFILE ---- */

  renderProfile() {
    const trainer = DataService.findTrainer(App.userId);
    if (!trainer) { window.location.hash = '#/login/trainer'; return; }
    App.setTitle(''); App.setHeaderActions(''); App.setSidebar([]);

    const allBookings = DataService.bookings().filter(b => b.trainerId === trainer.id);
    const totalCompleted = allBookings.filter(b => b.status === 'completed').length;
    const totalEarned = allBookings.filter(b => b.status === 'completed').reduce((s,b)=>s+(b.trainerPay||0),0);
    const thisMonth = todayStr().slice(0,7)+'-01';
    const monthCompleted = allBookings.filter(b=>b.status==='completed'&&b.date>=thisMonth);
    const monthHours = monthCompleted.length;
    const monthEarned = monthCompleted.reduce((s,b)=>s+(b.trainerPay||0),0);

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header"><button class="mobile-back" onclick="window.location.hash='#/trainer'">← Назад</button><div class="mobile-logo">Профиль</div></div>
        <div class="mobile-body">
          <div class="mobile-profile-header">
            <div class="mph-avatar" style="background:#d1fae5;color:#065f46;">${trainer.name.charAt(0)}</div>
            <div class="mph-name">${trainer.name}</div>
            <div class="mph-phone">Код ${trainer.code} &bull; ${(trainer.specializations||[]).join(', ')}</div>
          </div>
          <div class="mobile-stats-row">
            <div class="mstat"><div class="mstat-val" style="color:var(--success);">${fmtMoney(monthEarned)} ₽</div><div class="mstat-lbl">Заработано за месяц</div></div>
            <div class="mstat"><div class="mstat-val">${monthHours}</div><div class="mstat-lbl">Часов за месяц</div></div>
            <div class="mstat"><div class="mstat-val">${fmtMoney(trainer.ratePerHour)} ₽</div><div class="mstat-lbl">Ставка</div></div>
          </div>
          <div class="mobile-stats-row mt-12">
            <div class="mstat"><div class="mstat-val">${totalCompleted}</div><div class="mstat-lbl">Всего тренировок</div></div>
            <div class="mstat"><div class="mstat-val">${fmtMoney(totalEarned)} ₽</div><div class="mstat-lbl">Заработано всего</div></div>
            <div class="mstat"><div class="mstat-val">${fmtDate(trainer.hiredDate)}</div><div class="mstat-lbl">Дата найма</div></div>
          </div>
        </div>
        <div class="mobile-bottom-nav">
          <button class="mnav-item" data-route="#/trainer"><i class="fa-solid fa-calendar-days"></i><span>Расписание</span></button>
          <button class="mnav-item" data-route="#/trainer/salary"><i class="fa-solid fa-coins"></i><span>Зарплата</span></button>
          <button class="mnav-item active" data-route="#/trainer/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);
    this._bindBottomNav();
  },

  _bindBottomNav() {
    $$('.mnav-item').forEach(item => {
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
    });
    $$('.mnav-item').forEach(item => {
      item.addEventListener('click', () => { const route = item.dataset.route; if (route) window.location.hash = route; });
    });
  }
};
