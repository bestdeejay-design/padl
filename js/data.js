// ============================================================
// PADELPRO — DATA SERVICE + ДЕМО-ГЕНЕРАТОР
// ============================================================

const STORAGE_KEY = 'padelpro_demo_v10';

// --- DEMO DATA DEFINITIONS ---

const DEMO_TRAINERS_RAW = [
  { id:'t1', name:'Алексей Смирнов',  phone:'+79001001111', code:'1111', ratePerHour:1500, specializations:['взрослые'],          hiredDate:'2024-03-15', active:true },
  { id:'t2', name:'Мария Иванова',    phone:'+79001002222', code:'2222', ratePerHour:2000, specializations:['взрослые','группы'], hiredDate:'2024-01-20', active:true },
  { id:'t3', name:'Сергей Петров',    phone:'+79001003333', code:'3333', ratePerHour:1200, specializations:['дети'],              hiredDate:'2024-06-01', active:true },
  { id:'t4', name:'Ольга Новикова',   phone:'+79001004444', code:'4444', ratePerHour:1800, specializations:['взрослые','дети'],   hiredDate:'2024-02-10', active:true },
  { id:'t5', name:'Дмитрий Козлов',   phone:'+79001005555', code:'5555', ratePerHour:1600, specializations:['группы'],            hiredDate:'2024-04-05', active:true },
  { id:'t6', name:'Анна Морозова',    phone:'+79001006666', code:'6666', ratePerHour:2200, specializations:['взрослые PRO'],      hiredDate:'2023-11-01', active:true },
];

const DEMO_CLIENTS_RAW = [
  { id:'c1', name:'Иван Петров',      phone:'+79001234567', email:'ivan@example.com', subscriptionType:'visits12', subscriptionVisitsLeft:7,  subscriptionExpiry:'2026-07-15', totalVisits:18, createdAt:'2025-09-01' },
  { id:'c2', name:'Елена Сидорова',   phone:'+79009876543', email:'elena@example.com', subscriptionType:'visits8',  subscriptionVisitsLeft:3,  subscriptionExpiry:'2026-06-30', totalVisits:22, createdAt:'2025-11-10' },
  { id:'c3', name:'Дмитрий Волков',   phone:'+79001112233', email:'dmitry@example.com',subscriptionType:'none',     subscriptionVisitsLeft:0,  subscriptionExpiry:null,           totalVisits:5,  createdAt:'2026-01-15' },
  { id:'c4', name:'Анна Кузнецова',   phone:'+79004445566', email:'anna@example.com',  subscriptionType:'visits12', subscriptionVisitsLeft:11, subscriptionExpiry:'2026-08-01', totalVisits:8,  createdAt:'2026-02-20' },
  { id:'c5', name:'Михаил Фёдоров',   phone:'+79007778899', email:'mikhail@example.com',subscriptionType:'visits8', subscriptionVisitsLeft:1,  subscriptionExpiry:'2026-06-15', totalVisits:15, createdAt:'2025-08-15' },
];

const DEMO_COURTS_RAW = [
  { id:'r1', name:'Корт №1', type:'indoor',  hourlyRate:2000, surface:'artificial' },
  { id:'r2', name:'Корт №2', type:'indoor',  hourlyRate:2000, surface:'artificial' },
  { id:'r3', name:'Корт №3', type:'outdoor', hourlyRate:1500, surface:'concrete' },
  { id:'r4', name:'Корт №4', type:'outdoor', hourlyRate:1500, surface:'concrete' },
];

const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00','21:00'
];

// Peak hours: 17-20 high demand, 11-13 low demand
const SLOT_WEIGHTS = {
  '08:00':0.4, '09:00':0.5, '10:00':0.5, '11:00':0.3, '12:00':0.3, '13:00':0.3,
  '14:00':0.5, '15:00':0.6, '16:00':0.7, '17:00':0.9, '18:00':1.0, '19:00':1.0,
  '20:00':0.8, '21:00':0.5
};

