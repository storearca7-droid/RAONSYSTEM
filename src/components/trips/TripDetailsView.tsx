import React, { useState } from 'react';
import {
  Compass,
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Receipt,
  FileText,
  Share2,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Handshake,
  DollarSign,
  AlertCircle,
  Bus,
  MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SendTripLinkModal } from './SendTripLinkModal';
import {
  Trip,
  TripRegistration,
  RegistrationPayment,
  Expense,
  RegistrationStatus,
  FinancialStatus,
  PaymentMethod,
  ExpenseCategory,
  ItineraryDay,
  TripActivity,
} from '../../types';
import {
  formatBRL,
  formatDateBR,
  formatDateRangeBR,
  formatPhoneBR,
  maskCPF,
  calculateTripOccupancy,
  calculateTripFinances,
  buildWhatsAppLink,
  generateId,
} from '../../lib/utils';
import { TripBoardingTab } from './tabs/TripBoardingTab';
import { TripChecklistTab } from './tabs/TripChecklistTab';
import { TripNoticesTab } from './tabs/TripNoticesTab';
import { TripGroupsTab } from './tabs/TripGroupsTab';

interface TripDetailsViewProps {
  tripId: string;
  onBack: () => void;
  onEditTrip: (trip: Trip) => void;
}

type DetailsTab =
  | 'overview'
  | 'boarding'
  | 'checklist'
  | 'notices'
  | 'groups'
  | 'travelers'
  | 'itinerary'
  | 'financial'
  | 'expenses'
  | 'partners'
  | 'inclusions';

