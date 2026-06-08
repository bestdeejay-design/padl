// ============================================================
// PADELPRO — МОДЕЛИ ДАННЫХ
// ============================================================

class Trainer {
  constructor(d) {
    this.id = d.id || uid('t');
    this.name = d.name || '';
    this.phone = d.phone || '';
    this.code = d.code || '';
    this.ratePerHour = d.ratePerHour || 0;
    this.specializations = d.specializations || [];
    this.active = d.active !== false;
    this.hiredDate = d.hiredDate || '';
    this.totalHoursMonth = d.totalHoursMonth || 0;
    this.totalEarnedMonth = d.totalEarnedMonth || 0;
  }
}

class Client {
  constructor(d) {
    this.id = d.id || uid('c');
    this.name = d.name || '';
    this.phone = d.phone || '';
    this.email = d.email || '';
    this.subscriptionType = d.subscriptionType || 'none';
    this.subscriptionVisitsLeft = d.subscriptionVisitsLeft || 0;
    this.subscriptionExpiry = d.subscriptionExpiry || null;
    this.totalVisits = d.totalVisits || 0;
    this.createdAt = d.createdAt || todayStr();
    this.notes = d.notes || '';
  }

  get subscriptionLabel() {
    const map = {
      visits8: '8 занятий',
      visits12: '12 занятий',
      unlimited: 'Безлимит',
      none: 'Без абонемента'
    };
    return map[this.subscriptionType] || '—';
  }
}

class Court {
  constructor(d) {
    this.id = d.id || uid('r');
    this.name = d.name || '';
    this.type = d.type || 'indoor';
    this.hourlyRate = d.hourlyRate || 2000;
    this.surface = d.surface || 'artificial';
  }
}

class Booking {
  constructor(d) {
    this.id = d.id || uid('b');
    this.clientId = d.clientId || '';
    this.trainerId = d.trainerId || '';
    this.courtId = d.courtId || '';
    this.date = d.date || todayStr();
    this.timeStart = d.timeStart || '09:00';
    this.timeEnd = d.timeEnd || '10:00';
    this.price = d.price || 2000;
    this.status = d.status || 'scheduled';
    this.qrCode = d.qrCode || null;
    this.qrGeneratedAt = d.qrGeneratedAt || null;
    this.confirmedAt = d.confirmedAt || null;
    this.startedAt = d.startedAt || null;
    this.trainerPay = d.trainerPay || null;
  }
}

class FinanceRecord {
  constructor(d) {
    this.id = d.id || uid('f');
    this.date = d.date || todayStr();
    this.type = d.type || 'revenue';
    this.category = d.category || 'training';
    this.amount = d.amount || 0;
    this.bookingId = d.bookingId || null;
    this.description = d.description || '';
  }
}