// --- GENERATE DEMO BOOKINGS ---

function generateDemoBookings(trainers, clients, courts) {
  const bookings = [];
  const used = new Set();
  const now = new Date();
  const yearStart = new Date(2026, 0, 1);
  const totalDays = Math.floor((now - yearStart) / 86400000) + 3;

  for (let dayOffset = -totalDays; dayOffset <= 2; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const date = d.toISOString().slice(0, 10);
    const isPast = dayOffset < -1 || (dayOffset === -1 ? now.getHours() > 8 : false);
    const isToday = dayOffset === 0;
    const isFuture = dayOffset > 0;

    // Number of bookings per day, weighted by day of week
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const maxBookings = isWeekend ? 10 : 14;
    const minBookings = isWeekend ? 4 : 6;
    const count = randInt(minBookings, maxBookings);

    for (let i = 0; i < count; i++) {
      // Weighted slot selection
      const slot = weightedSlot();
      const court = pick(courts);
      const key = `${date}|${slot}|${court.id}`;
      if (used.has(key)) continue;
      used.add(key);

      const trainer = pick(trainers);
      const client = pick(clients);

      // Determine status
      let status = 'scheduled';
      if (isPast) {
        const roll = Math.random();
        if (roll < 0.15) status = 'cancelled';
        else if (roll < 0.20) status = 'no_show';
        else status = 'completed';
      } else if (isToday) {
        const hour = parseInt(slot.split(':')[0]);
        if (hour <= now.getHours() - 1) status = Math.random() < 0.8 ? 'completed' : 'cancelled';
        else if (hour === now.getHours()) status = Math.random() < 0.5 ? 'in_progress' : 'scheduled';
        else status = 'scheduled';
      }

      bookings.push({
        id: uid('b'),
        clientId: client.id,
        trainerId: trainer.id,
        courtId: court.id,
        date,
        timeStart: slot,
        timeEnd: addHour(slot),
        price: court.hourlyRate,
        status,
        qrCode: null,
        qrGeneratedAt: null,
        confirmedAt: status === 'completed' ? date + 'T' + slot + ':05.000Z' : null,
        startedAt: status === 'completed' || status === 'in_progress' ? date + 'T' + slot + ':00.000Z' : null,
        trainerPay: status === 'completed' ? trainer.ratePerHour : null
      });
    }
  }

  return bookings.sort((a, b) => a.date.localeCompare(b.date) || a.timeStart.localeCompare(b.timeStart));
}

function weightedSlot() {
  const slots = Object.keys(SLOT_WEIGHTS);
  const total = slots.reduce((s, k) => s + SLOT_WEIGHTS[k], 0);
  let r = Math.random() * total;
  for (const k of slots) {
    r -= SLOT_WEIGHTS[k];
    if (r <= 0) return k;
  }
  return '18:00';
}

