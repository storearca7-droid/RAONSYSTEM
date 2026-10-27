import React, { useState, useMemo } from 'react';
import {
  Cake,
  Gift,
  Calendar,
  Clock,
  Sparkles,
  Search,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Edit2,
  Copy,
  Check,
  PartyPopper,
  Users,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Traveler } from '../../types';
import {
  getBirthdayInfo,
  enrichAndSortTravelersByBirthday,
  buildBirthdayWhatsAppMessage,
  MONTH_NAMES_BR,
  TravelerWithBirthday,
} from '../../lib/birthdays';
import { formatPhoneBR, maskCPF, formatDateBR } from '../../lib/utils';

export const BirthdaysView: React.FC = () => {
  const { travelers, trips, registrations, updateTraveler, setSelectedTripId, setActiveMenu } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'all'>('all');
  const [messageModalTraveler, setMessageModalTraveler] = useState<Traveler | null>(null);
  const [messageTemplate, setMessageTemplate] = useState<'cupom' | 'afetuosa' | 'vip'>('cupom');
  const [couponCode, setCouponCode] = useState('PARABENSRAON10');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [editingBirthDateTraveler, setEditingBirthDateTraveler] = useState<Traveler | null>(null);
  const [newBirthDateInput, setNewBirthDateInput] = useState('');

  // Enrich travelers with calculated birthday metrics
  const enrichedTravelers = useMemo(() => {
    return enrichAndSortTravelersByBirthday(travelers);
  }, [travelers]);

  // Overall counters
  const birthdaysToday = useMemo(() => {
    return enrichedTravelers.filter(t => t.birthdayInfo.isToday);
  }, [enrichedTravelers]);

  const birthdaysWeek = useMemo(() => {
    return enrichedTravelers.filter(t => t.birthdayInfo.isUpcomingWeek);
  }, [enrichedTravelers]);

  const birthdaysMonth = useMemo(() => {
    return enrichedTravelers.filter(t => t.birthdayInfo.isCurrentMonth);
  }, [enrichedTravelers]);

  const totalWithBirthDate = useMemo(() => {
    return enrichedTravelers.filter(t => t.birthdayInfo.hasBirthday).length;
  }, [enrichedTravelers]);

  // Current month index (1-12)
  const currentMonthNumber = new Date().getMonth() + 1;

  // Filtered travelers list based on user choices
  const filteredTravelers = useMemo(() => {
    return enrichedTravelers.filter(t => {
      // Search query
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        t.fullName.toLowerCase().includes(term) ||
        t.cpf.includes(term) ||
        t.phone.includes(term) ||
        t.city.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Month specific filter
      if (selectedMonthFilter !== 'all') {
        return t.birthdayInfo.month === selectedMonthFilter;
      }

      // Quick filter tabs
      if (activeFilterTab === 'today') {
        return t.birthdayInfo.isToday;
      }
      if (activeFilterTab === 'week') {
        return t.birthdayInfo.isToday || t.birthdayInfo.isUpcomingWeek;
      }
      if (activeFilterTab === 'month') {
        return t.birthdayInfo.isCurrentMonth;
      }
      return true; // 'all'
    });
  }, [enrichedTravelers, searchTerm, activeFilterTab, selectedMonthFilter]);

  // Open WhatsApp greeting directly
  const handleDirectWhatsApp = (traveler: Traveler) => {
    const text = buildBirthdayWhatsAppMessage(traveler, 'Raon System', 'cupom', couponCode);
    const cleanPhone = traveler.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Open modal to customize greeting
  const handleOpenCustomizeModal = (traveler: Traveler) => {
    setMessageModalTraveler(traveler);
    setCopiedMessage(false);
  };

  // Copy customized greeting
  const handleCopyGreeting = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Save edited birth date
  const handleSaveBirthDate = () => {
    if (editingBirthDateTraveler && newBirthDateInput) {
      updateTraveler(editingBirthDateTraveler.id, {
        birthDate: newBirthDateInput,
      });
      setEditingBirthDateTraveler(null);
      setNewBirthDateInput('');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & METRICS CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hoje */}
        <div
          onClick={() => {
            setActiveFilterTab('today');
            setSelectedMonthFilter('all');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xs ${
            activeFilterTab === 'today' && selectedMonthFilter === 'all'
              ? 'border-orange-500 bg-orange-50/90 ring-2 ring-orange-400'
              : 'border-slate-200/90 bg-white hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
              Aniversariantes Hoje
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white shadow-xs">
              <Cake className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {birthdaysToday.length}
            </span>
            <span className="text-xs text-orange-700 font-medium">
              {birthdaysToday.length === 1 ? 'cliente comemorando' : 'clientes comemorando'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {birthdaysToday.length > 0
              ? '🎉 Envie os parabéns agora e fidelize seu cliente!'
              : 'Nenhum aniversariante registrado para hoje.'}
          </p>
        </div>

        {/* Card 2: Próximos 7 Dias */}
        <div
          onClick={() => {
            setActiveFilterTab('week');
            setSelectedMonthFilter('all');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xs ${
            activeFilterTab === 'week' && selectedMonthFilter === 'all'
              ? 'border-amber-500 bg-amber-50/90 ring-2 ring-amber-400'
              : 'border-slate-200/90 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Próximos 7 Dias (Alerta)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {birthdaysWeek.length}
            </span>
            <span className="text-xs text-amber-800 font-medium">
              esta semana
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Alertas preventivos para preparar vouchers e contatos antecipados.
          </p>
        </div>

        {/* Card 3: Neste Mês */}
        <div
          onClick={() => {
            setActiveFilterTab('month');
            setSelectedMonthFilter('all');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xs ${
            activeFilterTab === 'month' && selectedMonthFilter === 'all'
              ? 'border-blue-500 bg-blue-50/90 ring-2 ring-blue-400'
              : 'border-slate-200/90 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Neste Mês ({MONTH_NAMES_BR[currentMonthNumber - 1]})
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {birthdaysMonth.length}
            </span>
            <span className="text-xs text-blue-800 font-medium">
              neste mês
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Campanhas mensais para viajantes que celebram nova idade.
          </p>
        </div>

        {/* Card 4: Total Cadastrado */}
        <div
          onClick={() => {
            setActiveFilterTab('all');
            setSelectedMonthFilter('all');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 transition-all shadow-xs ${
            activeFilterTab === 'all' && selectedMonthFilter === 'all'
              ? 'border-purple-500 bg-purple-50/90 ring-2 ring-purple-400'
              : 'border-slate-200/90 bg-white hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">
              Total de Clientes
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {totalWithBirthDate}
            </span>
            <span className="text-xs text-purple-800 font-medium">
              com data salva
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Salvo automaticamente no cadastro público ou pelo operador.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PROMINENT ALERTS BANNER FOR TODAY & UPCOMING */}
      {/* ======================================================== */}
      {birthdaysToday.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-5 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                <PartyPopper className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Notificação do Próprio Dia</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-1">
                  Hoje é dia de festa! {birthdaysToday.length} {birthdaysToday.length === 1 ? 'cliente comemora' : 'clientes comemoram'} aniversário hoje!
                </h3>
                <p className="text-xs sm:text-sm text-orange-100 max-w-2xl mt-0.5">
                  {birthdaysToday.map(t => `${t.fullName} (${t.birthdayInfo.turningAge} anos)`).join(', ')}.
                  Envie felicitações com cupom de desconto pelo WhatsApp e incentive uma viagem comemorativa!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDirectWhatsApp(birthdaysToday[0])}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-orange-700 hover:bg-orange-50 shadow-md transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Parabenizar {birthdaysToday[0].fullName.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {birthdaysWeek.length > 0 && (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 text-amber-950 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                Alerta de Proximidade: {birthdaysWeek.length} {birthdaysWeek.length === 1 ? 'aniversariante nesta semana' : 'aniversariantes nesta semana'}
              </h4>
              <p className="text-xs text-amber-800">
                {birthdaysWeek.map(t => `${t.fullName.split(' ')[0]} (${t.birthdayInfo.statusText})`).join(' • ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveFilterTab('week');
              setSelectedMonthFilter('all');
            }}
            className="rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Ver Próximos
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FILTERS, SEARCH & CONTROLS */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, WhatsApp ou cidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        {/* Tab buttons & Month selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-700">
            <button
              onClick={() => {
                setActiveFilterTab('today');
                setSelectedMonthFilter('all');
              }}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeFilterTab === 'today' && selectedMonthFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Hoje ({birthdaysToday.length})
            </button>
            <button
              onClick={() => {
                setActiveFilterTab('week');
                setSelectedMonthFilter('all');
              }}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeFilterTab === 'week' && selectedMonthFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Próximos 7 Dias ({birthdaysWeek.length})
            </button>
            <button
              onClick={() => {
                setActiveFilterTab('month');
                setSelectedMonthFilter('all');
              }}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeFilterTab === 'month' && selectedMonthFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Este Mês ({birthdaysMonth.length})
            </button>
            <button
              onClick={() => {
                setActiveFilterTab('all');
                setSelectedMonthFilter('all');
              }}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeFilterTab === 'all' && selectedMonthFilter === 'all'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Todos ({totalWithBirthDate})
            </button>
          </div>

          {/* Month Dropdown Selector */}
          <select
            value={selectedMonthFilter}
            onChange={e => {
              const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
              setSelectedMonthFilter(val);
              if (val !== 'all') {
                setActiveFilterTab('all');
              }
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Filtrar por Mês (Todos)</option>
            {MONTH_NAMES_BR.map((monthName, idx) => (
              <option key={monthName} value={idx + 1}>
                {monthName} {idx + 1 === currentMonthNumber ? '(Mês Atual)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BIRTHDAYS LIST */}
      {/* ======================================================== */}
      {filteredTravelers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Cake className="h-7 w-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Nenhum aniversariante encontrado
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Não há viajantes correspondentes aos filtros selecionados. Novos aniversários são salvos automaticamente no momento em que qualquer cliente se cadastra na viagem.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveFilterTab('all');
              setSelectedMonthFilter('all');
              setSearchTerm('');
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Limpar Filtros e Ver Todos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTravelers.map(t => {
            const info = t.birthdayInfo;
            const travelerTrips = registrations.filter(r => r.travelerId === t.id);

            return (
              <div
                key={t.id}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all shadow-xs hover:shadow-md ${
                  info.isToday
                    ? 'border-2 border-orange-500 ring-2 ring-orange-200'
                    : info.isUpcomingWeek
                    ? 'border-amber-400 bg-amber-50/20'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Highlight banner if today */}
                {info.isToday && (
                  <div className="absolute -top-3 right-4 rounded-full bg-orange-600 px-3 py-0.5 text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Aniversário Hoje!</span>
                  </div>
                )}

                <div>
                  {/* Top card row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-xs ${
                          info.isToday
                            ? 'bg-orange-600 text-white animate-pulse'
                            : info.isUpcomingWeek
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {info.isToday ? '🎂' : t.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate leading-tight group-hover:text-orange-600 transition-colors">
                          {t.fullName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>CPF: {maskCPF(t.cpf)}</span>
                          {t.city && <span>• {t.city}/{t.state}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Birthday info block */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Cake className="h-3.5 w-3.5 text-orange-600" />
                        <span>Data de Nascimento:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {info.formattedDayMonth}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Idade:</span>
                      <span className="font-semibold text-slate-700">
                        {info.isToday
                          ? `Completou ${info.turningAge} anos hoje! 🎉`
                          : info.isUpcomingWeek
                          ? `Vai completar ${info.turningAge} anos`
                          : `${info.turningAge} anos`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium">Status do Alerta:</span>
                      <span
                        className={`font-bold inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${
                          info.isToday
                            ? 'bg-orange-100 text-orange-800 font-black'
                            : info.isUpcomingWeek
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {info.statusText}
                      </span>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{formatPhoneBR(t.phone) || t.phone}</span>
                    </div>
                    {t.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{travelerTrips.length} {travelerTrips.length === 1 ? 'viagem registrada' : 'viagens registradas'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleDirectWhatsApp(t)}
                    title="Enviar felicitações no WhatsApp agora"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleOpenCustomizeModal(t)}
                    title="Personalizar mensagem com cupom ou modelo"
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-orange-600 transition-colors"
                  >
                    <Gift className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingBirthDateTraveler(t);
                      setNewBirthDateInput(t.birthDate || '');
                    }}
                    title="Ajustar ou cadastrar data de nascimento"
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: CUSTOMIZE & PREVIEW WHATSAPP GREETING */}
      {/* ======================================================== */}
      {messageModalTraveler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Cake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Enviar Felicitações de Aniversário
                  </h3>
                  <p className="text-xs text-slate-500">
                    Para: {messageModalTraveler.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalTraveler(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Modelo da Mensagem
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageTemplate('cupom')}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                    messageTemplate === 'cupom'
                      ? 'border-orange-500 bg-orange-50/80 font-bold text-orange-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🎁 Com Cupom 10% OFF
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('vip')}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                    messageTemplate === 'vip'
                      ? 'border-orange-500 bg-orange-50/80 font-bold text-orange-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌟 Especial VIP
                </button>
                <button
                  type="button"
                  onClick={() => setMessageTemplate('afetuosa')}
                  className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                    messageTemplate === 'afetuosa'
                      ? 'border-orange-500 bg-orange-50/80 font-bold text-orange-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ❤️ Carinhosa Padrão
                </button>
              </div>
            </div>

            {/* Cupom Code input if template is cupom */}
            {messageTemplate === 'cupom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código do Cupom de Desconto
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Message preview bubble */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Prévia da Mensagem (WhatsApp)
              </label>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {buildBirthdayWhatsAppMessage(messageModalTraveler, 'Raon System', messageTemplate, couponCode)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyGreeting(
                    buildBirthdayWhatsAppMessage(messageModalTraveler, 'Raon System', messageTemplate, couponCode)
                  )
                }
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copiedMessage ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedMessage ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = buildBirthdayWhatsAppMessage(messageModalTraveler, 'Raon System', messageTemplate, couponCode);
                  const cleanPhone = messageModalTraveler.phone.replace(/\D/g, '');
                  const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                  window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, '_blank');
                  setMessageModalTraveler(null);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 shadow-md"
              >
                <Send className="h-4 w-4" />
                <span>Abrir e Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: EDIT BIRTH DATE */}
      {/* ======================================================== */}
      {editingBirthDateTraveler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Ajustar Data de Nascimento
            </h4>
            <p className="text-xs text-slate-500">
              Viajante: <strong className="text-slate-800">{editingBirthDateTraveler.fullName}</strong>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={newBirthDateInput}
                onChange={e => setNewBirthDateInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBirthDateTraveler(null)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBirthDate}
                className="rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
              >
                Salvar Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