export const TripDetailsView: React.FC<TripDetailsViewProps> = ({
  tripId,
  onBack,
  onEditTrip,
}) => {
  const {
    trips,
    travelers,
    registrations,
    payments,
    expenses,
    partners,
    updateTrip,
    registerTravelerToTrip,
    updateRegistrationStatus,
    deleteRegistration,
    recordPayment,
    refundPayment,
    createExpense,
    deleteExpense,
    setPublicTripSlug,
    setPublicCheckinSlug,
  } = useApp();

  const trip = trips.find(t => t.id === tripId);
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [isSendLinkModalOpen, setIsSendLinkModalOpen] = useState(false);

  // Modals inside details
  const [isAddTravelerOpen, setIsAddTravelerOpen] = useState(false);
  const [paymentModalReg, setPaymentModalReg] = useState<TripRegistration | null>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

  // Inclusions/Exclusions editor state
  const [newInclusionText, setNewInclusionText] = useState('');
  const [newExclusionText, setNewExclusionText] = useState('');

  // Itinerary addition state
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [newDayDate, setNewDayDate] = useState('');
  const [activeDayIdForActivity, setActiveDayIdForActivity] = useState<string | null>(null);
  const [newActivityTime, setNewActivityTime] = useState('08:00');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newActivityLocation, setNewActivityLocation] = useState('');

  if (!trip) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Viagem não encontrada.</p>
        <button onClick={onBack} className="mt-4 text-orange-600 font-semibold text-sm">
          ← Voltar para lista de viagens
        </button>
      </div>
    );
  }

  // Derived Trip Calculations
  const occ = calculateTripOccupancy(trip, registrations);
  const fin = calculateTripFinances(trip, registrations, payments, expenses);
  const tripRegistrations = registrations.filter(r => r.tripId === trip.id);
  const tripExpenses = expenses.filter(e => e.tripId === trip.id);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${trip.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${trip.slug}`;
    const msg = `Olá! Confira nossa viagem para *${trip.name}* com a Raon System!\nDatas: ${formatDateRangeBR(
      trip.departureDate,
      trip.returnDate
    )}\nValor: ${formatBRL(trip.pricePerPerson)}\nGaranta sua vaga no link:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${trip.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2000);
  };

  const handleSharePortalWhatsApp = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${trip.slug}`;
    const msg = `Olá viajante da Raon System! Acesse seu Portal Exclusivo da viagem para *${trip.name}* entrando com seu CPF: consulte horários de saída, voo/ônibus, roteiro dia a dia, se falta pagar e confirme sua presença no embarque:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleExportTravelersCSV = () => {
    const headers = [
      'Nome Completo',
      'CPF',
      'RG',
      'WhatsApp',
      'Status Inscrição',
      'Status Financeiro',
      'Valor Contratado',
      'Valor Pago',
      'Saldo',
      'Forma de Pagamento',
    ];

    const rows = tripRegistrations.map(r => {
      const traveler = travelers.find(t => t.id === r.travelerId);
      const paid = payments
        .filter(p => p.registrationId === r.id && !p.refunded)
        .reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, r.effectiveDue - paid);

      return [
        `"${traveler?.fullName || ''}"`,
        `"${traveler?.cpf || ''}"`,
        `"${traveler?.rg || ''}"`,
        `"${traveler?.phone || ''}"`,
        `"${r.status}"`,
        `"${r.financialStatus}"`,
        r.effectiveDue.toFixed(2),
        paid.toFixed(2),
        balance.toFixed(2),
        `"${r.paymentMethod || ''}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_viajantes_${trip.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick Inclusions Management
  const handleAddInclusion = (item: string) => {
    if (!item.trim()) return;
    const current = trip.inclusions || [];
    if (!current.includes(item.trim())) {
      updateTrip(trip.id, { inclusions: [...current, item.trim()] });
    }
    setNewInclusionText('');
  };

  const handleRemoveInclusion = (index: number) => {
    const updated = (trip.inclusions || []).filter((_, i) => i !== index);
    updateTrip(trip.id, { inclusions: updated });
  };

  const handleAddExclusion = (item: string) => {
    if (!item.trim()) return;
    const current = trip.exclusions || [];
    if (!current.includes(item.trim())) {
      updateTrip(trip.id, { exclusions: [...current, item.trim()] });
    }
    setNewExclusionText('');
  };

  const handleRemoveExclusion = (index: number) => {
    const updated = (trip.exclusions || []).filter((_, i) => i !== index);
    updateTrip(trip.id, { exclusions: updated });
  };

  // Itinerary Management
  const handleAddItineraryDay = () => {
    if (!newDayTitle.trim()) return;
    const days = trip.itinerary || [];
    const newDay: ItineraryDay = {
      id: generateId(),
      dayNumber: days.length + 1,
      date: newDayDate || undefined,
      title: newDayTitle.trim(),
      activities: [],
    };
    updateTrip(trip.id, { itinerary: [...days, newDay] });
    setNewDayTitle('');
    setNewDayDate('');
    setIsAddingDay(false);
  };

  const handleAddActivity = (dayId: string) => {
    if (!newActivityTitle.trim()) return;
    const days = (trip.itinerary || []).map(day => {
      if (day.id === dayId) {
        const newAct: TripActivity = {
          id: generateId(),
          time: newActivityTime,
          title: newActivityTitle.trim(),
          description: newActivityDesc.trim(),
          location: newActivityLocation.trim() || undefined,
          order: (day.activities || []).length + 1,
        };
        return {
          ...day,
          activities: [...(day.activities || []), newAct],
        };
      }
      return day;
    });
    updateTrip(trip.id, { itinerary: days });
    setNewActivityTitle('');
    setNewActivityDesc('');
    setNewActivityLocation('');
    setActiveDayIdForActivity(null);
  };

  const handleDeleteActivity = (dayId: string, actId: string) => {
    const days = (trip.itinerary || []).map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          activities: day.activities.filter(a => a.id !== actId),
        };
      }
      return day;
    });
    updateTrip(trip.id, { itinerary: days });
  };

  const handleDeleteDay = (dayId: string) => {
    const days = (trip.itinerary || [])
      .filter(d => d.id !== dayId)
      .map((d, index) => ({ ...d, dayNumber: index + 1 }));
    updateTrip(trip.id, { itinerary: days });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para todas as viagens</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Acesso & Links do Portal do Viajante (com login CPF) */}
          {/* Enviar Link da Viagem (Adesão, WhatsApp, QR Code) */}
          <button
            onClick={() => setIsSendLinkModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:from-orange-500 hover:to-amber-500 shadow-sm transition-transform active:scale-95"
            title="Enviar link da viagem com WhatsApp, QR Code, opções de pagamento e adesão"
          >
            <Share2 className="h-4 w-4" />
            <span>Enviar Link da Viagem</span>
          </button>

          <button
            onClick={() => setPublicCheckinSlug(trip.slug)}
            className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100 transition-colors"
            title="Abrir o Portal do Viajante como os passageiros veem"
          >
            <Bus className="h-4 w-4 text-orange-600" />
            <span>Portal do Viajante (CPF)</span>
          </button>

          <button
            onClick={handleCopyPortalLink}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Copiar link direto para os passageiros acessarem com CPF"
          >
            {copiedPortalLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
            <span>{copiedPortalLink ? 'Copiado!' : 'Copiar Link Portal'}</span>
          </button>

          <button
            onClick={() => setPublicTripSlug(trip.slug)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Página de divulgação e novas inscrições"
          >
            <ExternalLink className="h-4 w-4 text-slate-500" />
            <span>Página de Vendas</span>
          </button>

          <button
            onClick={() => onEditTrip(trip)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span>Editar Viagem</span>
          </button>
        </div>
      </div>

      {/* Hero Card Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-md">
        <div className="relative h-48 md:h-64 w-full">
          {trip.imageUrl ? (
            <img
              src={trip.imageUrl}
              alt={trip.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-500">
              <Compass className="h-16 w-16 text-orange-500/40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Details on Image */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-orange-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                  {trip.category}
                </span>
                <span className="text-xs text-orange-200">
                  {trip.destination}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {trip.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                <span aria-hidden="true">·</span>
                <span>Embarque: {trip.departureLocation}</span>
                <span aria-hidden="true">·</span>
                <span>Responsável: {trip.responsible}</span>
              </div>
            </div>

            {/* Quick Price & Status badge */}
            <div className="text-right shrink-0">
              <div className="text-xs text-slate-300">Valor por viajante</div>
              <div className="text-2xl font-black text-white tabular-nums">
                {formatBRL(trip.pricePerPerson)}
              </div>
              {occ.isFull && (
                <span className="mt-1 inline-block rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  VIAGEM LOTADA
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Visão Geral', count: null },
            {
              id: 'boarding',
              label: 'Embarque & Presença',
              count: `${tripRegistrations.filter(r => r.boardingStatus === 'embarcou').length}/${tripRegistrations.length}`,
            },
            {
              id: 'checklist',
              label: 'Checklist Pré-Viagem',
              count: `${(trip.checklist || []).filter(i => i.isCompleted).length}/${(trip.checklist || []).length}`,
            },
            { id: 'notices', label: 'Avisos da Viagem', count: trip.notices?.length || 0 },
            { id: 'groups', label: 'Grupos & Quartos', count: trip.groups?.length || 0 },
            { id: 'travelers', label: 'Viajantes', count: tripRegistrations.length },
            { id: 'itinerary', label: 'Roteiro Dia a Dia', count: trip.itinerary?.length || 0 },
            { id: 'financial', label: 'Financeiro', count: null },
            { id: 'expenses', label: 'Despesas', count: tripExpenses.length },
            { id: 'partners', label: 'Parceiros', count: null },
            { id: 'inclusions', label: 'Inclusos & Não Inclusos', count: null },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DetailsTab)}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 sm:px-3 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Capacity Progress Bar with 100% Full alert */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Controle de Lotação & Vagas
                </h3>
                <p className="text-xs text-slate-500">
                  {occ.occupiedSlots} de {occ.totalCapacity} vagas bloqueadas (
                  {occ.confirmed} confirmadas, {occ.pending} provisórias aguardando aprovação)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {occ.occupancyPercent}%
                </span>
                {occ.isFull ? (
                  <span className="rounded-md bg-rose-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider animate-pulse">
                    VIAGEM LOTADA
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
                    {occ.availableSlots} vagas restantes
                  </span>
                )}
              </div>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occ.isFull ? 'bg-rose-600' : occ.occupancyPercent > 80 ? 'bg-amber-500' : 'bg-orange-600'
                }`}
                style={{ width: `${occ.occupancyPercent}%` }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>Confirmadas: {occ.confirmed}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>Pendentes: {occ.pending}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span>Lista de Espera: {occ.waitlist}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddTravelerOpen(true)}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors"
                >
                  + Adicionar Viajante
                </button>
                <button
                  onClick={handleExportTravelersCSV}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Exportar Lista (CSV)
                </button>
              </div>
            </div>
          </div>

          {/* Link de Adesão e Inscrição para Clientes Banner */}
          <div className="rounded-2xl border border-orange-200 bg-linear-to-r from-orange-50 via-amber-50 to-orange-50 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
                  <Share2 className="h-4 w-4" />
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900">
                  Link de Adesão & Inscrição para Clientes
                </h4>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Envie este link para as pessoas se cadastrarem na viagem! O cliente clica no link, confere fotos e roteiro, e clica em <strong>"Quero Viajar"</strong> para preencher Nome, Sobrenome, CPF, WhatsApp e selecionar pagamento por <strong>Pix</strong>, <strong>Cartão de Crédito</strong>, <strong>Boleto</strong> ou <strong>Negociar com você</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSendLinkModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span>Enviar Link ao Cliente</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white hover:bg-orange-50/50 px-3.5 py-2.5 text-xs font-bold text-orange-800 transition-colors"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-orange-600" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => setPublicTripSlug(trip.slug)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span>Ver Página</span>
              </button>
            </div>
          </div>

          {/* Cards de Métricas da Viagem */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Confirmados
              </span>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{occ.confirmed}</p>
              <span className="text-xs text-slate-500">Vagas garantidas</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pagos / Parciais / Não Pagos
              </span>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                <span className="text-emerald-600">{fin.fullyPaidCount}</span> /{' '}
                <span className="text-amber-600">{fin.partiallyPaidCount}</span> /{' '}
                <span className="text-rose-600">{fin.unpaidCount}</span>
              </p>
              <span className="text-xs text-slate-500">Divisão de quitação</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Valor Recebido
              </span>
              <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {formatBRL(fin.totalReceived)}
              </p>
              <span className="text-xs text-slate-500">De {formatBRL(fin.totalEffectiveDue)} previstos</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Resultado Estimado
              </span>
              <p
                className={`mt-1 text-xl font-bold tabular-nums ${
                  fin.estimatedProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatBRL(fin.estimatedProfit)}
              </p>
              <span className="text-xs text-slate-500">
                (Receita - Despesas R$ {fin.expensesPlanned.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Resumo da Viagem */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Sobre a Viagem</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {trip.description || 'Nenhuma descrição detalhada informada.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Ponto de Embarque:</span>
                <p className="text-slate-600">{trip.departureLocation}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Horário de Saída:</span>
                <p className="text-slate-600">{trip.departureTime}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Hospedagem / Chegada:</span>
                <p className="text-slate-600">{trip.arrivalLocation}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EMBARQUE & PRESENÇA */}
      {activeTab === 'boarding' && <TripBoardingTab trip={trip} />}

      {/* TAB: CHECKLIST PRÉ-VIAGEM */}
      {activeTab === 'checklist' && <TripChecklistTab trip={trip} />}

      {/* TAB: AVISOS DA VIAGEM */}
      {activeTab === 'notices' && <TripNoticesTab trip={trip} />}

      {/* TAB: GRUPOS & QUARTOS */}
      {activeTab === 'groups' && <TripGroupsTab trip={trip} />}

      {/* TAB: VIAJANTES DA VIAGEM */}
      {activeTab === 'travelers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lista de Inscritos na Viagem ({tripRegistrations.length})
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie reservas, aprove novos inscritos e registre pagamentos
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTravelersCSV}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Exportar CSV
              </button>
              <button
                onClick={() => setIsAddTravelerOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                <span>+ Adicionar Viajante</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {tripRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-semibold text-slate-800">
                Nenhum viajante inscrito ainda
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Compartilhe o link público ou cadastre viajantes manualmente.
              </p>
              <button
                onClick={() => setIsAddTravelerOpen(true)}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
              >
                + Adicionar primeiro viajante
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Viajante</th>
                    <th className="py-3 px-3">WhatsApp / Cidade</th>
                    <th className="py-3 px-3">Documento</th>
                    <th className="py-3 px-3">Status Inscrição</th>
                    <th className="py-3 px-3">Financeiro</th>
                    <th className="py-3 px-3 text-right">Contratado</th>
                    <th className="py-3 px-3 text-right">Pago</th>
                    <th className="py-3 px-3 text-right">Saldo</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tripRegistrations.map(reg => {
                    const traveler = travelers.find(t => t.id === reg.travelerId);
                    const regPayments = payments.filter(p => p.registrationId === reg.id && !p.refunded);
                    const paidAmount = regPayments.reduce((acc, p) => acc + p.amount, 0);
                    const balance = Math.max(0, reg.effectiveDue - paidAmount);

                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{traveler?.fullName || 'Desconhecido'}</div>
                          <div className="text-[11px] text-slate-500">
                            CPF: {traveler ? maskCPF(traveler.cpf) : '-'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="text-slate-800 font-medium">
                            {traveler ? formatPhoneBR(traveler.phone) : '-'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {traveler?.city}/{traveler?.state}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {traveler?.documentUrl ? (
                            <button
                              onClick={() => setDocumentPreviewUrl(traveler.documentUrl!)}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Ver anexo</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Pendente</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {reg.status === 'confirmed' ? (
                            <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                              Confirmada
                            </span>
                          ) : reg.status === 'pending' ? (
                            <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                              Aguardando
                            </span>
                          ) : reg.status === 'waitlist' ? (
                            <span className="rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                              Lista de Espera
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase">
                              Cancelada
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {reg.financialStatus === 'paid' ? (
                            <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                              Pago
                            </span>
                          ) : reg.financialStatus === 'partial' ? (
                            <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                              Parcial
                            </span>
                          ) : reg.financialStatus === 'overdue' ? (
                            <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-semibold">
                              Atrasado
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold">
                              Não pago
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                          {formatBRL(reg.effectiveDue)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">
                          {formatBRL(paidAmount)}
                        </td>

                        <td className="py-3.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {formatBRL(balance)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Approve button if pending or waitlist */}
                            {reg.status === 'pending' && (
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, 'confirmed')}
                                title="Aprovar e confirmar vaga"
                                className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                Aprovar
                              </button>
                            )}

                            {reg.status === 'waitlist' && (
                              <button
                                onClick={() => {
                                  const res = updateRegistrationStatus(reg.id, 'confirmed');
                                  if (!res.success) alert(res.message);
                                }}
                                title="Promover da lista de espera para vaga confirmada"
                                className="rounded-lg bg-purple-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-purple-700"
                              >
                                Promover
                              </button>
                            )}

                            {/* Record payment */}
                            <button
                              onClick={() => setPaymentModalReg(reg)}
                              title="Registrar pagamento"
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              + Pagar
                            </button>

                            {/* Remove button */}
                            <button
                              onClick={() => {
                                if (confirm('Remover esta inscrição da viagem?')) {
                                  deleteRegistration(reg.id);
                                }
                              }}
                              title="Excluir inscrição"
                              className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROTEIRO DIA A DIA */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Roteiro Turístico Dia a Dia
              </h3>
              <p className="text-xs text-slate-500">
                Organize a programação detalhada para visualização na página pública dos viajantes
              </p>
            </div>

            <button
              onClick={() => setIsAddingDay(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              <span>+ Adicionar Dia</span>
            </button>
          </div>

          {/* Form to add a new day */}
          {isAddingDay && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900">
                Novo Dia do Roteiro
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Título (ex: Chegada e Check-in nas Piscinas)"
                  value={newDayTitle}
                  onChange={e => setNewDayTitle(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <input
                  type="date"
                  value={newDayDate}
                  onChange={e => setNewDayDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingDay(false)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItineraryDay}
                  className="rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  Salvar Dia
                </button>
              </div>
            </div>
          )}

          {/* Days Accordion / List */}
          {(!trip.itinerary || trip.itinerary.length === 0) ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-semibold text-slate-800">
                Nenhum dia cadastrado no roteiro
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Crie o Dia 1 com horários e atividades para apresentar aos passageiros.
              </p>
              <button
                onClick={() => setIsAddingDay(true)}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
              >
                + Criar Dia 1
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {trip.itinerary.map(day => (
                <div
                  key={day.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-bold text-white text-xs">
                        D{day.dayNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Dia {day.dayNumber}: {day.title}
                        </h4>
                        {day.date && (
                          <p className="text-[11px] text-slate-500">{formatDateBR(day.date)}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveDayIdForActivity(activeDayIdForActivity === day.id ? null : day.id)
                        }
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        + Atividade
                      </button>
                      <button
                        onClick={() => handleDeleteDay(day.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Excluir dia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add activity form for this day */}
                  {activeDayIdForActivity === day.id && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="time"
                          value={newActivityTime}
                          onChange={e => setNewActivityTime(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Título da atividade *"
                          value={newActivityTitle}
                          onChange={e => setNewActivityTitle(e.target.value)}
                          className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-hidden"
                        />
                        <input
                          type="text"
                          placeholder="Local (opcional)"
                          value={newActivityLocation}
                          onChange={e => setNewActivityLocation(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-hidden"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Descrição / Instruções aos viajantes"
                        value={newActivityDesc}
                        onChange={e => setNewActivityDesc(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setActiveDayIdForActivity(null)}
                          className="px-2 py-1 text-xs text-slate-600"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleAddActivity(day.id)}
                          className="rounded-lg bg-orange-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Activities List */}
                  {(!day.activities || day.activities.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">
                      Nenhuma atividade cadastrada para este dia.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {day.activities.map(act => (
                        <div
                          key={act.id}
                          className="flex items-start justify-between rounded-xl bg-slate-50/70 p-3 text-xs"
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-mono font-bold text-orange-600 bg-orange-100/60 rounded px-2 py-0.5 tabular-nums">
                              {act.time}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{act.title}</div>
                              {act.description && (
                                <p className="text-slate-600 mt-0.5">{act.description}</p>
                              )}
                              {act.location && (
                                <p className="text-slate-400 text-[11px] mt-0.5">
                                  📍 {act.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteActivity(day.id, act.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FINANCEIRO DA VIAGEM */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Financial Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Receita Prevista</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {formatBRL(fin.totalEffectiveDue)}
              </p>
              <span className="text-xs text-slate-500">{fin.totalTravelers} inscrições ativas</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Receita Recebida</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
                {formatBRL(fin.totalReceived)}
              </p>
              <span className="text-xs text-slate-500">{fin.paymentProgressPercent}% do total</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Saldo a Receber</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
                {formatBRL(fin.totalPending)}
              </p>
              <span className="text-xs text-slate-500">Pendente de pagamento</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Lucro Realizado</span>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${
                  fin.realizedProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
                }`}
              >
                {formatBRL(fin.realizedProfit)}
              </p>
              <span className="text-xs text-slate-500">(Recebido - Despesas Pagas)</span>
            </div>
          </div>

          {/* Payments History Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              Histórico de Pagamentos Recebidos
            </h4>

            {payments.filter(p => p.tripId === trip.id).length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum pagamento registrado ainda para esta viagem.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Viajante</th>
                      <th className="py-2.5 px-3">Forma</th>
                      <th className="py-2.5 px-3 text-right">Valor</th>
                      <th className="py-2.5 px-3">Comprovante</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Estorno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments
                      .filter(p => p.tripId === trip.id)
                      .map(pay => {
                        const traveler = travelers.find(t => t.id === pay.travelerId);

                        return (
                          <tr key={pay.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono">{formatDateBR(pay.paymentDate)}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {traveler?.fullName || '-'}
                            </td>
                            <td className="py-2.5 px-3">{pay.paymentMethod}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                              {formatBRL(pay.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {pay.receiptName || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              {pay.refunded ? (
                                <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
                                  Estornado
                                </span>
                              ) : (
                                <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                  Confirmado
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {!pay.refunded && (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Informe o motivo do estorno:');
                                    if (reason) refundPayment(pay.id, reason);
                                  }}
                                  className="text-xs text-rose-600 hover:underline"
                                >
                                  Estornar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DESPESAS DA VIAGEM */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Despesas da Viagem ({tripExpenses.length})
              </h3>
              <p className="text-xs text-slate-500">
                Transporte, hospedagem, passeios, seguros e guias
              </p>
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              <span>+ Nova Despesa</span>
            </button>
          </div>

          {tripExpenses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-slate-300" />
              <h4 className="mt-3 text-base font-semibold text-slate-800">
                Nenhuma despesa lançada nesta viagem
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Registre os custos de transporte, hotel e passeios para apurar o lucro exato.
              </p>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="mt-4 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
              >
                + Lançar primeira despesa
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Parceiro</th>
                    <th className="py-3 px-3">Data / Vencimento</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Valor (R$)</th>
                    <th className="py-3 px-4 text-center">Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tripExpenses.map(exp => {
                    const partner = partners.find(p => p.id === exp.partnerId);

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {exp.description}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {partner?.name || '-'}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {formatDateBR(exp.date)}
                        </td>
                        <td className="py-3.5 px-3">
                          {exp.isPaid ? (
                            <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                              Pago
                            </span>
                          ) : (
                            <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                              Previsto
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {formatBRL(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Excluir esta despesa?')) deleteExpense(exp.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PARCEIROS CONTRATADOS */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Parceiros Vinculados à Viagem
              </h3>
              <p className="text-xs text-slate-500">
                Fornecedores e prestadores associados a esta operação
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map(p => {
              const partnerExpenses = tripExpenses.filter(e => e.partnerId === p.id);
              const totalAgreed = partnerExpenses.reduce((sum, e) => sum + e.amount, 0);

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{p.name}</h4>
                      <p className="text-xs text-slate-500">
                        Responsável: {p.responsibleName} ({p.phone})
                      </p>
                    </div>

                    <a
                      href={buildWhatsAppLink(
                        p.whatsapp || p.phone,
                        `Olá ${p.responsibleName}, sobre a viagem para ${trip.name}:`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 flex items-center gap-1.5"
                    >
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total em Despesas Contratadas:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatBRL(totalAgreed)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: INCLUSOS E NÃO INCLUSOS */}
      {activeTab === 'inclusions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* O que está incluso */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="font-bold text-base text-slate-900">O que está incluso</h3>
              </div>
              <p className="text-xs text-slate-500">
                Itens e serviços garantidos no pacote do viajante
              </p>

              {/* Add item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicionar item incluso..."
                  value={newInclusionText}
                  onChange={e => setNewInclusionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddInclusion(newInclusionText);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <button
                  onClick={() => handleAddInclusion(newInclusionText)}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Adicionar
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold w-full">Sugestões rápidas:</span>
                {[
                  'Transporte Leito Turismo',
                  'Hospedagem com Café',
                  'Guia Cadastur',
                  'Seguro Viagem Nacional',
                  'Passeio de Barco',
                  'Kit Lanche de Bordo',
                ].map(sug => (
                  <button
                    key={sug}
                    onClick={() => handleAddInclusion(sug)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* List */}
              <ul className="space-y-2 pt-2">
                {(trip.inclusions || []).map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveInclusion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* O que não está incluso */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-bold text-base text-slate-900">O que não está incluso</h3>
              </div>
              <p className="text-xs text-slate-500">
                Despesas pessoais e passeios extras opcionais
              </p>

              {/* Add item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicionar item não incluso..."
                  value={newExclusionText}
                  onChange={e => setNewExclusionText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddExclusion(newExclusionText);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <button
                  onClick={() => handleAddExclusion(newExclusionText)}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Adicionar
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold w-full">Sugestões rápidas:</span>
                {[
                  'Almoço e jantares livres',
                  'Bebidas alcoólicas e frigobar',
                  'Despesas pessoais',
                  'Ingressos opcionais',
                  'Mergulho com cilindro',
                ].map(sug => (
                  <button
                    key={sug}
                    onClick={() => handleAddExclusion(sug)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* List */}
              <ul className="space-y-2 pt-2">
                {(trip.exclusions || []).map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{item}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveExclusion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADICIONAR VIAJANTE À VIAGEM */}
      {isAddTravelerOpen && (
        <AddTravelerModal
          trip={trip}
          isOpen={isAddTravelerOpen}
          onClose={() => setIsAddTravelerOpen(false)}
          onAddTraveler={(travelerData, options) => {
            const res = registerTravelerToTrip(trip.id, travelerData, options);
            if (!res.success) {
              alert(res.message);
            } else {
              setIsAddTravelerOpen(false);
            }
          }}
        />
      )}

      {/* MODAL 2: REGISTRAR PAGAMENTO */}
      {paymentModalReg && (
        <RecordPaymentModal
          trip={trip}
          registration={paymentModalReg}
          traveler={travelers.find(t => t.id === paymentModalReg.travelerId)!}
          isOpen={!!paymentModalReg}
          onClose={() => setPaymentModalReg(null)}
          onRecordPayment={payData => {
            recordPayment({
              registrationId: paymentModalReg.id,
              amount: payData.amount,
              paymentDate: payData.paymentDate,
              paymentMethod: payData.paymentMethod,
              notes: payData.notes,
              receiptName: payData.receiptName,
            });
            setPaymentModalReg(null);
          }}
        />
      )}

      {/* MODAL 3: ADICIONAR DESPESA */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          trip={trip}
          partners={partners}
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onAddExpense={expData => {
            createExpense({
              ...expData,
              tripId: trip.id,
            });
            setIsAddExpenseOpen(false);
          }}
        />
      )}

      {/* MODAL 4: PREVIEW DE DOCUMENTO */}
      {documentPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full rounded-2xl bg-white p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-slate-900">Documento Anexado do Viajante</h4>
              <button
                onClick={() => setDocumentPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
              <img
                src={documentPreviewUrl}
                alt="Documento do Viajante"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Enviar Link da Viagem ao Cliente */}
      <SendTripLinkModal
        trip={trip}
        isOpen={isSendLinkModalOpen}
        onClose={() => setIsSendLinkModalOpen(false)}
        onOpenPublicView={slug => setPublicTripSlug(slug)}
      />
    </div>
  );
};

// SUBCOMPONENT: MODAL ADICIONAR VIAJANTE
interface AddTravelerModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onAddTraveler: (travelerData: any, options: any) => void;
}

const AddTravelerModal: React.FC<AddTravelerModalProps> = ({
  trip,
  isOpen,
  onClose,
  onAddTraveler,
}) => {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Maceió');
  const [state, setState] = useState('AL');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [contractedAmount, setContractedAmount] = useState(trip.pricePerPerson);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !cpf.trim() || !phone.trim()) {
      alert('Nome, CPF e WhatsApp são obrigatórios.');
      return;
    }

    onAddTraveler(
      {
        fullName,
        cpf,
        rg,
        birthDate,
        phone,
        email,
        city,
        state,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      },
      {
        contractedAmount: Number(contractedAmount),
        discount: Number(discount),
        paymentMethod,
        initialPayment:
          initialPaymentAmount > 0
            ? {
                amount: Number(initialPaymentAmount),
                paymentMethod,
                notes: 'Entrada inicial no ato da inscrição',
              }
            : undefined,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Adicionar Viajante à Viagem
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Preencha os dados pessoais e as condições acordadas para {trip.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">RG</label>
              <input
                type="text"
                value={rg}
                onChange={e => setRg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp *</label>
              <input
                type="text"
                required
                placeholder="(82) 90000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:outline-hidden"
                />
                <input
                  type="text"
                  value={state}
                  maxLength={2}
                  onChange={e => setState(e.target.value.toUpperCase())}
                  className="w-12 rounded-xl border border-slate-200 p-2 text-xs text-center focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Condições Financeiras
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Valor Contratado (R$)
                </label>
                <input
                  type="number"
                  value={contractedAmount}
                  onChange={e => setContractedAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white"
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência Bancária">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Entrada Paga Agora (R$)
                </label>
                <input
                  type="number"
                  value={initialPaymentAmount}
                  onChange={e => setInitialPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Salvar Inscrição
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// SUBCOMPONENT: MODAL REGISTRAR PAGAMENTO
interface RecordPaymentModalProps {
  trip: Trip;
  registration: TripRegistration;
  traveler: any;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (data: any) => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  registration,
  traveler,
  isOpen,
  onClose,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState(registration.effectiveDue);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [receiptName, setReceiptName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    onRecordPayment({
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      receiptName,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Registrar Pagamento
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Viajante: <span className="font-semibold text-slate-800">{traveler?.fullName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor Pago (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold tabular-nums focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Forma de Pagamento *
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-hidden"
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Transferência Bancária">Transferência Bancária</option>
              <option value="Boleto">Boleto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data do Pagamento *
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comprovante / Referência (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: comprovante_pix_123.pdf ou Aut. Cartão"
              value={receiptName}
              onChange={e => setReceiptName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações
            </label>
            <input
              type="text"
              placeholder="Ex: Pago via chave Pix da agência"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// SUBCOMPONENT: MODAL ADICIONAR DESPESA
interface AddExpenseModalProps {
  trip: Trip;
  partners: any[];
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (data: any) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  partners,
  isOpen,
  onClose,
  onAddExpense,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Transporte');
  const [partnerId, setPartnerId] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert('Descrição e valor são obrigatórios.');
      return;
    }
    onAddExpense({
      description,
      category,
      partnerId: partnerId || undefined,
      amount: Number(amount),
      date,
      isPaid,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Lançar Despesa da Viagem
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Registre gastos com transporte, hotel, guias e fornecedores
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Despesa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fretamento de Ônibus Leito DD"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-hidden"
              >
                <option value="Transporte">Transporte</option>
                <option value="Hospedagem">Hospedagem</option>
                <option value="Passeios">Passeios</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Guias">Guias</option>
                <option value="Seguro">Seguro</option>
                <option value="Marketing">Marketing</option>
                <option value="Taxas">Taxas</option>
                <option value="Outras">Outras</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold tabular-nums focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Parceiro / Fornecedor (Opcional)
            </label>
            <select
              value={partnerId}
              onChange={e => setPartnerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:outline-hidden"
            >
              <option value="">Nenhum parceiro vinculado</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={isPaid ? 'true' : 'false'}
                onChange={e => setIsPaid(e.target.value === 'true')}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-hidden"
              >
                <option value="true">Pago</option>
                <option value="false">Previsto (A pagar)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Lançar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
