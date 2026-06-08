// ============================================================
// PADELPRO — АДМИНИСТРАТОР (ДЕСКТОП С САЙДБАРОМ)
// ============================================================

const AdminPage = {

  _activeSidebar(route) {
    const items = [
      { label: 'На главную', icon: 'fa-solid fa-arrow-left', route: '#/' },
      { section: 'ОСНОВНОЕ' },
      { label: 'Дашборд', icon: 'fa-solid fa-chart-line', route: '#/admin' },
      { label: 'Сетка расписания', icon: 'fa-solid fa-table-cells', route: '#/admin/schedule' },
      { section: 'УПРАВЛЕНИЕ' },
      { label: 'Тренировки', icon: 'fa-solid fa-list', route: '#/admin/bookings' },
      { label: 'Тренеры', icon: 'fa-solid fa-users', route: '#/admin/trainers' },
      { label: 'Клиенты', icon: 'fa-solid fa-address-book', route: '#/admin/clients' },
      { section: 'АНАЛИТИКА' },
      { label: 'Корты', icon: 'fa-solid fa-table-tennis-paddle-ball', route: '#/admin/courts' },
      { label: 'Финансы', icon: 'fa-solid fa-coins', route: '#/admin/finance' },
      { label: 'Реестр выплат', icon: 'fa-solid fa-file-invoice', route: '#/admin/registry' },
    ];
    items.forEach(item => {
      if (item.route) item.active = item.route === route;
    });
    App.setSidebar(items);
    App.setBottomNav([]);
  },

  /* ---- LOGIN ---- */

  renderLogin() {
    App.setTitle(''); App.setHeaderActions(''); App.setSidebar([]); App.setBottomNav([]);
    App.renderPage(`
      <div style="max-width:400px;margin:60px auto;">
        <div class="card"><div class="card-header">Вход администратора</div><div class="card-body">
          <div class="form-group"><input class="form-input" id="admin-login" placeholder="Логин" value="admin"></div>
          <div class="form-group"><input type="password" class="form-input" id="admin-pass" placeholder="Пароль" value="admin123"></div>
          <div class="form-error" id="admin-error"></div>
          <button class="btn btn-primary btn-block" id="btn-admin-login">Войти</button>
          <div style="text-align:center;margin-top:12px;"><a href="#/" style="font-size:12px;color:var(--text-muted);">← На главную</a></div>
        </div></div>
      </div>
    `);
    $('#btn-admin-login').addEventListener('click', () => this._doLogin());
    $('#admin-pass').addEventListener('keydown', e => { if (e.key === 'Enter') this._doLogin(); });
  },

  _doLogin() {
    const u = $('#admin-login').value.trim();
    const p = $('#admin-pass').value.trim();
    if (u === 'admin' && p === 'admin123') { App.login('admin','admin'); location.hash = '#/admin'; }
    else $('#admin-error').textContent = 'Неверный логин или пароль';
  },

  /* ---- DASHBOARD ---- */

  render() {
    try {
    this._activeSidebar('#/admin');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Дашборд'}]);
    App.setTitle('Дашборд');
    App.setHeaderActions(`
      <select class="form-select" id="dash-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(this._adminMonth())}
      </select>
      <button class="btn btn-outline-danger btn-sm" id="btn-reset-data">Сброс</button>
    `);

    const today = todayStr();
    const hashMonth = this._adminMonth();
    const monthStart = hashMonth + '-01';
    const monthEnd = this._monthEnd(hashMonth);
    const all = DataService.bookings();
    const fin = DataService.finance();

    const todayDone = all.filter(b => b.date === today && b.status === 'completed');
    const todayRev = todayDone.reduce((s,b) => s + (b.price||0), 0);
    const yesterday = daysFromNow(-1);
    const yesterdayDone = all.filter(b => b.date === yesterday && b.status === 'completed');
    const yesterdayRev = yesterdayDone.reduce((s,b) => s + (b.price||0), 0);
    const dayTrend = yesterdayRev > 0 ? Math.round((todayRev - yesterdayRev) / yesterdayRev * 100) : 0;

    const todayAll = all.filter(b => b.date === today);
    const todayTotal = todayAll.length;
    const todayCompleted = todayAll.filter(b => b.status === 'completed').length;
    const todayActive = todayAll.filter(b => b.status === 'in_progress').length;
    const todayCancel = todayAll.filter(b => b.status === 'cancelled').length;

    const courts = DataService.courts();
    const allPeriod = all.filter(b => b.date >= monthStart && b.date <= monthEnd);
    const year = parseInt(hashMonth.slice(0,4));
    const month = parseInt(hashMonth.slice(5,7));
    const daysInMonth = new Date(year, month, 0).getDate();
    const totalSlots = courts.length * 14 * daysInMonth;
    const courtLoad = Math.round(allPeriod.length / totalSlots * 100);

    const chartDays = [];
    const chartRev = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = hashMonth + '-' + String(d).padStart(2,'0');
      chartDays.push(String(d));
      chartRev.push(all.filter(b => b.date === date && b.status === 'completed').reduce((s,b) => s + (b.price||0), 0));
    }

    const periodDone = all.filter(b => b.date >= monthStart && b.date <= monthEnd && b.status === 'completed');
    const periodRev = periodDone.reduce((s,b) => s + (b.price||0), 0);
    const periodFin = fin.filter(f => f.date >= monthStart && f.date <= monthEnd);
    const periodExp = periodFin.filter(f => f.type === 'expense').reduce((s,f) => s + f.amount, 0);
    const periodProfit = periodRev - periodExp;

    const courtLabels = courts.map(r => r.name);
    const courtRevData = courts.map(r => all.filter(b => b.courtId === r.id && b.status === 'completed' && b.date >= monthStart && b.date <= monthEnd).reduce((s,b) => s + (b.price||0), 0));
    const courtLoadData = courts.map(r => Math.round(all.filter(b => b.courtId === r.id && b.date >= monthStart && b.date <= monthEnd).length / (14 * daysInMonth) * 100));

    const avgCheck = periodDone.length > 0 ? Math.round(periodRev / periodDone.length) : 0;
    const revPerCourt = courts.length > 0 ? Math.round(periodRev / courts.length) : 0;
    const margin = periodRev > 0 ? Math.round(periodProfit / periodRev * 100) : 0;

    const monthName = ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][month];
    const periodLabel = monthName + ' ' + year;

    App.renderPage(`
      ${this._statCards(todayRev, dayTrend, periodRev, periodExp, periodProfit, courtLoad, periodLabel)}
      ${this._keyMetrics(avgCheck, revPerCourt, margin)}
      <div class="admin-charts-row">
        <div class="chart-card"><div class="chart-title">Выручка ${periodLabel}</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-revenue"></canvas></div></div>
        <div class="chart-card"><div class="chart-title">Выручка по кортам ${periodLabel}</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-courts-rev"></canvas></div></div>
      </div>
      <div class="admin-charts-row">
        <div class="chart-card"><div class="chart-title">Загрузка кортов (%) ${periodLabel}</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-load"></canvas></div></div>
        <div class="chart-card"><div class="chart-title">Сводка дня</div>
          <div style="padding:20px;">
            ${this._dayChip('Всего', todayTotal, '')}
            ${this._dayChip('Проведено', todayCompleted, 'green')}
            ${this._dayChip('Идут', todayActive, 'orange')}
            ${this._dayChip('Отменено', todayCancel, 'red')}
          </div>
        </div>
      </div>
    `);

    // Save period selection
    document.getElementById('dash-month').value = hashMonth;
    document.getElementById('dash-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.render();
    });

    document.getElementById('btn-reset-data').addEventListener('click', () => {
      DataService.reset();
      App.toast('Данные сброшены', 'info');
      AdminPage.render();
    });

    if (typeof Chart !== 'undefined') {
      this._lineChart('chart-revenue', chartDays, chartRev);
      this._barChart('chart-courts-rev', courtLabels, courtRevData);
      this._horizontalBar('chart-load', courtLabels, courtLoadData);
    }
    } catch(e) { console.error('Admin render error:', e); App.toast('Ошибка загрузки дашборда', 'error'); }
  },

  _statCards(todayRev, dayTrend, periodRev, periodExp, periodProfit, load, periodLabel) {
    const trendIcon = dayTrend >= 0 ? '▲' : '▼';
    const trendClass = dayTrend >= 0 ? 'up' : 'down';
    return `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;color:#2563eb;"><i class="fa-solid fa-ruble-sign"></i></div>
          <div class="stat-value">${fmtMoney(todayRev)} ₽</div>
          <div class="stat-label">Выручка сегодня</div>
          <div class="stat-trend ${trendClass}">${trendIcon} ${Math.abs(dayTrend)}% к вчера</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5;color:#059669;"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="stat-value">${fmtMoney(periodRev)} ₽</div>
          <div class="stat-label">Выручка ${periodLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2;color:#dc2626;"><i class="fa-solid fa-arrow-trend-down"></i></div>
          <div class="stat-value" style="color:var(--danger);">${fmtMoney(periodExp)} ₽</div>
          <div class="stat-label">Расходы ${periodLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#ede9fe;color:#7c3aed;"><i class="fa-solid fa-chart-simple"></i></div>
          <div class="stat-value" style="color:${periodProfit>=0?'var(--success)':'var(--danger)'};">${fmtMoney(periodProfit)} ₽</div>
          <div class="stat-label">Чистый доход ${periodLabel}</div>
        </div>
      </div>
    `;
  },

  _keyMetrics(avgCheck, revPerCourt, margin) {
    return `
      <div class="admin-key-metrics">
        <div class="akm-item"><span>Средний чек</span><strong>${fmtMoney(avgCheck)} ₽</strong></div>
        <div class="akm-item"><span>Выручка на корт</span><strong>${fmtMoney(revPerCourt)} ₽</strong></div>
        <div class="akm-item"><span>Маржинальность</span><strong style="color:${margin>=30?'var(--success)':margin>=10?'var(--warning)':'var(--danger)'};">${margin}%</strong></div>
      </div>
    `;
  },

  _dayChip(label, value, cls) {
    return `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;"><span>${label}</span><strong style="color:${cls==='green'?'var(--success)':cls==='orange'?'#d97706':cls==='red'?'var(--danger)':'var(--text)'};">${value}</strong></div>`;
  },

  _lineChart(id, labels, data) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, { type: 'line', data: { labels, datasets: [{ data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', fill: true, tension: 0.3, pointRadius: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
  },

  _barChart(id, labels, data, max) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data, backgroundColor: ['#2563eb','#2563eb','#059669','#059669'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ...(max ? { max } : {}) } } } });
  },

  _horizontalBar(id, labels, data) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data, backgroundColor: ['#2563eb','#2563eb','#059669','#059669'] }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100 } } } });
  },

  _monthOptions(current) {
    const all = DataService.bookings();
    const months = [...new Set(all.map(b => b.date.slice(0, 7)))].sort().reverse();
    const names = ['','Янв','Фев','Март','Апр','Май','Июнь','Июль','Авг','Сент','Окт','Нояб','Дек'];
    return months.map(m => {
      const [y, mn] = m.split('-');
      const sel = m === current ? 'selected' : '';
      return `<option value="${m}" ${sel}>${names[parseInt(mn)]} ${y}</option>`;
    }).join('');
  },

  _adminMonth() {
    return sessionStorage.getItem('admin_month') || todayStr().slice(0,7);
  },

  _monthEnd(month) {
    const [y, m] = month.split('-').map(Number);
    return month + '-' + String(new Date(y, m, 0).getDate()).padStart(2,'0');
  },

  _setAdminMonth(m) {
    sessionStorage.setItem('admin_month', m);
  },

  /* ---- SCHEDULE GRID ---- */

  renderSchedule() {
    var today = todayStr();
    var hash = window.location.hash;
    var parts = hash.split('/');
    var date = parts[3] || today;
    var dp = date.split('-');
    var dy = parseInt(dp[0]), dm = parseInt(dp[1]) - 1, dd = parseInt(dp[2]);
    var prevD = new Date(dy, dm, dd - 1);
    var nextD = new Date(dy, dm, dd + 1);
    var prevStr = prevD.getFullYear() + '-' + String(prevD.getMonth()+1).padStart(2,'0') + '-' + String(prevD.getDate()).padStart(2,'0');
    var nextStr = nextD.getFullYear() + '-' + String(nextD.getMonth()+1).padStart(2,'0') + '-' + String(nextD.getDate()).padStart(2,'0');
    var days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    var curDate = new Date(dy, dm, dd);
    var dow = curDate.getDay();
    var mondayOffset = dow === 0 ? -6 : 1 - dow;
    var monday = new Date(dy, dm, dd + mondayOffset);
    var nextMonday = new Date(monday); nextMonday.setDate(monday.getDate() + 7);
    var mondayStr = monday.getFullYear() + '-' + String(monday.getMonth()+1).padStart(2,'0') + '-' + String(monday.getDate()).padStart(2,'0');
    var nextMondayStr = nextMonday.getFullYear() + '-' + String(nextMonday.getMonth()+1).padStart(2,'0') + '-' + String(nextMonday.getDate()).padStart(2,'0');

    var view = 'day';
    if (hash.indexOf('?view=week') > -1) view = 'week';

    App.setTitle('Сетка');
    App.setHeaderActions('');
    this._activeSidebar('#/admin/schedule');

    var html = '<div class="schedule-controls">';
    html += '<a href="#/admin/schedule/' + prevStr + '" class="btn btn-outline btn-sm">←</a> ';
    html += '<span class="schedule-date">' + date + ' ' + days[dow] + '</span> ';
    html += '<a href="#/admin/schedule/' + nextStr + '" class="btn btn-outline btn-sm">→</a> ';
    html += '<a href="#/admin/schedule/' + today + '" class="btn btn-outline btn-sm">Сегодня</a> ';
    html += '<a href="#/admin/schedule/' + date + (view==='week' ? '' : '?view=week') + '" class="btn btn-outline btn-sm">' + (view==='week' ? 'День' : 'Неделя') + '</a>';
    html += '</div>';
    html += '<div class="schedule-controls" style="margin-top:4px;">';
    html += '<input type="date" id="schedule-jump" value="' + date + '" class="form-input" style="width:auto;font-size:12px;" onchange="location.hash=\'#/admin/schedule/\'+this.value">';
    html += '<a href="#/admin/schedule/' + mondayStr + '" class="btn btn-xs btn-outline">Эта неделя</a> ';
    html += '<a href="#/admin/schedule/' + nextMondayStr + '" class="btn btn-xs btn-outline">След. неделя</a> ';
    html += '</div>';

    // Quick dates
    html += '<div class="schedule-quick-dates">';
    for (var i = 0; i < 7; i++) {
      var qd = new Date(monday); qd.setDate(monday.getDate() + i);
      var qds = qd.getFullYear() + '-' + String(qd.getMonth()+1).padStart(2,'0') + '-' + String(qd.getDate()).padStart(2,'0');
      var isToday = qds === today;
      var isActive = qds === date;
      html += '<a href="#/admin/schedule/' + qds + '" class="btn btn-xs ' + (isActive ? 'btn-primary' : isToday ? 'btn-outline-primary' : 'btn-outline') + '">' + days[qd.getDay()] + '<br>' + qds.slice(8) + '</a>';
    }
    html += '</div>';

    // Grid
    var courts = DataService.courts();
    var allBookings = DataService.bookings();
    var hours = [];
    for (var h = 8; h <= 21; h++) hours.push(String(h).padStart(2,'0') + ':00');

    if (view === 'week') {
      html += '<div class="schedule-wrap"><table class="schedule-table"><thead><tr><th class="sg-court"></th>';
      for (var wi = 0; wi < 7; wi++) {
        var wd = new Date(monday); wd.setDate(monday.getDate() + wi);
        var wds = wd.getFullYear() + '-' + String(wd.getMonth()+1).padStart(2,'0') + '-' + String(wd.getDate()).padStart(2,'0');
        html += '<th style="text-align:center;' + (wds===today?'background:#dbeafe;':'') + '">' + days[wd.getDay()] + '<br>' + wds.slice(5) + '</th>';
      }
      html += '</tr></thead><tbody>';
      for (var r = 0; r < courts.length; r++) {
        var court = courts[r];
        html += '<tr><td class="sg-court"><strong>' + court.name + '</strong></td>';
        for (var wi = 0; wi < 7; wi++) {
          var wd = new Date(monday); wd.setDate(monday.getDate() + wi);
          var wds = wd.getFullYear() + '-' + String(wd.getMonth()+1).padStart(2,'0') + '-' + String(wd.getDate()).padStart(2,'0');
          var dayB = allBookings.filter(function(b){return b.date===wds && b.courtId===court.id && b.status!=='cancelled';});
          if (dayB.length === 0) {
            html += '<td class="sg-cell sg-free">—</td>';
          } else {
            var sc = 'sg-scheduled';
            if (dayB.some(function(b){return b.status==='in_progress';})) sc = 'sg-active';
            if (dayB.every(function(b){return b.status==='completed';})) sc = 'sg-done';
            html += '<td class="sg-cell ' + sc + '" style="cursor:pointer;" onclick="location.hash=\'#/admin/schedule/' + wds + '\'"><strong>' + dayB.length + '</strong></td>';
          }
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    } else {
      var dayBookings = allBookings.filter(function(b){return b.date===date && b.status!=='cancelled';});
      html += '<div class="schedule-wrap"><table class="schedule-table"><thead><tr><th class="sg-court"></th>';
      for (var j = 0; j < hours.length; j++) html += '<th>' + hours[j].slice(0,5) + '</th>';
      html += '</tr></thead><tbody>';
      for (var r = 0; r < courts.length; r++) {
        var court = courts[r];
        html += '<tr><td class="sg-court"><strong>' + court.name + '</strong></td>';
        for (var k = 0; k < hours.length; k++) {
          var hour = hours[k];
          var b = dayBookings.find(function(bk){return bk.courtId===court.id && bk.timeStart===hour;});
          if (!b) {
            html += '<td class="sg-cell sg-free" data-court="' + court.id + '" data-time="' + hour + '" data-date="' + date + '"><div class="sg-empty-hint">+</div></td>';
          } else {
            var sc = {scheduled:'sg-scheduled',in_progress:'sg-active',completed:'sg-done',no_show:'sg-cancel'}[b.status]||'sg-scheduled';
            var t = DataService.findTrainer(b.trainerId);
            var c = DataService.findClient(b.clientId);
            html += '<td class="sg-cell ' + sc + '" data-bid="' + b.id + '" style="cursor:pointer;"><div class="sg-inner"><strong>' + (t?t.name.split(' ')[0]:'—') + '</strong><br><span style="font-size:10px;">' + (c?c.name.split(' ')[0]:'—') + '</span></div></td>';
          }
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    }

    App.renderPage(html);

    // Click filled cell → booking detail
    var filledCells = document.querySelectorAll('.sg-cell[data-bid]');
    for (var i = 0; i < filledCells.length; i++) {
      filledCells[i].addEventListener('click', function() {
        var b = DataService.findBooking(this.dataset.bid);
        if (!b) return;
        var t = DataService.findTrainer(b.trainerId);
        var c = DataService.findClient(b.clientId);
        var r = DataService.findCourt(b.courtId);
        var st = {scheduled:'Запланирована',in_progress:'Идёт',completed:'Завершена',cancelled:'Отменена',no_show:'Неявка'}[b.status]||b.status;
        App.openModal('<div class="modal-header">' + b.timeStart + ' — ' + fmtDate(b.date) + '<span class="modal-close">&times;</span></div><div class="modal-body"><div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px;"><span style="color:var(--text-muted);">Тренер:</span><strong>' + (t?t.name:'—') + '</strong><span style="color:var(--text-muted);">Клиент:</span><strong>' + (c?c.name:'—') + '</strong><span style="color:var(--text-muted);">Корт:</span><strong>' + (r?r.name:'—') + '</strong><span style="color:var(--text-muted);">Статус:</span><span>' + st + '</span><span style="color:var(--text-muted);">Цена:</span><strong>' + fmtMoney(b.price) + ' ₽</strong></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">Закрыть</button></div>');
      });
    }

    // Click empty cell → create booking
    if (view === 'day') {
      var freeCells = document.querySelectorAll('.sg-cell.sg-free[data-court]');
      for (var i = 0; i < freeCells.length; i++) {
        freeCells[i].addEventListener('click', function() {
          var courtId = this.dataset.court;
          var time = this.dataset.time;
          var dt = this.dataset.date;
          var r = DataService.findCourt(courtId);
          var trainers = DataService.trainers().filter(function(t){return t.active;});
          var clients = DataService.clients();
          var modalHtml = '<div class="modal-header">Новая тренировка — ' + time + ' ' + fmtDate(dt) + '<span class="modal-close">&times;</span></div>';
          modalHtml += '<div class="modal-body">';
          modalHtml += '<div class="form-group"><label class="form-label">Корт</label><input class="form-input" value="' + (r?r.name:'—') + '" disabled></div>';
          modalHtml += '<div class="form-group"><label class="form-label">Время</label><input class="form-input" value="' + time + '" disabled></div>';
          modalHtml += '<div class="form-group"><label class="form-label">Тренер</label><select class="form-select" id="sg-trainer">';
          for (var ti = 0; ti < trainers.length; ti++) modalHtml += '<option value="' + trainers[ti].id + '">' + trainers[ti].name + '</option>';
          modalHtml += '</select></div>';
          modalHtml += '<div class="form-group"><label class="form-label">Клиент</label><select class="form-select" id="sg-client">';
          for (var ci = 0; ci < clients.length; ci++) modalHtml += '<option value="' + clients[ci].id + '">' + clients[ci].name + ' (' + clients[ci].subscriptionLabel + ')</option>';
          modalHtml += '</select></div>';
          modalHtml += '<div class="form-group"><label class="form-label">Цена</label><input class="form-input" value="' + fmtMoney(r?r.hourlyRate:0) + ' ₽" disabled></div>';
          modalHtml += '</div><div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">Отмена</button><button class="btn btn-primary" id="btn-create-sg">Создать</button></div>';
          App.openModal(modalHtml);
          document.getElementById('btn-create-sg').addEventListener('click', function() {
            DataService.addBooking({courtId:courtId, trainerId:document.getElementById('sg-trainer').value, clientId:document.getElementById('sg-client').value, date:dt, timeStart:time, timeEnd:(parseInt(time)+1).toString().padStart(2,'0')+':00', price:r?r.hourlyRate:2000, status:'scheduled'});
            App.closeModal();
            App.toast('Тренировка создана', 'success');
            AdminPage.renderSchedule();
          });
        });
      }
    }
  },

  /* ---- BOOKINGS ---- */

  renderBookings() {
    this._activeSidebar('#/admin/bookings');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Все тренировки'}]);
    App.setTitle('Все тренировки');

    const month = this._adminMonth();
    const ms = month + '-01';
    const me = this._monthEnd(month);

    App.setHeaderActions(`
      <select class="form-select" id="book-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(month)}
      </select>
    `);

    const trainers = DataService.trainers();
    const all = DataService.bookings().sort((a,b) => b.date.localeCompare(a.date) || b.timeStart.localeCompare(b.timeStart));

    let filtered = all.filter(b => b.date >= ms && b.date <= me);
    let page = 1;
    const perPage = 15;

    const renderTable = () => {
      const start = (page - 1) * perPage;
      const slice = filtered.slice(start, start + perPage);
      const totalPages = Math.ceil(filtered.length / perPage);

      const rows = slice.map(b => {
        const t = DataService.findTrainer(b.trainerId);
        const c = DataService.findClient(b.clientId);
        const r = DataService.findCourt(b.courtId);
        const st = { scheduled:'Запланирована', in_progress:'Идёт', completed:'Завершена', cancelled:'Отменена', no_show:'Неявка' }[b.status] || b.status;
        const sc = { scheduled:'badge-blue', in_progress:'badge-orange', completed:'badge-gray', cancelled:'badge-red', no_show:'badge-red' }[b.status] || 'badge-gray';
        return `<tr><td>${fmtDate(b.date)}</td><td>${b.timeStart}</td><td>${t?t.name:'—'}</td><td>${c?c.name:'—'}</td><td>${r?r.name:'—'}</td><td>${fmtMoney(b.price)} ₽</td><td><span class="badge ${sc}">${st}</span></td></tr>`;
      }).join('');

      $('#bookings-tbody').innerHTML = rows || '<tr><td colspan="7" class="cell-muted">Нет записей</td></tr>';
      $('#bookings-info').textContent = filtered.length > 0 ? `${start+1}–${Math.min(start+perPage, filtered.length)} из ${filtered.length}` : '0';
      $('#bookings-pages').innerHTML = Array.from({length: totalPages}, (_,i) =>
        `<button class="btn btn-xs ${page===i+1?'btn-primary':'btn-outline'}" data-page="${i+1}">${i+1}</button>`
      ).join('');
      $$('#bookings-pages button').forEach(btn => btn.addEventListener('click', () => { page = parseInt(btn.dataset.page); renderTable(); }));
    };

    App.renderPage(`
      <div class="admin-filter-bar mb-16">
        <input type="text" class="form-input" id="booking-search" placeholder="Поиск..." style="width:200px;">
        <input type="date" class="form-input" id="booking-from" value="${ms}" style="width:auto;">
        <span style="color:var(--text-muted);">—</span>
        <input type="date" class="form-input" id="booking-to" value="${me}" style="width:auto;">
        <select class="form-select" id="booking-trainer" style="width:auto;"><option value="">Все тренеры</option>${trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
        <select class="form-select" id="booking-status" style="width:auto;"><option value="">Все статусы</option><option value="scheduled">Запланирована</option><option value="in_progress">Идёт</option><option value="completed">Завершена</option><option value="cancelled">Отменена</option></select>
        <button class="btn btn-outline btn-sm" onclick="AdminPage._exportBookings()"><i class="fa-solid fa-download"></i> CSV</button>
      </div>
      <div class="flex-between mb-12"><span id="bookings-info" style="font-size:12px;color:var(--text-muted);">0</span><div id="bookings-pages" class="flex-wrap gap-4"></div></div>
      <div class="table-wrap"><table><thead><tr><th class="sortable" data-sort="date">Дата</th><th data-sort="time">Время</th><th data-sort="trainer">Тренер</th><th data-sort="client">Клиент</th><th data-sort="court">Корт</th><th data-sort="price">Цена</th><th data-sort="status">Статус</th></tr></thead><tbody id="bookings-tbody"></tbody></table></div>
    `);

    const applyFilters = () => {
      const search = ($('#booking-search').value || '').toLowerCase();
      const from = $('#booking-from').value;
      const to = $('#booking-to').value;
      const tid = $('#booking-trainer').value;
      const st = $('#booking-status').value;
      filtered = all.filter(b => {
        if (search) { const t = DataService.findTrainer(b.trainerId); const c = DataService.findClient(b.clientId); if (!(t?.name||'').toLowerCase().includes(search) && !(c?.name||'').toLowerCase().includes(search)) return false; }
        if (from && b.date < from) return false;
        if (to && b.date > to) return false;
        if (tid && b.trainerId !== tid) return false;
        if (st && b.status !== st) return false;
        return true;
      });
      page = 1;
      renderTable();
    };

    document.getElementById('book-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.renderBookings();
    });

    $('#booking-search').addEventListener('input', debounce(applyFilters, 300));
    $('#booking-from').addEventListener('change', applyFilters);
    $('#booking-to').addEventListener('change', applyFilters);
    $('#booking-trainer').addEventListener('change', applyFilters);
    $('#booking-status').addEventListener('change', applyFilters);
    renderTable();

    // Sortable headers
    $$('.sortable').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        const asc = th.dataset.dir !== 'asc';
        th.dataset.dir = asc ? 'asc' : 'desc';
        const map = { date:'date', time:'timeStart', trainer:'trainerId', client:'clientId', court:'courtId', price:'price', status:'status' };
        const key = map[field] || field;
        filtered.sort((a,b) => {
          let va = a[key] || '', vb = b[key] || '';
          if (key === 'trainerId') { va = (DataService.findTrainer(a.trainerId)||{}).name||''; vb = (DataService.findTrainer(b.trainerId)||{}).name||''; }
          if (key === 'clientId') { va = (DataService.findClient(a.clientId)||{}).name||''; vb = (DataService.findClient(b.clientId)||{}).name||''; }
          if (key === 'courtId') { va = (DataService.findCourt(a.courtId)||{}).name||''; vb = (DataService.findCourt(b.courtId)||{}).name||''; }
          const cmp = va < vb ? -1 : va > vb ? 1 : 0;
          return asc ? cmp : -cmp;
        });
        page = 1;
        renderTable();
      });
    });
  },

  _exportBookings() {
    const all = DataService.bookings();
    const from = $('#booking-from')?.value || '';
    const to = $('#booking-to')?.value || '';
    const tid = $('#booking-trainer')?.value || '';
    const st = $('#booking-status')?.value || '';
    const data = all.filter(b => {
      if (from && b.date < from) return false;
      if (to && b.date > to) return false;
      if (tid && b.trainerId !== tid) return false;
      if (st && b.status !== st) return false;
      return true;
    });
    let csv = 'Дата,Время,Тренер,Клиент,Корт,Цена,Статус\n';
    data.forEach(b => { const t=DataService.findTrainer(b.trainerId); const c=DataService.findClient(b.clientId); const r=DataService.findCourt(b.courtId); const sts={scheduled:'Запланирована',in_progress:'Идёт',completed:'Завершена',cancelled:'Отменена',no_show:'Неявка'}[b.status]||b.status; csv+=[b.date,b.timeStart,t?t.name:'',c?c.name:'',r?r.name:'',b.price||0,sts].join(',')+'\n'; });
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bookings_filtered.csv'; a.click(); URL.revokeObjectURL(url);
    App.toast('Экспортировано (' + data.length + ' записей)','success');
  },

  /* ---- TRAINERS ---- */

  renderTrainers() {
    this._activeSidebar('#/admin/trainers');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Тренеры'}]);
    App.setTitle('Тренеры');

    const month = this._adminMonth();
    const ms = month + '-01';
    const me = this._monthEnd(month);

    App.setHeaderActions(`
      <select class="form-select" id="trainers-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(month)}
      </select>
    `);

    const trainers = DataService.trainers();
    const all = DataService.bookings();

    const rows = trainers.map(t => {
      const done = all.filter(b => b.trainerId === t.id && b.status === 'completed');
      const mDone = done.filter(b => b.date >= ms && b.date <= me);
      const mPay = mDone.reduce((s,b) => s + (b.trainerPay||0), 0);
      return `<tr>
        <td>${t.name}</td><td>${t.code}</td><td>${fmtMoney(t.ratePerHour)} ₽/ч</td>
        <td>${mDone.length}</td><td><strong>${fmtMoney(mPay)} ₽</strong></td>
        <td>${done.length}</td><td>${fmtMoney(done.reduce((s,b)=>s+(b.trainerPay||0),0))} ₽</td>
        <td>${t.active?'<span class="badge badge-green">Активен</span>':'<span class="badge badge-red">Отключён</span>'}</td>
        <td class="cell-nowrap">
          <button class="btn btn-xs btn-outline-primary edit-t-btn" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-xs ${t.active?'btn-outline-danger':'btn-outline'}" data-action="toggle" data-id="${t.id}">${t.active?'Откл':'Вкл'}</button>
        </td>
      </tr>`;
    }).join('');

    const labels = trainers.map(t => t.name.split(' ')[0]);
    const data = trainers.map(t => all.filter(b => b.trainerId === t.id && b.status === 'completed' && b.date >= ms && b.date <= me).reduce((s,b) => s + (b.trainerPay||0), 0));

    App.renderPage(`
      <div class="admin-row mb-16">
        <button class="btn btn-primary btn-sm" id="btn-add-trainer"><i class="fa-solid fa-plus"></i> Добавить тренера</button>
        <button class="btn btn-outline btn-sm" onclick="AdminPage._exportTrainerSalary()"><i class="fa-solid fa-download"></i> Ведомость</button>
      </div>
      <div class="chart-card mb-16"><div class="chart-title">Зарплаты за месяц</div><div class="chart-wrap" style="height:280px;"><canvas id="chart-trainers-bar"></canvas></div></div>
      <div class="table-wrap"><table><thead><tr><th>Имя</th><th>Код</th><th>Ставка</th><th>Часов/мес</th><th>За месяц</th><th>Всего ч.</th><th>Всего ₽</th><th>Статус</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    `);

    if (typeof Chart !== 'undefined') {
      const ctx = document.getElementById('chart-trainers-bar');
      if (ctx) new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data, backgroundColor: '#2563eb' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    }

    document.getElementById('trainers-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.renderTrainers();
    });

    $('#btn-add-trainer').addEventListener('click', () => this._trainerForm(null));
    $$('.edit-t-btn').forEach(btn => btn.addEventListener('click', () => { const t = DataService.findTrainer(btn.dataset.id); if (t) this._trainerForm(t); }));
    $$('[data-action="toggle"]').forEach(btn => btn.addEventListener('click', () => {
      const t = DataService.findTrainer(btn.dataset.id);
      if (t) { t.active = !t.active; DataService.save(); App.toast(t.active?'Активирован':'Отключён','info'); AdminPage.renderTrainers(); }
    }));
  },

  _trainerForm(trainer) {
    const isNew = !trainer;
    const t = trainer || { id:'', name:'', code:'', ratePerHour:1500, specializations:[], phone:'' };
    const specs = ['взрослые','дети','группы','взрослые PRO'];
    App.openModal(`
      <div class="modal-header">${isNew?'Новый тренер':'Редактирование'}<span class="modal-close">&times;</span></div>
      <div class="modal-body">
        <div class="form-row"><div class="form-group"><label class="form-label">Имя *</label><input class="form-input" id="tf-name" value="${t.name}"></div><div class="form-group"><label class="form-label">Код *</label><input class="form-input" id="tf-code" value="${t.code}"></div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Телефон</label><input class="form-input" id="tf-phone" value="${t.phone||''}"></div><div class="form-group"><label class="form-label">Ставка ₽/ч</label><input type="number" class="form-input" id="tf-rate" value="${t.ratePerHour}"></div></div>
        <div class="form-group"><label class="form-label">Специализация</label><div class="flex-wrap gap-8">${specs.map(s=>`<label style="font-size:12px;"><input type="checkbox" class="tf-spec" value="${s}" ${(t.specializations||[]).includes(s)?'checked':''}> ${s}</label>`).join('')}</div></div>
      </div>
      <div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">Отмена</button><button class="btn btn-primary" id="btn-save-trainer">${isNew?'Добавить':'Сохранить'}</button></div>
    `);
    $('#btn-save-trainer').addEventListener('click',()=>{
      const data = { name:$('#tf-name').value, code:$('#tf-code').value, phone:$('#tf-phone').value, ratePerHour:parseInt($('#tf-rate').value)||0, specializations:[...$$('.tf-spec:checked')].map(e=>e.value) };
      if(!data.name||!data.code){App.toast('Имя и код обязательны','error');return;}
      if(isNew){DataService.state.trainers.push(new Trainer({...data,id:uid('t'),active:true,hiredDate:todayStr()}));}
      else{Object.assign(trainer,data);}
      DataService.save(); App.closeModal(); App.toast(isNew?'Добавлен':'Сохранено','success'); AdminPage.renderTrainers();
    });
  },

  _exportTrainerSalary() {
    const ms=todayStr().slice(0,7)+'-01'; const trainers=DataService.trainers().filter(t=>t.active); const all=DataService.bookings();
    let csv='Тренер,Код,Ставка,Часов/мес,За месяц,Всего ч,Всего ₽\n';
    trainers.forEach(t=>{const d=all.filter(b=>b.trainerId===t.id&&b.status==='completed');const m=d.filter(b=>b.date>=ms);csv+=[t.name,t.code,t.ratePerHour,m.length,m.reduce((s,b)=>s+(b.trainerPay||0),0),d.length,d.reduce((s,b)=>s+(b.trainerPay||0),0)].join(',')+'\n';});
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='trainers.csv'; a.click(); URL.revokeObjectURL(url);
    App.toast('Ведомость скачана','success');
  },

  /* ---- CLIENTS ---- */

  renderClients() {
    this._activeSidebar('#/admin/clients');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Клиенты'}]);
    App.setTitle('Клиенты');
    const clients = DataService.clients();
    const all = DataService.bookings();
    const rows = clients.map(c => {
      const total = all.filter(b => b.clientId === c.id).length;
      const sc = c.subscriptionVisitsLeft > 3 ? 'badge-green' : c.subscriptionVisitsLeft > 0 ? 'badge-orange' : 'badge-red';
      return `<tr><td>${c.name}</td><td>${fmtPhone(c.phone)}</td><td>${c.subscriptionLabel}</td><td><span class="badge ${sc}">${c.subscriptionVisitsLeft}</span></td><td>${c.subscriptionExpiry?fmtDate(c.subscriptionExpiry):'—'}</td><td>${total}</td></tr>`;
    }).join('');
    App.renderPage(`<div class="table-wrap"><table><thead><tr><th>Имя</th><th>Телефон</th><th>Абонемент</th><th>Осталось</th><th>До</th><th>Тренировок</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  },

  /* ---- COURTS ---- */

  renderCourts() {
    this._activeSidebar('#/admin/courts');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Корты'}]);
    App.setTitle('Аналитика кортов');

    const month = this._adminMonth();
    const ms = month + '-01';
    const me = this._monthEnd(month);

    App.setHeaderActions(`
      <select class="form-select" id="courts-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(month)}
      </select>
    `);

    const year = parseInt(month.slice(0,4));
    const mn = parseInt(month.slice(5,7));
    const daysInMonth = new Date(year, mn, 0).getDate();
    const courts = DataService.courts();
    const all = DataService.bookings();

    const labels = courts.map(r => r.name);
    const loadData = courts.map(r => Math.round(all.filter(b => b.courtId === r.id && b.date >= ms && b.date <= me).length / (14 * daysInMonth) * 100));
    const revData = courts.map(r => all.filter(b => b.courtId === r.id && b.status === 'completed' && b.date >= ms && b.date <= me).reduce((s,b) => s + (b.price||0), 0));

    const peakHours = {};
    courts.forEach(r => {
      const courtB = all.filter(b => b.courtId === r.id && b.date >= ms);
      courtB.forEach(b => { peakHours[b.timeStart] = (peakHours[b.timeStart] || 0) + 1; });
    });
    const peakEntries = Object.entries(peakHours).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const peakLabels = peakEntries.map(([h]) => h);
    const peakData = peakEntries.map(([,c]) => c);

    const rows = courts.map(r => {
      const monthB = all.filter(b => b.courtId === r.id && b.date >= ms && b.date <= me);
      const load = Math.round(monthB.length / (14 * daysInMonth) * 100);
      const rev = all.filter(b => b.courtId === r.id && b.status === 'completed' && b.date >= ms && b.date <= me).reduce((s,b) => s + (b.price||0), 0);
      const counts = {}; monthB.forEach(b => { counts[b.timeStart] = (counts[b.timeStart]||0) + 1; });
      const peak = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
      let rec = '';
      if (r.type === 'outdoor' && load < 30) rec = `Скидка 20% на утренние часы`;
      else if (load < 20) rec = `Акция в ${peak?peak[0]:'непиковые'} часы`;
      else if (load > 80) rec = `Высокая загрузка — рассмотреть повышение цены`;
      return `<tr><td>${r.name}</td><td>${r.type==='indoor'?'Закрытый':'Открытый'}</td><td>${load}%</td><td>${fmtMoney(rev)} ₽</td><td>${peak?peak[0]:'—'}</td><td style="color:${load<30?'var(--warning)':'var(--text-muted)'};">${rec||'Оптимально'}</td></tr>`;
    }).join('');

    App.renderPage(`
      <div class="admin-charts-row">
        <div class="chart-card"><div class="chart-title">Загрузка кортов (%)</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-court-load"></canvas></div></div>
        <div class="chart-card"><div class="chart-title">Выручка по кортам</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-court-rev"></canvas></div></div>
      </div>
      ${peakLabels.length>0?`<div class="chart-card mb-16"><div class="chart-title">Пиковые часы (все корты)</div><div class="chart-wrap" style="height:220px;"><canvas id="chart-peak"></canvas></div></div>`:''}
      <div class="table-wrap"><table><thead><tr><th>Корт</th><th>Тип</th><th>Загрузка</th><th>Выручка</th><th>Час пик</th><th>Простой</th></tr></thead><tbody>${rows}</tbody></table></div>
    `);

    document.getElementById('courts-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.renderCourts();
    });

    if (typeof Chart !== 'undefined') {
      const c1=document.getElementById('chart-court-load'); if(c1)new Chart(c1,{type:'bar',data:{labels,datasets:[{data:loadData,backgroundColor:['#2563eb','#2563eb','#059669','#059669']}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100}}}});
      const c2=document.getElementById('chart-court-rev'); if(c2)new Chart(c2,{type:'bar',data:{labels,datasets:[{data:revData,backgroundColor:['#2563eb','#2563eb','#059669','#059669']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
      const c3=document.getElementById('chart-peak'); if(c3)new Chart(c3,{type:'bar',data:{labels:peakLabels,datasets:[{data:peakData,backgroundColor:'#f59e0b'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
    }
  },

  /* ---- FINANCE ---- */

  renderFinance() {
    this._activeSidebar('#/admin/finance');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Финансы'}]);
    App.setTitle('Финансы');

    const month = this._adminMonth();
    const ms = month + '-01';
    const me = this._monthEnd(month);

    App.setHeaderActions(`
      <select class="form-select" id="fin-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(month)}
      </select>
    `);

    const fin = DataService.finance().filter(f => f.date >= ms && f.date <= me).sort((a,b) => b.date.localeCompare(a.date));
    const revenue = fin.filter(f => f.type === 'revenue').reduce((s,f) => s + f.amount, 0);
    const expenses = fin.filter(f => f.type === 'expense').reduce((s,f) => s + f.amount, 0);
    const netIncome = revenue - expenses;

    const days = {}; fin.forEach(f => { if(!days[f.date])days[f.date]={rev:0,exp:0}; if(f.type==='revenue')days[f.date].rev+=f.amount; else days[f.date].exp+=f.amount; });
    const rows = Object.entries(days).sort((a,b)=>b[0].localeCompare(a[0])).map(([d,v])=>`<tr><td>${fmtDate(d)}</td><td class="cell-right" style="color:var(--success);">${v.rev>0?fmtMoney(v.rev)+' ₽':'—'}</td><td class="cell-right" style="color:var(--danger);">${v.exp>0?fmtMoney(v.exp)+' ₽':'—'}</td><td class="cell-right" style="font-weight:700;">${fmtMoney(v.rev-v.exp)} ₽</td></tr>`).join('');

    const cats = {}; fin.filter(f=>f.type==='expense').forEach(f=>{cats[f.category]=(cats[f.category]||0)+f.amount;});
    const catLabels = Object.keys(cats), catData = Object.values(cats);

    App.renderPage(`
      <div class="stat-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
        <div class="stat-card"><div class="stat-value" style="color:var(--success);">${fmtMoney(revenue)} ₽</div><div class="stat-label">Выручка</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--danger);">${fmtMoney(expenses)} ₽</div><div class="stat-label">Издержки</div></div>
        <div class="stat-card"><div class="stat-value" style="color:${netIncome>=0?'var(--success)':'var(--danger)'};">${fmtMoney(netIncome)} ₽</div><div class="stat-label">Чистый доход</div></div>
      </div>
      ${catLabels.length>0?`<div class="admin-charts-row"><div class="chart-card"><div class="chart-title">Структура издержек</div><div class="chart-wrap" style="height:280px;"><canvas id="chart-doughnut"></canvas></div></div></div>`:''}
      <div class="table-wrap"><table><thead><tr><th>Дата</th><th class="cell-right">Выручка</th><th class="cell-right">Издержки</th><th class="cell-right">Доход</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="cell-muted">Нет данных</td></tr>'}</tbody></table></div>
    `);

    document.getElementById('fin-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.renderFinance();
    });

    if(typeof Chart!=='undefined'&&catLabels.length>0){const c=document.getElementById('chart-doughnut');if(c)new Chart(c,{type:'doughnut',data:{labels:catLabels,datasets:[{data:catData,backgroundColor:['#ef4444','#f59e0b','#8b5cf6','#3b82f6','#10b981']}]},options:{responsive:true,maintainAspectRatio:false}});}
  },

  /* ---- PAYMENT REGISTRY ---- */

  renderRegistry() {
    this._activeSidebar('#/admin/registry');
    App.setBreadcrumbs([{label:'Админ',route:'#/admin'},{label:'Реестр'}]);
    App.setTitle('Реестр выплат');

    const month = this._adminMonth();
    const ms = month + '-01';
    const me = this._monthEnd(month);

    App.setHeaderActions(`
      <select class="form-select" id="reg-month" style="width:auto;font-size:12px;">
        ${this._monthOptions(month)}
      </select>
      <select class="form-select" id="reg-filter" style="width:auto;font-size:12px;">
        <option value="all">Все операции</option>
        <option value="revenue">Поступления</option>
        <option value="expense">Выплаты</option>
      </select>
    `);

    const all = DataService.bookings();
    const trainers = DataService.trainers();

    // Revenue entries (from completed bookings)
    const completed = all.filter(b => b.status === 'completed' && b.date >= ms && b.date <= me);
    const revEntries = completed.map(b => {
      const t = DataService.findTrainer(b.trainerId);
      const c = DataService.findClient(b.clientId);
      const r = DataService.findCourt(b.courtId);
      return {
        date: b.date,
        type: 'revenue',
        desc: `Аренда корта: ${r?r.name:'—'}, ${c?c.name:'—'} с тренером ${t?t.name:'—'}`,
        amount: b.price || 0,
        status: 'paid'
      };
    });

    // Expense entries (trainer payouts)
    const expEntries = completed.filter(b => b.trainerPay > 0).map(b => {
      const t = DataService.findTrainer(b.trainerId);
      return {
        date: b.date,
        type: 'expense',
        desc: `Оплата тренера: ${t?t.name:'—'} (${fmtMoney(t?t.ratePerHour:0)} ₽/ч)`,
        amount: b.trainerPay || 0,
        status: 'pending'
      };
    });

    const allEntries = [...revEntries, ...expEntries].sort((a,b) => b.date.localeCompare(a.date) || (a.type==='expense'?1:-1));

    const renderRegTable = (filter = 'all') => {
      const filtered = filter === 'all' ? allEntries : allEntries.filter(e => e.type === filter);
      const totalRev = revEntries.reduce((s,e) => s + e.amount, 0);
      const totalExp = expEntries.reduce((s,e) => s + e.amount, 0);
      const fRev = filter === 'expense' ? 0 : totalRev;
      const fExp = filter === 'revenue' ? 0 : totalExp;

      $('#reg-stats').innerHTML = `
        <div class="stat-cards" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
          <div class="stat-card"><div class="stat-value" style="color:var(--success);">${fmtMoney(fRev)} ₽</div><div class="stat-label">Поступления</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--danger);">${fmtMoney(fExp)} ₽</div><div class="stat-label">К выплате</div></div>
          <div class="stat-card"><div class="stat-value" style="color:${fRev>=fExp?'var(--success)':'var(--danger)'};">${fmtMoney(fRev-fExp)} ₽</div><div class="stat-label">Остаток</div></div>
        </div>
      `;

      $('#reg-tbody').innerHTML = filtered.map(e => `
        <tr>
          <td>${fmtDate(e.date)}</td>
          <td>${e.type === 'revenue' ? '<span class="badge badge-green">Приход</span>' : '<span class="badge badge-orange">Расход</span>'}</td>
          <td>${e.desc}</td>
          <td class="cell-right" style="color:${e.type==='revenue'?'var(--success)':'var(--danger)'};">${fmtMoney(e.amount)} ₽</td>
          <td>${e.status==='paid'?'<span class="badge badge-green">Проведено</span>':'<span class="badge badge-gray">Ожидает</span>'}</td>
        </tr>
      `).join('') || '<tr><td colspan="5" class="cell-muted">Нет операций</td></tr>';
    };

    App.renderPage(`
      <div id="reg-stats"></div>
      <div class="table-wrap"><table><thead><tr><th>Дата</th><th>Тип</th><th>Описание</th><th class="cell-right">Сумма</th><th>Статус</th></tr></thead><tbody id="reg-tbody"></tbody></table></div>
    `);

    renderRegTable();

    document.getElementById('reg-month').addEventListener('change', function() {
      AdminPage._setAdminMonth(this.value);
      AdminPage.renderRegistry();
    });

    document.getElementById('reg-filter').addEventListener('change', function() {
      renderRegTable(this.value);
    });
  }
};
