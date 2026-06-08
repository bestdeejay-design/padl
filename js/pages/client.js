// ============================================================
// PADELPRO — МОДУЛЬ КЛИЕНТА (мобильное приложение)
// ============================================================

let scannerStream = null;

const ClientPage = {

  /* ---- LOGIN ---- */

  renderLogin() {
    App.setTitle('');
    App.setHeaderActions('');
    App.setSidebar([]);
    App.setBottomNav([]);

    const clients = DataService.clients();
    const cards = clients.map(c => `
      <div class="client-login-card" data-phone="${c.phone}">
        <div class="client-login-avatar" style="background:${c.subscriptionVisitsLeft>3?'#dbeafe':c.subscriptionVisitsLeft>0?'#fef3c7':'#fee2e2'};color:${c.subscriptionVisitsLeft>3?'#1e40af':c.subscriptionVisitsLeft>0?'#92400e':'#991b1b'}">${c.name.charAt(0)}</div>
        <div class="client-login-info">
          <div class="client-login-name">${c.name}</div>
          <div class="client-login-phone">${fmtPhone(c.phone)}</div>
        </div>
        <div class="client-login-badge ${c.subscriptionVisitsLeft > 3 ? 'badge-green' : c.subscriptionVisitsLeft > 0 ? 'badge-orange' : 'badge-red'}">
          ${c.subscriptionVisitsLeft > 0 ? c.subscriptionVisitsLeft + ' занятий' : '0'}
        </div>
      </div>
    `).join('');

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <div class="mobile-logo" onclick="window.location.hash='#/'" style="cursor:pointer;">Padel<span>Pro</span></div>
          <button class="mobile-back" onclick="window.location.hash='#/'">← На главную</button>
        </div>
        <div class="mobile-body">
          <div class="mobile-section-title">Вход для клиента</div>
          <div class="mobile-section-sub">Выберите клиента или введите номер телефона</div>
          <div class="mobile-card-list">${cards}</div>
          <div class="mobile-divider">или введите номер</div>
          <div class="mobile-input-group">
            <input type="tel" class="mobile-input" id="login-phone" placeholder="+7 900 123-45-67">
            <div class="mobile-error" id="login-error"></div>
          </div>
          <button class="mobile-btn mobile-btn-primary" id="btn-login">Войти</button>
        </div>
      </div>
    `);

    $$('.client-login-card').forEach(card => {
      card.addEventListener('click', () => this._doLogin(card.dataset.phone));
    });
    $('#btn-login').addEventListener('click', () => this._doLogin($('#login-phone').value.trim()));
    $('#login-phone').addEventListener('keydown', e => { if (e.key === 'Enter') this._doLogin($('#login-phone').value.trim()); });
    // Phone mask
    $('#login-phone').addEventListener('input', function() {
      let val = this.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);
      if (val.length > 1) val = '+7 ' + val.slice(1,4) + (val.length>4?' ':'') + val.slice(4,7) + (val.length>7?'-':'') + val.slice(7,9) + (val.length>9?'-':'') + val.slice(9,11);
      else if (val.length === 1 && val !== '7') val = '+7 ' + val;
      this.value = val;
    });
    $('#login-phone').addEventListener('blur', function() {
      const val = this.value.replace(/\D/g, '');
      if (val.length > 0 && val.length < 11) { $('#login-error').textContent = 'Номер должен содержать 11 цифр'; }
      else { $('#login-error').textContent = ''; }
    });
  },

  _doLogin(phone) {
    if (!phone) { $('#login-error').textContent = 'Введите номер телефона'; return; }
    const client = DataService.clients().find(c => c.phone === phone);
    if (client) {
      App.login('client', client.id);
      window.location.hash = '#/client';
    } else {
      $('#login-error').textContent = 'Клиент с таким номером не найден';
    }
  },

  /* ---- DASHBOARD ---- */

  render() {
    const client = DataService.findClient(App.userId);
    if (!client) { window.location.hash = '#/login/client'; return; }

    App.setTitle('');
    App.setHeaderActions('');
    App.setSidebar([]);

    const subLeft = client.subscriptionVisitsLeft;
    const subPct = client.subscriptionType === 'visits12' ? (subLeft/12*100) : client.subscriptionType === 'visits8' ? (subLeft/8*100) : subLeft > 0 ? 50 : 0;
    const barColor = subPct > 40 ? 'green' : subPct > 15 ? 'orange' : 'red';

    const bookings = DataService.bookings()
      .filter(b => b.clientId === client.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.timeStart.localeCompare(b.timeStart));

    const upcoming = bookings.filter(b => b.status === 'scheduled' || b.status === 'in_progress');
    const history = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'no_show');

    // Group history by month
    const historyByMonth = {};
    history.forEach(b => {
      const m = b.date.slice(0, 7);
      if (!historyByMonth[m]) historyByMonth[m] = [];
      historyByMonth[m].push(b);
    });
    const monthNames = ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const renderHistory = () => {
      const months = Object.keys(historyByMonth).sort().reverse();
      if (months.length === 0) return '<div class="mobile-empty"><div class="mobile-empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><div>Нет завершённых тренировок</div></div>';
      return months.map(m => {
        const [y, mn] = m.split('-');
        const items = historyByMonth[m];
        const total = items.reduce((s,b) => s + (b.price||0), 0);
        return '<div class="salary-day-group"><div class="salary-day-header"><div class="sdh-left"><i class="fa-solid fa-chevron-down sdh-arrow"></i><span class="sdh-date">' + monthNames[parseInt(mn)] + ' ' + y + '</span></div><div class="sdh-right"><span class="sdh-count">' + plural(items.length, 'тренировка', 'тренировки', 'тренировок') + '</span><span class="sdh-total">' + fmtMoney(total) + ' ₽</span></div></div><div class="salary-day-body">' + items.map(b => this._historyItem(b)).join('') + '</div></div>';
      }).join('');
    };

    const renderList = (list) => {
      if (list.length === 0) return '<div class="mobile-empty"><div class="mobile-empty-icon"><i class="fa-solid fa-calendar-days"></i></div><div>Нет тренировок</div></div>';
      return list.map(b => this._bookingCard(b)).join('');
    };

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <div class="mobile-logo" onclick="window.location.hash='#/'" style="cursor:pointer;">Padel<span>Pro</span></div>
          <button class="mobile-back" onclick="App.logout()">Выйти</button>
        </div>

        <div class="mobile-subscription-bar">
          <div class="sub-row">
            <div class="sub-left">
              <div class="sub-label">${client.subscriptionLabel}</div>
              <div class="sub-value">${subLeft > 0 ? subLeft + ' занятий' : 'Нет занятий'}</div>
            </div>
            <button class="mobile-btn mobile-btn-sm mobile-btn-outline" id="btn-topup" style="font-size:11px;">Пополнить</button>
          </div>
          <div class="progress-bar"><div class="progress-bar-fill ${barColor}" style="width:${subPct}%;"></div></div>
        </div>

        <div class="mobile-body">
          <div class="mobile-tabs" id="client-tabs">
            <button class="mobile-tab active" data-tab="upcoming">Предстоящие (${upcoming.length})</button>
            <button class="mobile-tab" data-tab="history">История (${history.length})</button>
          </div>
          <div id="client-bookings-list">${renderList(upcoming)}</div>
        </div>

        <div class="mobile-bottom-nav">
          <button class="mnav-item active" data-route="#/client"><i class="fa-solid fa-calendar-days"></i><span>Тренировки</span></button>
          <button class="mnav-item" data-route="#/client/book"><i class="fa-solid fa-plus"></i><span>Запись</span></button>
          <button class="mnav-item" data-route="#/client/scan"><i class="fa-solid fa-qrcode"></i><span>Сканер</span></button>
          <button class="mnav-item" data-route="#/client/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);

    this._bindBottomNav();
    this._bindBookingActions(client);

    $('#btn-topup').addEventListener('click', () => {
      App.openModal(`
        <div class="modal-header">Пополнение абонемента<span class="modal-close">&times;</span></div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">Текущий остаток: <strong>${client.subscriptionVisitsLeft} занятий</strong></p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="mobile-btn mobile-btn-outline topup-option" data-visits="4">
              <span style="flex:1;text-align:left;">4 занятия</span>
              <span style="color:var(--text-muted);">8 000 ₽</span>
            </button>
            <button class="mobile-btn mobile-btn-outline topup-option" data-visits="8">
              <span style="flex:1;text-align:left;">8 занятий</span>
              <span style="color:var(--text-muted);">14 000 ₽ <span style="font-size:10px;color:var(--success);">−12%</span></span>
            </button>
            <button class="mobile-btn mobile-btn-outline topup-option" data-visits="12">
              <span style="flex:1;text-align:left;">12 занятий</span>
              <span style="color:var(--text-muted);">19 000 ₽ <span style="font-size:10px;color:var(--success);">−20%</span></span>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="App.closeModal()">Отмена</button>
        </div>
      `);
      $$('.topup-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const add = parseInt(btn.dataset.visits);
          DataService.updateClient(client.id, {
            subscriptionVisitsLeft: client.subscriptionVisitsLeft + add,
            subscriptionType: client.subscriptionType === 'none' ? 'visits8' : client.subscriptionType
          });
          App.closeModal();
          App.toast('Абонемент пополнен на ' + add + ' занятий', 'success');
          ClientPage.render();
        });
      });
    });

    let currentTab = 'upcoming';
    $$('.mobile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.mobile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        const el = $('#client-bookings-list');
        if (currentTab === 'history') {
          el.innerHTML = renderHistory();
          // Toggle month groups
          $$('#client-bookings-list .salary-day-header').forEach(h => {
            h.addEventListener('click', () => {
              const body = h.nextElementSibling;
              if (!body) return;
              body.classList.toggle('open');
              const arrow = h.querySelector('.sdh-arrow');
              if (arrow) { arrow.classList.toggle('fa-chevron-down'); arrow.classList.toggle('fa-chevron-up'); }
            });
          });
          // Open first month
          const fb = $('#client-bookings-list .salary-day-body');
          if (fb) fb.classList.add('open');
          const fa = $('#client-bookings-list .sdh-arrow');
          if (fa) { fa.classList.remove('fa-chevron-down'); fa.classList.add('fa-chevron-up'); }
        } else {
          el.innerHTML = renderList(upcoming);
        }
        this._bindBookingActions(client);
      });
    });
  },

  _bookingCard(b) {
    const trainer = DataService.findTrainer(b.trainerId);
    const court = DataService.findCourt(b.courtId);
    const sc = { scheduled:'blue', in_progress:'orange', completed:'gray', cancelled:'red', no_show:'red' }[b.status] || 'gray';
    const st = { scheduled:'Запланирована', in_progress:'Идёт', completed:'Завершена', cancelled:'Отменена', no_show:'Неявка' }[b.status] || b.status;

    return `
      <div class="mobile-booking-card">
        <div class="mbc-top">
          <div class="mbc-time">
            <span class="mbc-time-val">${b.timeStart.slice(0,5)}</span>
            <span class="mbc-date">${fmtDate(b.date)}</span>
          </div>
          <div class="mbc-info">
            <div class="mbc-trainer">${trainer ? trainer.name : '—'}</div>
            <div class="mbc-court">${court ? court.name : '—'} &bull; ${fmtMoney(b.price)} ₽</div>
          </div>
          <span class="badge badge-${sc}">${st}</span>
        </div>
        ${b.status === 'completed' && !b.confirmedAt ? '<div class="mbc-alert">⚠ Не подтверждена клиентом</div>' : ''}
        ${b.status === 'scheduled' ? '<div class="mbc-actions"><button class="mobile-btn mobile-btn-sm mobile-btn-outline-red" data-action="cancel" data-id="'+b.id+'">Отменить</button></div>' : ''}
        ${b.status === 'completed' ? '<div class="mbc-actions"><button class="mobile-btn mobile-btn-sm mobile-btn-outline" data-action="rebook" data-id="'+b.id+'">Повторить</button></div>' : ''}
      </div>
    `;
  },

  _historyItem(b) {
    const trainer = DataService.findTrainer(b.trainerId);
    const court = DataService.findCourt(b.courtId);
    const st = { scheduled:'Запланирована', in_progress:'Идёт', completed:'Завершена', cancelled:'Отменена', no_show:'Неявка' }[b.status] || b.status;
    const sc = { scheduled:'badge-blue', in_progress:'badge-orange', completed:'badge-gray', cancelled:'badge-red', no_show:'badge-red' }[b.status] || 'badge-gray';
    return `
      <div class="mhist-item">
        <div class="mhist-left">
          <span class="mhist-date">${fmtDate(b.date)}</span>
          <span class="mhist-time">${b.timeStart}</span>
        </div>
        <div class="mhist-mid">
          <span>${trainer ? trainer.name : '—'}</span>
          <span style="color:var(--text-muted);">${court ? court.name : '—'}</span>
        </div>
        <div class="mhist-right">
          <span class="badge ${sc}">${st}</span>
          <span style="font-weight:600;font-size:13px;">${fmtMoney(b.price)} ₽</span>
        </div>
      </div>
    `;
  },

  _bindBookingActions(client) {
    $$('[data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        App.openModal('<div class="modal-header">Отмена тренировки<span class="modal-close">&times;</span></div><div class="modal-body">Вы уверены, что хотите отменить эту тренировку?</div><div class="modal-footer"><button class="btn btn-outline" onclick="App.closeModal()">Нет</button><button class="btn btn-danger" id="confirm-cancel">Да, отменить</button></div>');
        $('#confirm-cancel').addEventListener('click', () => {
          DataService.updateBooking(id, { status: 'cancelled' });
          App.closeModal();
          App.toast('Тренировка отменена', 'info');
          ClientPage.render();
        });
      });
    });
    $$('[data-action="rebook"]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.hash = '#/client/book';
      });
    });
  },

  /* ---- BOOK TRAINING ---- */

  renderBook() {
    const client = DataService.findClient(App.userId);
    if (!client) { window.location.hash = '#/login/client'; return; }

    App.setTitle('');
    App.setHeaderActions('');
    App.setSidebar([]);

    const trainers = DataService.trainers().filter(t => t.active);
    const courts = DataService.courts();
    const timeSlots = [];
    for (let h = 8; h <= 21; h++) timeSlots.push(String(h).padStart(2,'0') + ':00');

    const dates = [];
    for (let i = 0; i < 7; i++) dates.push(daysFromNow(i));

    const dayNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <button class="mobile-back" onclick="window.location.hash='#/client'">← Назад</button>
          <div class="mobile-logo">Запись</div>
        </div>
        <div class="mobile-body">
          <div class="mobile-section-title">Выберите дату</div>
          <div class="mobile-date-strip">${dates.map((d,i) => {
            const dd = new Date(d + 'T00:00:00');
            return `<button class="mdate-btn ${i===0?'active':''}" data-date="${d}"><span class="mdate-day">${dayNames[dd.getDay()]}</span><span class="mdate-num">${d.slice(8)}</span></button>`;
          }).join('')}</div>

          <div id="step-time" style="display:none;margin-top:20px;">
            <div class="mobile-section-title">Выберите время</div>
            <div class="mobile-slot-grid" id="time-grid"></div>
          </div>
          <div id="step-trainer" style="display:none;margin-top:20px;">
            <div class="mobile-section-title">Выберите тренера</div>
            <div id="trainer-list"></div>
          </div>
          <div id="step-court" style="display:none;margin-top:20px;">
            <div class="mobile-section-title">Выберите корт</div>
            <div id="court-list"></div>
          </div>
          <div id="step-confirm" style="display:none;margin-top:20px;">
            <div class="mobile-section-title">Подтверждение</div>
            <div class="mobile-confirm-block" id="confirm-details"></div>
            <button class="mobile-btn mobile-btn-primary mobile-btn-block" id="btn-confirm-book">Записаться</button>
          </div>
        </div>
        <div class="mobile-bottom-nav">
          <button class="mnav-item" data-route="#/client"><i class="fa-solid fa-calendar-days"></i><span>Тренировки</span></button>
          <button class="mnav-item active" data-route="#/client/book"><i class="fa-solid fa-plus"></i><span>Запись</span></button>
          <button class="mnav-item" data-route="#/client/scan"><i class="fa-solid fa-qrcode"></i><span>Сканер</span></button>
          <button class="mnav-item" data-route="#/client/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);

    this._bindBottomNav();
    const state = { date: dates[0], time: null, trainerId: null, courtId: null };

    const updateSlots = () => {
      if (!state.date) return;
      const busy = DataService.bookings().filter(b => b.date === state.date && b.status !== 'cancelled');
      const allTrainers = trainers.map(t => t.id);
      const allCourts = courts.map(r => r.id);

      const slots = timeSlots.map(t => {
        const busyTrainers = allTrainers.filter(tid => busy.some(b => b.trainerId === tid && b.timeStart === t));
        const busyCourts = allCourts.filter(rid => busy.some(b => b.courtId === rid && b.timeStart === t));
        const allBusy = busyTrainers.length === allTrainers.length || busyCourts.length === allCourts.length;
        return { time: t, busy: allBusy, freeT: allTrainers.length - busyTrainers.length, freeR: allCourts.length - busyCourts.length };
      });

      $('#time-grid').innerHTML = slots.map(s => `
        <button class="mslot-btn ${s.busy?'mslot-busy':''} ${state.time===s.time?'mslot-active':''}"
          ${s.busy?'disabled':''} data-time="${s.time}">
          ${s.time}
          ${!s.busy ? `<span class="mslot-avail">${s.freeT} тренера &bull; ${s.freeR} корта</span>` : '<span class="mslot-avail" style="color:#cbd5e1;">нет мест</span>'}
        </button>
      `).join('');

      $$('.mslot-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          state.time = btn.dataset.time;
          state.trainerId = state.courtId = null;
          updateSlots();
          showTrainers();
        });
      });
      $('#step-time').style.display = 'block';
    };

    const showTrainers = () => {
      if (!state.time) return;
      const busySlots = DataService.bookings().filter(b => b.date === state.date && b.timeStart === state.time && b.status !== 'cancelled');

      $('#trainer-list').innerHTML = trainers.map(t => {
        const isFree = !busySlots.some(b => b.trainerId === t.id);
        return `
        <div class="trainer-card-full ${state.trainerId===t.id?'card-selected':''} ${!isFree?'trainer-busy':''}" data-tid="${t.id}" ${!isFree?'data-busy="1"':''}>
          <div class="trainer-card-top">
            <div class="trainer-avatar" style="background:${isFree?'var(--primary-light)':'#f1f5f9'};color:${isFree?'var(--primary)':'#94a3b8'}">${t.name.charAt(0)}</div>
            <div class="trainer-card-info">
              <div class="trainer-card-name">${t.name}</div>
              <div class="trainer-card-spec">${t.specializations.join(', ')}</div>
            </div>
            ${isFree ? '<span class="trainer-badge-free">Свободен</span>' : '<span class="trainer-badge-busy">Занят</span>'}
          </div>
        </div>
      `}).join('');

      $$('#trainer-list .trainer-card-full:not([data-busy])').forEach(c => {
        c.addEventListener('click', () => {
          state.trainerId = c.dataset.tid;
          showTrainers();
          showCourts();
        });
      });

      $('#step-trainer').style.display = 'block';
    };

    const showCourts = () => {
      if (!state.trainerId) return;
      const busySlots = DataService.bookings().filter(b => b.date === state.date && b.timeStart === state.time && b.status !== 'cancelled');

      $('#court-list').innerHTML = courts.map(r => {
        const isFree = !busySlots.some(b => b.courtId === r.id);
        const imgColor = r.type === 'indoor' ? '#1e3a5f' : '#2d5a27';
        return `
        <div class="court-card-full ${state.courtId===r.id?'card-selected':''} ${!isFree?'court-busy':''}" data-rid="${r.id}" ${!isFree?'data-busy="1"':''}>
          <div class="court-img" style="background:${imgColor};">
            <div class="court-img-overlay">
              <span class="court-img-icon"><i class="fa-solid ${r.type==='indoor'?'fa-warehouse':'fa-tree'}"></i></span>
              <span class="court-img-type">${r.type==='indoor'?'Закрытый корт':'Открытый корт'}</span>
            </div>
            ${isFree ? '<span class="court-badge-free">Свободен</span>' : '<span class="court-badge-busy">Занят</span>'}
          </div>
          <div class="court-info">
            <div class="court-name">${r.name}</div>
            <div class="court-meta">
              <span><i class="fa-solid fa-table-tennis-paddle-ball"></i> ${r.surface==='artificial'?'Искусственная трава':'Бетон'}</span>
              <span><i class="fa-solid ${r.type==='indoor'?'fa-warehouse':'fa-sun'}"></i> ${r.type==='indoor'?'Крытый':'Улица'}</span>
            </div>
            <div class="court-price">${fmtMoney(r.hourlyRate)} ₽/час</div>
          </div>
          <i class="fa-solid fa-check-circle court-check"></i>
        </div>
      `}).join('');

      $$('#court-list .court-card-full:not([data-busy])').forEach(c => {
        c.addEventListener('click', () => {
          state.courtId = c.dataset.rid;
          showCourts();
          showConfirm();
        });
      });

      $('#step-court').style.display = 'block';
    };

    const showConfirm = () => {
      if (!state.courtId) return;
      const t = DataService.findTrainer(state.trainerId);
      const r = DataService.findCourt(state.courtId);
      $('#confirm-details').innerHTML = `
        <div class="confirm-grid">
          <span>Дата</span><strong>${fmtDate(state.date)}</strong>
          <span>Время</span><strong>${state.time}</strong>
          <span>Тренер</span><strong>${t?t.name:'—'}</strong>
          <span>Корт</span><strong>${r?r.name:'—'}</strong>
          <span>Стоимость</span><strong>${fmtMoney(r?r.hourlyRate:0)} ₽</strong>
        </div>
      `;
      $('#step-confirm').style.display = 'block';
    };

    $('#btn-confirm-book').addEventListener('click', () => {
      const r = DataService.findCourt(state.courtId);
      DataService.addBooking({
        clientId: client.id, trainerId: state.trainerId, courtId: state.courtId,
        date: state.date, timeStart: state.time,
        timeEnd: (parseInt(state.time)+1).toString().padStart(2,'0')+':00',
        price: r ? r.hourlyRate : 2000, status: 'scheduled'
      });
      App.toast('Запись на ' + fmtDate(state.date) + ' в ' + state.time, 'success');
      window.location.hash = '#/client';
    });

    $$('.mdate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.mdate-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.date = btn.dataset.date;
        state.time = null;
        state.trainerId = null;
        state.courtId = null;
        ['step-time','step-trainer','step-court','step-confirm'].forEach(id => {
          const el = $('#'+id); if (el) el.style.display = 'none';
        });
        updateSlots();
      });
    });

    updateSlots();
  },

  /* ---- QR SCANNER ---- */

  renderScan() {
    const client = DataService.findClient(App.userId);
    if (!client) { window.location.hash = '#/login/client'; return; }

    App.setTitle('');
    App.setHeaderActions('');
    App.setSidebar([]);

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <button class="mobile-back" onclick="window.location.hash='#/client'">← Назад</button>
          <div class="mobile-logo">Сканер QR</div>
        </div>
        <div class="mobile-body">
          <div class="mobile-scanner-box">
            <video id="scanner-video" autoplay playsinline></video>
            <canvas id="scanner-canvas" class="hidden"></canvas>
            <div class="mobile-scanner-frame"></div>
          </div>
          <div id="scan-result" class="mobile-scan-msg" style="display:none;"></div>
          <p class="mobile-scan-hint">Наведите камеру на QR-код тренера</p>
          <div class="mobile-input-group" style="margin-top:16px;">
            <input type="text" class="mobile-input" id="manual-code" placeholder="Или введите ID записи вручную">
          </div>
          <button class="mobile-btn mobile-btn-outline mobile-btn-block" id="btn-manual-confirm">Подтвердить</button>
        </div>
        <div class="mobile-bottom-nav">
          <button class="mnav-item" data-route="#/client"><i class="fa-solid fa-calendar-days"></i><span>Тренировки</span></button>
          <button class="mnav-item" data-route="#/client/book"><i class="fa-solid fa-plus"></i><span>Запись</span></button>
          <button class="mnav-item active" data-route="#/client/scan"><i class="fa-solid fa-qrcode"></i><span>Сканер</span></button>
          <button class="mnav-item" data-route="#/client/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);

    this._bindBottomNav();
    this._startScanner(client);
    $('#btn-manual-confirm').addEventListener('click', () => {
      const code = $('#manual-code').value.trim();
      if (code) this._confirmByCode(client, code);
    });
  },

  _startScanner(client) {
    if (scannerStream) this._stopScanner();
    const video = $('#scanner-video');
    const canvas = $('#scanner-canvas');
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    }).then(stream => {
      scannerStream = stream;
      video.srcObject = stream;
      video.play();
      const tick = () => {
        if (!scannerStream) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) { this._confirmByCode(client, code.data); return; }
          }
        }
        requestAnimationFrame(tick);
      };
      tick();
    }).catch(() => { this._showScanResult(false, 'Нет доступа к камере'); });
  },

  _stopScanner() {
    if (scannerStream) { scannerStream.getTracks().forEach(t => t.stop()); scannerStream = null; }
  },

  _confirmByCode(client, code) {
    let data;
    try { data = JSON.parse(code); } catch(e) { data = { booking_id: code }; }
    const bookingId = data.booking_id || code;
    const booking = DataService.findBooking(bookingId);
    if (!booking || booking.clientId !== client.id) { this._showScanResult(false, 'Запись не найдена'); return; }
    if (booking.status !== 'in_progress') { this._showScanResult(false, 'Тренировка ещё не начата тренером'); return; }
    if (booking.confirmedAt) { this._showScanResult(false, 'Уже подтверждено'); return; }

    DataService.updateBooking(bookingId, {
      confirmedAt: new Date().toISOString(),
      status: 'completed',
      trainerPay: DataService.findTrainer(booking.trainerId)?.ratePerHour || 0
    });
    DataService.updateClient(client.id, {
      subscriptionVisitsLeft: Math.max(0, client.subscriptionVisitsLeft - 1),
      totalVisits: client.totalVisits + 1
    });
    const t = DataService.findTrainer(booking.trainerId);
    this._showScanResult(true, 'Подтверждено! ' + (t?t.name:'') + ' — списано 1 занятие');
    this._stopScanner();
    App.toast('Списано 1 занятие', 'success');
  },

  _showScanResult(ok, msg) {
    const el = $('#scan-result');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = ok ? 'var(--success-light)' : 'var(--danger-light)';
    el.style.color = ok ? '#065f46' : '#991b1b';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  },

  /* ---- PROFILE ---- */

  renderProfile() {
    const client = DataService.findClient(App.userId);
    if (!client) { window.location.hash = '#/login/client'; return; }

    App.setTitle('');
    App.setHeaderActions('');
    App.setSidebar([]);

    App.renderPage(`
      <div class="mobile-shell">
        <div class="mobile-header">
          <button class="mobile-back" onclick="window.location.hash='#/client'">← Назад</button>
          <div class="mobile-logo">Профиль</div>
        </div>
        <div class="mobile-body">
          <div class="mobile-profile-header">
            <div class="mph-avatar">${client.name.charAt(0)}</div>
            <div class="mph-name">${client.name}</div>
            <div class="mph-phone">${fmtPhone(client.phone)}</div>
            <button class="mobile-btn mobile-btn-sm mobile-btn-outline mt-12" id="btn-edit-profile">Редактировать</button>
          </div>
          <div class="mobile-stats-row">
            <div class="mstat"><div class="mstat-val">${client.subscriptionLabel}</div><div class="mstat-lbl">Абонемент</div></div>
            <div class="mstat"><div class="mstat-val" style="color:${client.subscriptionVisitsLeft>3?'var(--success)':client.subscriptionVisitsLeft>0?'var(--warning)':'var(--danger)'}">${client.subscriptionVisitsLeft}</div><div class="mstat-lbl">Осталось</div></div>
            <div class="mstat"><div class="mstat-val">${client.totalVisits}</div><div class="mstat-lbl">Всего</div></div>
          </div>
          ${client.subscriptionExpiry ? `<div style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:4px;">Срок действия: ${fmtDate(client.subscriptionExpiry)}</div>` : ''}
        </div>
        <div class="mobile-bottom-nav">
          <button class="mnav-item" data-route="#/client"><i class="fa-solid fa-calendar-days"></i><span>Тренировки</span></button>
          <button class="mnav-item" data-route="#/client/book"><i class="fa-solid fa-plus"></i><span>Запись</span></button>
          <button class="mnav-item" data-route="#/client/scan"><i class="fa-solid fa-qrcode"></i><span>Сканер</span></button>
          <button class="mnav-item active" data-route="#/client/profile"><i class="fa-solid fa-user"></i><span>Профиль</span></button>
        </div>
      </div>
    `);
    this._bindBottomNav();

    $('#btn-edit-profile').addEventListener('click', () => {
      App.openModal(`
        <div class="modal-header">Редактирование профиля<span class="modal-close">&times;</span></div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Имя</label>
            <input class="form-input" id="edit-name" value="${client.name}">
          </div>
          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input class="form-input" id="edit-phone" value="${client.phone}">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="edit-email" value="${client.email || ''}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="App.closeModal()">Отмена</button>
          <button class="btn btn-primary" id="btn-save-profile">Сохранить</button>
        </div>
      `);
      $('#btn-save-profile').addEventListener('click', () => {
        DataService.updateClient(client.id, {
          name: $('#edit-name').value,
          phone: $('#edit-phone').value,
          email: $('#edit-email').value
        });
        App.closeModal();
        App.toast('Профиль обновлён', 'success');
        ClientPage.renderProfile();
      });
    });
  },

  _bindBottomNav() {
    $$('.mnav-item').forEach(item => {
      const clone = item.cloneNode(true);
      item.parentNode.replaceChild(clone, item);
    });
    $$('.mnav-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        if (route) window.location.hash = route;
      });
    });
  }
};
