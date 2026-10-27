import { Traveler } from '../types';

export interface BirthdayInfo {
  hasBirthday: boolean;
  birthDate: string; // YYYY-MM-DD
  day: number;
  month: number; // 1 - 12
  monthName: string;
  formattedDayMonth: string; // "14 de Maio"
  currentAge?: number;
  turningAge: number;
  daysUntil: number; // 0 = hoje, 1 = amanhã, etc.
  isToday: boolean;
  isTomorrow: boolean;
  isUpcomingWeek: boolean; // 1 a 7 dias
  isUpcoming15: boolean; // 1 a 15 dias
  isCurrentMonth: boolean;
  statusText: string;
  badgeVariant: 'today' | 'tomorrow' | 'week' | 'month' | 'distant' | 'none';
}

export const MONTH_NAMES_BR = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Computes birthday indicators and upcoming status for a given YYYY-MM-DD string.
 */
export function getBirthdayInfo(birthDateStr?: string): BirthdayInfo {
  if (!birthDateStr || typeof birthDateStr !== 'string') {
    return {
      hasBirthday: false,
      birthDate: '',
      day: 0,
      month: 0,
      monthName: '',
      formattedDayMonth: '-',
      turningAge: 0,
      daysUntil: 9999,
      isToday: false,
      isTomorrow: false,
      isUpcomingWeek: false,
      isUpcoming15: false,
      isCurrentMonth: false,
      statusText: 'Sem data de nascimento',
      badgeVariant: 'none',
    };
  }

  const parts = birthDateStr.split('-');
  if (parts.length !== 3) {
    return {
      hasBirthday: false,
      birthDate: birthDateStr,
      day: 0,
      month: 0,
      monthName: '',
      formattedDayMonth: '-',
      turningAge: 0,
      daysUntil: 9999,
      isToday: false,
      isTomorrow: false,
      isUpcomingWeek: false,
      isUpcoming15: false,
      isCurrentMonth: false,
      statusText: 'Data inválida',
      badgeVariant: 'none',
    };
  }

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10); // 1-12
  const birthDay = parseInt(parts[2], 10); // 1-31

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay) || birthMonth < 1 || birthMonth > 12) {
    return {
      hasBirthday: false,
      birthDate: birthDateStr,
      day: 0,
      month: 0,
      monthName: '',
      formattedDayMonth: '-',
      turningAge: 0,
      daysUntil: 9999,
      isToday: false,
      isTomorrow: false,
      isUpcomingWeek: false,
      isUpcoming15: false,
      isCurrentMonth: false,
      statusText: 'Data inválida',
      badgeVariant: 'none',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth(); // 0-11
  const currentDay = today.getDate();

  // Birthday date this year
  let nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
  nextBirthday.setHours(0, 0, 0, 0);

  // If this year's birthday already passed (strictly before today), use next year
  let targetYear = currentYear;
  if (nextBirthday.getTime() < today.getTime()) {
    targetYear = currentYear + 1;
    nextBirthday = new Date(targetYear, birthMonth - 1, birthDay);
    nextBirthday.setHours(0, 0, 0, 0);
  }

  const diffMs = nextBirthday.getTime() - today.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isToday = daysUntil === 0;
  const isTomorrow = daysUntil === 1;
  const isUpcomingWeek = daysUntil > 0 && daysUntil <= 7;
  const isUpcoming15 = daysUntil > 0 && daysUntil <= 15;
  const isCurrentMonth = birthMonth - 1 === currentMonthIdx;

  const turningAge = targetYear - birthYear;
  const currentAge = isToday ? turningAge : (targetYear > currentYear ? turningAge - 1 : currentYear - birthYear);

  const monthName = MONTH_NAMES_BR[birthMonth - 1] || '';
  const formattedDayMonth = `${birthDay.toString().padStart(2, '0')} de ${monthName}`;

  let statusText = '';
  let badgeVariant: BirthdayInfo['badgeVariant'] = 'distant';

  if (isToday) {
    statusText = 'É HOJE! Parabéns!';
    badgeVariant = 'today';
  } else if (isTomorrow) {
    statusText = 'Amanhã! Quase lá!';
    badgeVariant = 'tomorrow';
  } else if (isUpcomingWeek) {
    statusText = `Em ${daysUntil} ${daysUntil === 1 ? 'dia' : 'dias'}`;
    badgeVariant = 'week';
  } else if (isUpcoming15) {
    statusText = `Em ${daysUntil} dias`;
    badgeVariant = 'week';
  } else if (isCurrentMonth) {
    statusText = `Neste mês (dia ${birthDay})`;
    badgeVariant = 'month';
  } else {
    statusText = `Faltam ${daysUntil} dias`;
    badgeVariant = 'distant';
  }

  return {
    hasBirthday: true,
    birthDate: birthDateStr,
    day: birthDay,
    month: birthMonth,
    monthName,
    formattedDayMonth,
    currentAge,
    turningAge,
    daysUntil,
    isToday,
    isTomorrow,
    isUpcomingWeek,
    isUpcoming15,
    isCurrentMonth,
    statusText,
    badgeVariant,
  };
}

export interface TravelerWithBirthday extends Traveler {
  birthdayInfo: BirthdayInfo;
}

/**
 * Enrich list of travelers with computed birthday details and sort by nearest upcoming birthday.
 */
export function enrichAndSortTravelersByBirthday(travelers: Traveler[]): TravelerWithBirthday[] {
  return travelers
    .map(t => ({
      ...t,
      birthdayInfo: getBirthdayInfo(t.birthDate),
    }))
    .sort((a, b) => {
      // First priority: valid birthday with lowest daysUntil
      if (a.birthdayInfo.hasBirthday && b.birthdayInfo.hasBirthday) {
        return a.birthdayInfo.daysUntil - b.birthdayInfo.daysUntil;
      }
      if (a.birthdayInfo.hasBirthday) return -1;
      if (b.birthdayInfo.hasBirthday) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
}

/**
 * Pre-fills personalized WhatsApp messages for birthdays.
 */
export function buildBirthdayWhatsAppMessage(
  traveler: Traveler,
  agencyName: string = 'Raon System',
  templateType: 'cupom' | 'afetuosa' | 'vip' = 'cupom',
  couponCode: string = 'PARABENSRAON10'
): string {
  const firstName = traveler.fullName.split(' ')[0] || traveler.fullName;
  const info = getBirthdayInfo(traveler.birthDate);

  if (templateType === 'cupom') {
    return (
      `Olá, ${firstName}! 🎂🎉\n\n` +
      `Toda a equipe da *${agencyName}* passa para lhe desejar um *Feliz Aniversário* repleto de saúde, paz, alegrias e muitas novas viagens!\n\n` +
      `E como viajar é o melhor presente, preparamos um mimo especial para você:\n` +
      `🎁 *Cupom Especial de Aniversário: ${couponCode}* (10% de desconto na sua próxima reserva com a gente!).\n\n` +
      `Que este seu novo ciclo traga destinos inesquecíveis. Parabéns de coração! ✈️🎈`
    );
  }

  if (templateType === 'vip') {
    return (
      `Parabéns, ${firstName}! 🌟🥂\n\n` +
      `Hoje é um dia muito especial para nós da *${agencyName}*! Queremos celebrar a sua vida e agradecer pela sua parceria em nossas viagens.\n\n` +
      `Desejamos que o seu ano seja leve, próspero e cheio de horizontes abertos. Conte sempre com o nosso time para criar memórias inesquecíveis!\n\n` +
      `Um grande abraço de toda a família ${agencyName}! 🏖️✨`
    );
  }

  // Afetuosa padrão
  return (
    `Parabéns pelo seu dia, ${firstName}! 🎂🎈\n\n` +
    `Que o seu aniversário seja cercado de sorrisos e pessoas queridas. Nós da *${agencyName}* desejamos muitas realizações, novas histórias e caminhos incríveis para você desbravar!\n\n` +
    `Feliz Aniversário! 🎉✈️`
  );
}
