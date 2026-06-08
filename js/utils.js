// ============================================================
// PADELPRO — УТИЛИТЫ
// ============================================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return day + '.' + m + '.' + y;
}

function fmtDateShort(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return day + '.' + m;
}

function fmtMoney(n) {
  if (n == null) return '0';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function fmtPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return '+7 ' + cleaned.slice(1,4) + ' ' + cleaned.slice(4,7) + '-' + cleaned.slice(7,9) + '-' + cleaned.slice(9,11);
  }
  return phone;
}

function plural(n, one, few, many) {
  const m = Math.abs(n) % 100;
  const m1 = m % 10;
  if (m > 10 && m < 20) return n + ' ' + many;
  if (m1 > 1 && m1 < 5) return n + ' ' + few;
  if (m1 === 1) return n + ' ' + one;
  return n + ' ' + many;
}

function debounce(fn, ms = 300) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

function statusLabel(s) {
  const map = {
    scheduled: '<span class="badge badge-blue">Запланирована</span>',
    in_progress: '<span class="badge badge-orange">Идёт</span>',
    confirmed: '<span class="badge badge-green">Подтверждена</span>',
    completed: '<span class="badge badge-gray">Завершена</span>',
    cancelled: '<span class="badge badge-red">Отменена</span>',
    no_show: '<span class="badge badge-red">Неявка</span>',
  };
  return map[s] || s;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// EventBus
const EventBus = {
  _events: {},
  on(event, fn) {
    (this._events[event] = this._events[event] || []).push(fn);
  },
  off(event, fn) {
    const list = this._events[event];
    if (list) this._events[event] = list.filter(f => f !== fn);
  },
  emit(event, ...args) {
    (this._events[event] || []).forEach(fn => fn(...args));
  }
};
