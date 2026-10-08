import { Trip, TripRegistration, RegistrationPayment, Expense } from '../types';

export function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatDateRangeBR(start?: string, end?: string): string {
  if (!start) return '-';
  if (!end || start === end) return formatDateBR(start);
  return `${formatDateBR(start)} a ${formatDateBR(end)}`;
}

export function formatDateLongBR(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return formatDateBR(dateStr);
  }
}

export function calculateDaysBetween(start?: string, end?: string): string {
  if (!start) return '';
  if (!end || start === end) return '1 dia (bate-volta)';
  try {
    const d1 = new Date(start + 'T00:00:00');
    const d2 = new Date(end + 'T00:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const nights = Math.max(0, diffDays - 1);
    return `${diffDays} dias e ${nights} ${nights === 1 ? 'noite' : 'noites'}`;
  } catch {
    return '';
  }
}

export function getDaysUntil(dateStr?: string): { days: number; label: string; isPast: boolean } {
  if (!dateStr) return { days: 0, label: '', isPast: false };
  try {
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { days: 0, label: 'É hoje! Embarque hoje!', isPast: false };
    if (diffDays === 1) return { days: 1, label: 'É amanhã! Quase na hora!', isPast: false };
    if (diffDays > 1) return { days: diffDays, label: `Faltam ${diffDays} dias para o embarque`, isPast: false };
    return { days: Math.abs(diffDays), label: 'Viagem em andamento ou realizada', isPast: true };
  } catch {
    return { days: 0, label: '', isPast: false };
  }
}

export function formatPhoneBR(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function formatCPF(cpf?: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cpf;
}

export function maskCPF(cpf?: string): string {
  if (!cpf) return '***.***.***-**';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  return '***.***.***-**';
}

export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function calculateTripOccupancy(trip: Trip, registrations: TripRegistration[]) {
  const tripRegs = registrations.filter(r => r.tripId === trip.id);
  const confirmed = tripRegs.filter(r => r.status === 'confirmed').length;
  const pending = tripRegs.filter(r => r.status === 'pending').length;
  const waitlist = tripRegs.filter(r => r.status === 'waitlist').length;
  const cancelled = tripRegs.filter(r => r.status === 'cancelled').length;

  // Occupied slots = confirmed + pending (pending blocks slot temporarily)
  const occupiedSlots = confirmed + pending;
  const availableSlots = Math.max(0, trip.capacity - occupiedSlots);
  const occupancyPercent = trip.capacity > 0 ? Math.min(100, Math.round((occupiedSlots / trip.capacity) * 100)) : 0;
  const isFull = occupiedSlots >= trip.capacity;

  return {
    totalCapacity: trip.capacity,
    confirmed,
    pending,
    waitlist,
    cancelled,
    occupiedSlots,
    availableSlots,
    occupancyPercent,
    isFull,
  };
}

export function calculateTripFinances(
  trip: Trip,
  registrations: TripRegistration[],
  payments: RegistrationPayment[],
  expenses: Expense[]
) {
  const tripRegs = registrations.filter(r => r.tripId === trip.id && r.status !== 'cancelled');
  const tripPayments = payments.filter(p => p.tripId === trip.id && !p.refunded);
  const tripExpenses = expenses.filter(e => e.tripId === trip.id);

  const totalContracted = tripRegs.reduce((acc, r) => acc + (r.contractedAmount || 0), 0);
  const totalDiscounts = tripRegs.reduce((acc, r) => acc + (r.discount || 0), 0);
  const totalEffectiveDue = tripRegs.reduce((acc, r) => acc + (r.effectiveDue || 0), 0);
  const totalReceived = tripPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPending = Math.max(0, totalEffectiveDue - totalReceived);

  // Overdue calculation (if any registration has status 'overdue' or returnDate passed and not fully paid)
  const overdueRegs = tripRegs.filter(r => r.financialStatus === 'overdue');
  const overdueAmount = overdueRegs.reduce((acc, r) => {
    const regPayments = tripPayments.filter(p => p.registrationId === r.id);
    const paid = regPayments.reduce((pAcc, p) => pAcc + p.amount, 0);
    return acc + Math.max(0, r.effectiveDue - paid);
  }, 0);

  const expensesPlanned = tripExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const expensesPaid = tripExpenses.filter(e => e.isPaid).reduce((acc, e) => acc + (e.amount || 0), 0);

  const estimatedProfit = totalEffectiveDue - expensesPlanned;
  const realizedProfit = totalReceived - expensesPaid;

  const fullyPaidCount = tripRegs.filter(r => {
    const regPayments = tripPayments.filter(p => p.registrationId === r.id);
    const paid = regPayments.reduce((pAcc, p) => pAcc + p.amount, 0);
    return paid >= r.effectiveDue && r.effectiveDue > 0;
  }).length;

  const partiallyPaidCount = tripRegs.filter(r => {
    const regPayments = tripPayments.filter(p => p.registrationId === r.id);
    const paid = regPayments.reduce((pAcc, p) => pAcc + p.amount, 0);
    return paid > 0 && paid < r.effectiveDue;
  }).length;

  const unpaidCount = tripRegs.filter(r => {
    const regPayments = tripPayments.filter(p => p.registrationId === r.id);
    const paid = regPayments.reduce((pAcc, p) => pAcc + p.amount, 0);
    return paid === 0;
  }).length;

  return {
    totalContracted,
    totalDiscounts,
    totalEffectiveDue,
    totalReceived,
    totalPending,
    overdueAmount,
    expensesPlanned,
    expensesPaid,
    estimatedProfit,
    realizedProfit,
    fullyPaidCount,
    partiallyPaidCount,
    unpaidCount,
    totalTravelers: tripRegs.length,
    paymentProgressPercent: totalEffectiveDue > 0 ? Math.min(100, Math.round((totalReceived / totalEffectiveDue) * 100)) : 0,
  };
}