function addHour(time) {
  const [h, m] = time.split(':').map(Number);
  const nh = (h + 1) % 24;
  return String(nh).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

// --- GENERATE FINANCE RECORDS ---

function generateFinance(bookings, courts) {
  const records = [];
  const months = {};

  bookings.forEach(b => {
    if (b.status !== 'completed') return;
    const month = b.date.slice(0, 7);
    if (!months[month]) months[month] = { revenue: 0 };
    months[month].revenue += b.price || 0;
  });

  // Daily revenue records from completed bookings
  const days = {};
  bookings.forEach(b => {
    if (b.status !== 'completed') return;
    days[b.date] = (days[b.date] || 0) + (b.price || 0);
  });

  Object.entries(days).forEach(([date, amount]) => {
    records.push({ id: uid('f'), date, type: 'revenue', category: 'training', amount, description: 'Выручка за тренировки' });
  });

  // Add some expense records
  const expenseCategories = [
    { cat: 'salary', label: 'Зарплата тренеров', pct: 0.35 },
    { cat: 'rent', label: 'Аренда помещения', pct: 0.25 },
    { cat: 'maintenance', label: 'Обслуживание кортов', pct: 0.12 },
    { cat: 'utilities', label: 'Коммунальные услуги', pct: 0.05 },
    { cat: 'marketing', label: 'Маркетинг', pct: 0.05 },
  ];

  // Generate expenses for the full period
  const yearStart = new Date(2026, 0, 1);
  const dayCount = Math.floor((new Date() - yearStart) / 86400000);
  for (let offset = -dayCount; offset <= 0; offset += randInt(3, 7)) {
    const date = daysFromNow(offset);
    const dayRevenue = Object.entries(days)
      .filter(([d]) => d.slice(0, 7) === date.slice(0, 7))
      .reduce((s, [, a]) => s + a, 0) || 100000;

    expenseCategories.forEach(({ cat, label, pct }) => {
      if (cat === 'salary' && offset % 7 !== 0) return; // salary once a week
      if (cat !== 'salary' && offset % 14 !== 0) return; // others biweekly

      records.push({
        id: uid('f'),
        date,
        type: 'expense',
        category: cat,
        amount: Math.round(dayRevenue * pct * (0.8 + Math.random() * 0.4)),
        description: label
      });
    });
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

// --- COMPUTE TRAINER STATS ---

function computeTrainerStats(trainers, bookings) {
  trainers.forEach(t => {
    const completed = bookings.filter(b => b.trainerId === t.id && b.status === 'completed');
    t.totalHoursMonth = completed.length;
    t.totalEarnedMonth = completed.reduce((s, b) => s + (b.trainerPay || 0), 0);
  });
}

// --- DATA SERVICE ---

const DataService = {
  _state: null,

  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this._state = this._hydrate(parsed);
        return this._state;
      } catch(e) { /* corrupted, regenerate */ }
    }
    return this._generateDemo();
  },

  _hydrate(parsed) {
    return {
      trainers: (parsed.trainers || []).map(d => new Trainer(d)),
      clients: (parsed.clients || []).map(d => new Client(d)),
      courts: (parsed.courts || []).map(d => new Court(d)),
      bookings: (parsed.bookings || []).map(d => new Booking(d)),
      finance: (parsed.finance || []).map(d => new FinanceRecord(d)),
    };
  },

  _generateDemo() {
    const trainers = DEMO_TRAINERS_RAW.map(d => new Trainer(d));
    const clients = DEMO_CLIENTS_RAW.map(d => new Client(d));
    const courts = DEMO_COURTS_RAW.map(d => new Court(d));
    const bookings = generateDemoBookings(trainers, clients, courts);
    const finance = generateFinance(bookings, courts);
    computeTrainerStats(trainers, bookings);

    this._state = { trainers, clients, courts, bookings, finance };
    this.save();
    return this._state;
  },

  get state() { return this._state; },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    return this._generateDemo();
  },

  trainers()  { return this._state.trainers; },
  clients()   { return this._state.clients; },
  courts()    { return this._state.courts; },
  bookings()  { return this._state.bookings; },
  finance()   { return this._state.finance; },

  findTrainer(id) { return this._state.trainers.find(t => t.id === id); },
  findClient(id)  { return this._state.clients.find(c => c.id === id); },
  findCourt(id)   { return this._state.courts.find(r => r.id === id); },
  findBooking(id) { return this._state.bookings.find(b => b.id === id); },

  addBooking(data) {
    const b = new Booking(data);
    this._state.bookings.push(b);
    this.save();
    EventBus.emit('booking-added', b);
    EventBus.emit('data-changed');
    return b;
  },

  updateBooking(id, data) {
    const b = this.findBooking(id);
    if (!b) return null;
    Object.assign(b, data);
    this.save();
    EventBus.emit('booking-updated', b);
    EventBus.emit('data-changed');
    return b;
  },

  updateClient(id, data) {
    const c = this.findClient(id);
    if (!c) return null;
    Object.assign(c, data);
    this.save();
    EventBus.emit('data-changed');
    return c;
  }
};
