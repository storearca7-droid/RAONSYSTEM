import React, { useState, useEffect } from 'react';
import {
  Compass,
  Bus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Users,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Check,
  Share2,
  CreditCard,
  QrCode,
  Copy,
  Plane,
  Bed,
  FileText,
  Luggage,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  UserCheck,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatDateRangeBR,
  formatDateBR,
  formatDateLongBR,
  calculateDaysBetween,
  getDaysUntil,
  formatCPF,
  formatPhoneBR,
  buildWhatsAppLink,
} from '../../lib/utils';
import { Trip, Traveler, TripRegistration, BoardingStatus } from '../../types';

interface PassengerCheckinPageProps {
  slug: string;
  onBackToTrip?: () => void;
  onBackToAdmin?: () => void;
}

type PortalTab = 'presence' | 'financial' | 'schedule' | 'itinerary' | 'notices' | 'groups' | 'packing';

export const PassengerCheckinPage: React.FC<PassengerCheckinPageProps> = ({
  slug,
  onBackToTrip,
  onBackToAdmin,
}) => {
  const { trips, travelers, registrations, payments, selfPassengerCheckin, settings } = useApp();

  const trip = trips.find(t => t.slug === slug) || trips[0];
  const [cpfInput, setCpfInput] = useState('');
  const [searchedTraveler, setSearchedTraveler] = useState<Traveler | null>(null);
  const [searchedReg, setSearchedReg] = useState<TripRegistration | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>('presence');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active on-demand boarding session (if tour guide opened one for this moment)
  const activeSession = trip?.boardingSessions?.find(s => s.isActive);

  // Auto-restore saved CPF from localStorage so passengers don't have to retype 11 digits every time on the trip
  useEffect(() => {
    if (!trip) return;
    const saved = localStorage.getItem('dinho_tour_passenger_cpf');
    if (saved && saved.length === 11) {
      const foundT = travelers.find(t => t.cpf.replace(/\D/g, '') === saved);
      if (foundT) {
        const foundR = registrations.find(
          r => r.tripId === trip.id && r.travelerId === foundT.id && r.status !== 'cancelled'
        );
        if (foundR) {
          setCpfInput(
            saved
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
          );
          setSearchedTraveler(foundT);
          setSearchedReg(foundR);
        }
      }
    }
  }, [trip?.id, travelers, registrations]);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F8FC]">
        <div className="text-center space-y-4">
          <p className="text-sm font-semibold text-slate-800">Viagem não encontrada.</p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  // Registrations confirmed for this trip
  const tripRegs = registrations.filter(r => r.tripId === trip.id && r.status !== 'cancelled');

  // Calculate boarding percentage for active session if present, else general trip
  const totalCount = tripRegs.length;
  const boardedCount = activeSession
    ? tripRegs.filter(r => activeSession.records?.[r.id]?.status === 'embarcou').length
    : tripRegs.filter(r => r.boardingStatus === 'embarcou').length;
  const boardingPercentage = totalCount > 0 ? Math.round((boardedCount / totalCount) * 100) : 0;

  // Passenger financial calculations
  const passengerPayments = searchedReg
    ? payments.filter(p => p.registrationId === searchedReg.id && !p.refunded)
    : [];
  const totalPaid = passengerPayments.reduce((sum, p) => sum + p.amount, 0);
  const effectiveDue = searchedReg ? searchedReg.effectiveDue : 0;
  const remainingBalance = Math.max(0, effectiveDue - totalPaid);
  const isPaidInFull = searchedReg
    ? remainingBalance <= 0 || searchedReg.financialStatus === 'paid'
    : false;
  const paymentPercent = effectiveDue > 0 ? Math.min(100, Math.round((totalPaid / effectiveDue) * 100)) : 100;

  // Days until trip
  const daysUntil = getDaysUntil(trip.departureDate);
  const durationText = calculateDaysBetween(trip.departureDate, trip.returnDate);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    let formatted = val;
    if (val.length <= 11) {
      formatted = val
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    setCpfInput(formatted);
    setErrorMsg('');
  };

  const handleSearchPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const clean = cpfInput.replace(/\D/g, '');

    if (clean.length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }

    const traveler = travelers.find(t => t.cpf.replace(/\D/g, '') === clean);
    if (!traveler) {
      setErrorMsg('CPF não localizado na lista de passageiros. Verifique se o CPF digitado é o mesmo informado na reserva.');
      setSearchedTraveler(null);
      setSearchedReg(null);
      return;
    }

    const reg = registrations.find(
      r => r.tripId === trip.id && r.travelerId === traveler.id && r.status !== 'cancelled'
    );
    if (!reg) {
      setErrorMsg(`O passageiro ${traveler.fullName} não possui inscrição cadastrada para esta viagem (${trip.name}).`);
      setSearchedTraveler(null);
      setSearchedReg(null);
      return;
    }

    // Save CPF in localStorage for easy access on upcoming checkpoints
    try {
      localStorage.setItem('dinho_tour_passenger_cpf', clean);
    } catch (e) {
      console.error(e);
    }

    setSearchedTraveler(traveler);
    setSearchedReg(reg);
  };

  const handleConfirmBoarding = () => {
    if (!searchedTraveler || !searchedReg) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const res = selfPassengerCheckin(trip.slug, searchedTraveler.cpf);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg(res.message);
        if (res.registration) {
          setSearchedReg(res.registration);
        }
        try {
          localStorage.setItem('dinho_tour_passenger_cpf', searchedTraveler.cpf.replace(/\D/g, ''));
        } catch (e) {
          console.error(e);
        }
      } else {
        setErrorMsg(res.message);
      }
    }, 350);
  };

  const handleCopyPixKey = () => {
    if (settings.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${trip.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${trip.slug}`;
    const text = `Acesse o Portal do Viajante da Raon System para a viagem ${trip.name} com seu CPF:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Determine if this searched passenger is already confirmed in the active session
  const isPassengerAlreadyBoarded = searchedReg
    ? activeSession
      ? activeSession.records?.[searchedReg.id]?.status === 'embarcou'
      : searchedReg.boardingStatus === 'embarcou'
    : false;

  const passengerBoardingTime = searchedReg
    ? activeSession
      ? activeSession.records?.[searchedReg.id]?.confirmedAt
      : searchedReg.boardingTime
    : undefined;

  // Companion group information
  const travelerGroup = searchedReg?.groupId
    ? trip.groups?.find(g => g.id === searchedReg.groupId)
    : null;
  const companionRegs = searchedReg?.groupId
    ? tripRegs.filter(r => r.groupId === searchedReg.groupId && r.id !== searchedReg.id)
    : [];

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-800 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 font-extrabold text-white text-base shadow-xs">
              DT
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight">
                DINHO TOUR
              </span>
              <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider block">
                Portal Oficial do Viajante
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPortalLink}
              title="Copiar link do portal"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              title="Compartilhar no WhatsApp"
              className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 p-2 hover:bg-emerald-100 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>

            {onBackToTrip && (
              <button
                onClick={onBackToTrip}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Página de Vendas</span>
              </button>
            )}

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Painel Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Trip Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-lg">
          <div className="relative h-44 sm:h-56 w-full">
            {trip.imageUrl ? (
              <img
                src={trip.imageUrl}
                alt={trip.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                <Compass className="h-16 w-16 text-orange-500/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-orange-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  {trip.category}
                </span>
                <span className="text-xs text-orange-200 font-medium">{trip.destination}</span>
                {daysUntil.label && (
                  <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                    {daysUntil.label}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {trip.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-400" />
                  <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-400" />
                  <span>Saída: {trip.departureTime}</span>
                </div>
                {durationText && (
                  <>
                    <span>·</span>
                    <span>{durationText}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE ON-DEMAND SESSION BANNER (AO VIVO NO TRANSPORTE) */}
        {activeSession && (
          <div className="rounded-3xl border border-emerald-300 bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white shadow-lg space-y-3 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Chamada de Embarque Ativa Agora</span>
              </span>
              {activeSession.scheduledTime && (
                <span className="text-xs text-emerald-100 font-bold bg-black/20 px-2.5 py-1 rounded-lg">
                  Horário: {activeSession.scheduledTime}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white">{activeSession.title}</h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                Veículo: <strong>{activeSession.transportType}</strong>{' '}
                {activeSession.location ? `· Ponto: ${activeSession.location}` : ''}
              </p>
            </div>

            <div className="pt-2 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100 font-medium">
              <span>{searchedTraveler ? 'Dê seu OK logo abaixo para confirmar que está dentro' : 'Entre com seu CPF abaixo para dar OK de presença'}</span>
              <span className="font-bold text-white tabular-nums">
                {boardedCount} de {totalCount} a bordo ({boardingPercentage}%)
              </span>
            </div>
          </div>
        )}

        {/* TELA DE LOGIN COM CPF (QUANDO NÃO LOCALIZOU OU AINDA NÃO CONSULTOU) */}
        {!searchedTraveler || !searchedReg ? (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mb-3 shadow-xs">
                <Search className="h-7 w-7 stroke-[2.5]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Acesse seu Portal da Viagem com seu CPF
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Digite apenas os números do seu CPF cadastrado na reserva para acessar todas as informações
                exclusivas da sua viagem, confirmação, situação financeira, horários e confirmar seu embarque em tempo real.
              </p>
            </div>

            <form onSubmit={handleSearchPassenger} className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 text-center">
                  Digite seu CPF (11 dígitos)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    onChange={handleCpfChange}
                    className="w-full rounded-2xl border-2 border-slate-200 py-3.5 pl-4 pr-14 text-center text-lg sm:text-xl font-mono font-bold tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-orange-500 focus:outline-hidden transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Destaques do que tem dentro */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Confirmação da vaga & Assento</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Se falta pagar & Se está OK</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Datas, horários & Voo/Ônibus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Confirmar presença ("Dar OK")</span>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* PORTAL DO VIAJANTE COMPLETO (LOGADO COM CPF) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header de Boas-Vindas do Passageiro */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 font-extrabold text-lg shrink-0">
                    {searchedTraveler.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        {searchedTraveler.fullName}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          searchedReg.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : searchedReg.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {searchedReg.status === 'confirmed'
                          ? 'Vaga Confirmada'
                          : searchedReg.status === 'pending'
                          ? 'Aguardando Aprovação'
                          : searchedReg.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-3 mt-0.5">
                      <span>CPF: {formatCPF(searchedTraveler.cpf)}</span>
                      <span>·</span>
                      <span>RG: {searchedTraveler.rg || 'Não informado'}</span>
                      <span>·</span>
                      <span>WhatsApp: {formatPhoneBR(searchedTraveler.phone)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchedTraveler(null);
                      setSearchedReg(null);
                      setCpfInput('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Trocar CPF / Sair
                  </button>
                </div>
              </div>

              {/* Status Rápido: Assento e Pagamento em destaque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Seu Assento / Poltrona
                  </span>
                  <div className="text-xl font-black text-orange-600 font-mono mt-0.5">
                    {searchedReg.seatNumber ? `Poltrona ${searchedReg.seatNumber}` : 'A definir no embarque'}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {trip.transportType || 'Ônibus Executivo Turismo'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Situação Financeira
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isPaidInFull ? (
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Tudo OK (Quitado)</span>
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base font-extrabold text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Resta {formatBRL(remainingBalance)}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {isPaidInFull ? '100% pago' : `${paymentPercent}% pago de ${formatBRL(effectiveDue)}`}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Presença no Transporte
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isPassengerAlreadyBoarded ? (
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700 flex items-center gap-1">
                        <Check className="h-4 w-4 stroke-[3] text-emerald-600" />
                        <span>Confirmado a Bordo</span>
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base font-extrabold text-amber-600 flex items-center gap-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>Aguardando Embarque</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {isPassengerAlreadyBoarded && passengerBoardingTime
                      ? `OK às ${new Date(passengerBoardingTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Clique em "Dar OK" ao entrar'}
                  </span>
                </div>
              </div>

              {/* Navegação de Abas do Portal */}
              <div className="pt-2 border-t border-slate-100">
                <nav className="flex space-x-2 overflow-x-auto py-1 scrollbar-none">
                  {[
                    { id: 'presence', label: 'Embarque & Presença', icon: Bus },
                    {
                      id: 'financial',
                      label: isPaidInFull ? 'Pagamento (OK)' : `Financeiro (${formatBRL(remainingBalance)})`,
                      icon: CreditCard,
                      alert: !isPaidInFull,
                    },
                    { id: 'schedule', label: 'Horários & Voo', icon: Clock },
                    { id: 'itinerary', label: 'Roteiro Dia a Dia', icon: Calendar },
                    { id: 'notices', label: `Avisos (${trip.notices?.length || 0})`, icon: AlertTriangle },
                    ...(travelerGroup ? [{ id: 'groups', label: 'Acompanhantes & Quarto', icon: Users }] : []),
                    { id: 'packing', label: 'O que Levar & Inclusos', icon: Luggage },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as PortalTab)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{tab.label}</span>
                        {tab.alert && (
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* ABA 1: EMBARQUE & PRESENÇA (DAR OK) */}
            {activeTab === 'presence' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Conferência de Presença no Transporte
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeSession
                        ? `Conferência ativa agora: "${activeSession.title}" (${activeSession.transportType})`
                        : 'Confirme seu embarque oficial para que o guia e a equipe Raon System acompanhem em tempo real.'}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {boardedCount} de {totalCount} a bordo ({boardingPercentage}%)
                  </span>
                </div>

                {/* Progress bar ao vivo */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Lotação Confirmada no Transporte</span>
                    <span className="font-bold text-slate-900">{boardingPercentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${boardingPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Card de Ação Principal (DAR OK ou Já Confirmado) */}
                {isPassengerAlreadyBoarded ? (
                  <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50/80 p-6 sm:p-8 text-center space-y-3 shadow-xs">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                      <Check className="h-8 w-8 stroke-[3]" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-extrabold text-emerald-950">
                      Presença Confirmada a Bordo!
                    </h4>
                    <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                      {activeSession
                        ? `Você já deu OK nesta conferência ("${activeSession.title}"). O responsável já visualizou sua presença em tempo real no painel administrativo.`
                        : 'Você já deu OK de embarque neste transporte. A equipe da Raon System já registrou sua presença na lista oficial em tempo real.'}
                    </p>
                    {passengerBoardingTime && (
                      <span className="inline-block text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                        Registrado com sucesso às {new Date(passengerBoardingTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 text-center">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 text-left space-y-2">
                      <div className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>
                          Você ainda não confirmou presença {activeSession ? `para "${activeSession.title}"` : 'no transporte'}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        Ao entrar no {activeSession ? activeSession.transportType : 'ônibus ou avião'}, clique no botão verde abaixo.
                        O responsável da Raon System receberá a confirmação instantaneamente no celular dele.
                      </p>
                    </div>

                    {/* Botão Gigante DAR OK */}
                    <button
                      type="button"
                      onClick={handleConfirmBoarding}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] py-4 sm:py-5 px-6 text-base sm:text-lg font-black text-white shadow-lg transition-all"
                    >
                      <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                      <span>
                        {isSubmitting
                          ? 'Registrando Presença...'
                          : activeSession
                          ? `DAR OK — ESTOU NO ${activeSession.transportType.toUpperCase()} AGORA`
                          : 'DAR OK — CONFIRMAR QUE ESTOU NO TRANSPORTE'}
                      </span>
                    </button>
                  </div>
                )}

                {successMsg && (
                  <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3.5 text-xs text-emerald-900 font-semibold text-center">
                    ✓ {successMsg}
                  </div>
                )}

                {/* Acompanhantes no mesmo grupo para dar OK rápido */}
                {companionRegs.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>Acompanhantes do seu grupo ({travelerGroup?.name || 'Família/Casal'}):</span>
                      </span>
                      {travelerGroup?.roomNotes && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {travelerGroup.roomNotes}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {companionRegs.map(cReg => {
                        const cTraveler = travelers.find(t => t.id === cReg.travelerId);
                        const isCBoarded = cReg.boardingStatus === 'embarcou';

                        return (
                          <div
                            key={cReg.id}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs shadow-2xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{cTraveler?.fullName}</div>
                              <div className="text-[11px] text-slate-500">
                                Poltrona: {cReg.seatNumber || 'Não definida'}
                              </div>
                            </div>

                            <div>
                              {isCBoarded ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
                                  <Check className="h-3 w-3 stroke-[3]" /> A Bordo
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (cTraveler) {
                                      selfPassengerCheckin(trip.slug, cTraveler.cpf);
                                    }
                                  }}
                                  className="rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                  Dar OK ({cTraveler?.fullName.split(' ')[0]})
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: SITUAÇÃO FINANCEIRA ("SE FALTA PAGAR, SE ESTÁ OK") */}
            {activeTab === 'financial' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Situação Financeira & Pagamentos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Confira se seu pacote está 100% quitado ou se resta algum saldo a pagar.
                    </p>
                  </div>
                  <span
                    className={`rounded-xl px-3 py-1 text-xs font-bold ${
                      isPaidInFull
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isPaidInFull ? 'PAGAMENTO OK' : 'PENDENTE'}
                  </span>
                </div>

                {/* Banner de Status */}
                {isPaidInFull ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Tudo Certo! Seu pacote está 100% quitado.
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Não há valores pendentes para esta viagem. Sua vaga está garantida e confirmada com a Raon System.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-950">
                          Atenção: Saldo Restante de {formatBRL(remainingBalance)}
                        </h4>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Para concluir sua quitação, realize o pagamento via PIX abaixo e envie o comprovante diretamente para a agência.
                        </p>
                      </div>
                    </div>

                    {/* Barra de progresso de pagamento */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs font-bold text-amber-900">
                        <span>Pago: {formatBRL(totalPaid)}</span>
                        <span>Falta: {formatBRL(remainingBalance)}</span>
                      </div>
                      <div className="h-2.5 w-full bg-amber-200/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all"
                          style={{ width: `${paymentPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabela de Resumo dos Valores */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Demonstrativo da sua Reserva
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Valor da Viagem</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formatBRL(searchedReg.contractedAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Desconto</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {searchedReg.discount > 0 ? `- ${formatBRL(searchedReg.discount)}` : 'R$ 0,00'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Pago</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatBRL(totalPaid)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Saldo a Pagar</span>
                      <span
                        className={`font-black text-sm ${
                          remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatBRL(remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caixa PIX e Envio de Comprovante (se houver saldo pendente) */}
                {remainingBalance > 0 && settings.pixKey && (
                  <div className="rounded-2xl border-2 border-orange-200 bg-orange-50/60 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center gap-2 text-orange-950 font-bold text-sm">
                      <QrCode className="h-5 w-5 text-orange-600" />
                      <span>Pague o Saldo via Chave PIX da Raon System</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-white border border-orange-200 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Chave</span>
                        <span className="font-bold text-slate-800">{settings.pixKeyType || 'Chave PIX'}</span>
                      </div>
                      <div className="rounded-xl bg-white border border-orange-200 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorecido / Banco</span>
                        <span className="font-bold text-slate-800">{settings.agencyName} ({settings.bankName || 'Banco'})</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="w-full rounded-xl bg-white border border-orange-300 py-2.5 px-3 font-mono font-bold text-xs sm:text-sm text-slate-800 break-all">
                        {settings.pixKey}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shrink-0 shadow-xs"
                      >
                        {copiedPix ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar Chave PIX'}</span>
                      </button>
                    </div>

                    {/* Botão de WhatsApp para enviar comprovante */}
                    <div className="pt-2">
                      <a
                        href={buildWhatsAppLink(
                          settings.whatsapp,
                          `Olá equipe Raon System! Segue comprovante do pagamento restante de ${formatBRL(remainingBalance)} para a viagem "${trip.name}" do passageiro ${searchedTraveler.fullName} (CPF: ${searchedTraveler.cpf}).`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Enviar Comprovante pelo WhatsApp da Agência</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Histórico de Pagamentos já Feitos */}
                {passengerPayments.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Histórico de Pagamentos Registrados
                    </h4>
                    <div className="space-y-2">
                      {passengerPayments.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900">
                              {formatBRL(p.amount)} via {p.paymentMethod}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Pago em {formatDateBR(p.paymentDate)}
                              {p.notes ? ` · ${p.notes}` : ''}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            <Check className="h-3 w-3 stroke-[2.5]" /> Confirmado
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: HORÁRIOS, VOO & TRANSPORTE */}
            {activeTab === 'schedule' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Datas, Horários & Transporte Oficial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tudo que você precisa saber sobre horários de ida, volta, voos e pontos de encontro.
                  </p>
                </div>

                {/* Datas de Ida e Volta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">
                      Embarque / Saída
                    </span>
                    <div className="text-base font-extrabold text-slate-900">
                      {formatDateLongBR(trip.departureDate)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Horário de Partida: <strong>{trip.departureTime}</strong>
                      {trip.gatheringTime && ` (Apresentação às ${trip.gatheringTime})`}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Retorno / Chegada
                    </span>
                    <div className="text-base font-extrabold text-slate-900">
                      {formatDateLongBR(trip.returnDate)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Saída do Retorno: <strong>{trip.returnTime || 'A combinar'}</strong>
                      {trip.returnArrivalLocation && ` · Chegada prevista: ${trip.returnArrivalLocation}`}
                    </div>
                  </div>
                </div>

                {/* VOO OU DETALHES DE TRANSPORTE */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    {trip.flightNumber ? (
                      <Plane className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Bus className="h-5 w-5 text-orange-600" />
                    )}
                    <span>Veículo & Logística do Transporte</span>
                  </div>

                  {trip.flightNumber && (
                    <div className="rounded-xl border border-orange-200 bg-white p-3.5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-orange-600 block">
                        Voo Confirmado
                      </span>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {trip.flightNumber}
                      </div>
                      <p className="text-xs text-slate-500">
                        Apresente-se com documento original com foto no balcão da companhia aérea.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Tipo de Transporte
                      </span>
                      <span className="font-bold text-slate-800">
                        {trip.transportType || 'Ônibus Executivo Turismo com ar-condicionado'}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Sua Poltrona Designada
                      </span>
                      <span className="font-bold text-orange-600 text-sm">
                        {searchedReg.seatNumber ? `Poltrona ${searchedReg.seatNumber}` : 'Definição no embarque'}
                      </span>
                    </div>
                  </div>

                  {/* Locais de Embarque e Hospedagem */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-orange-600 mt-1 shrink-0" />
                      <div className="text-xs">
                        <strong className="block text-slate-900">Ponto de Embarque Inicial:</strong>
                        <span className="text-slate-600">{trip.departureLocation}</span>
                        <div className="mt-1">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.departureLocation)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700"
                          >
                            <span>Abrir no Google Maps</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Bed className="h-4 w-4 text-orange-600 mt-1 shrink-0" />
                      <div className="text-xs">
                        <strong className="block text-slate-900">Destino / Hospedagem:</strong>
                        <span className="text-slate-600">{trip.arrivalLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-orange-600 mt-1 shrink-0" />
                      <div className="text-xs">
                        <strong className="block text-slate-900">Responsável pelo Grupo:</strong>
                        <span className="text-slate-600">{trip.responsible}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: ROTEIRO DIA A DIA ("O DIA A DIA") */}
            {activeTab === 'itinerary' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Roteiro Completo Dia a Dia
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confira a programação e horários de passeios preparados para você.
                  </p>
                </div>

                {trip.itinerary && trip.itinerary.length > 0 ? (
                  <div className="space-y-6">
                    {trip.itinerary.map(day => (
                      <div
                        key={day.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-white font-bold text-xs">
                              D{day.dayNumber}
                            </span>
                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                              {day.title}
                            </h4>
                          </div>

                          {day.date && (
                            <span className="text-xs text-slate-500 font-medium font-mono">
                              {formatDateBR(day.date)}
                            </span>
                          )}
                        </div>

                        {day.description && (
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            {day.description}
                          </p>
                        )}

                        {/* Atividades do Dia */}
                        {day.activities && day.activities.length > 0 ? (
                          <div className="space-y-2.5 pt-1">
                            {day.activities.map(act => (
                              <div
                                key={act.id}
                                className="flex items-start gap-3 rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs text-xs"
                              >
                                <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md shrink-0">
                                  {act.time}
                                </span>
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900">{act.title}</div>
                                  <p className="text-slate-600 text-[11px]">{act.description}</p>
                                  {act.location && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3 w-3 text-slate-400" />
                                      {act.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Atividades a confirmar com o guia.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 space-y-2">
                    <p>O roteiro detalhado dia a dia está sendo finalizado pela equipe.</p>
                    <p className="text-[11px] text-slate-400">
                      Fique atento aos avisos da agência ou entre em contato com o responsável.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ABA 5: AVISOS DA AGÊNCIA */}
            {activeTab === 'notices' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Avisos & Comunicados Oficiais
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mensagens emitidas pela Raon System em tempo real para os passageiros desta viagem.
                  </p>
                </div>

                {trip.notices && trip.notices.length > 0 ? (
                  <div className="space-y-3">
                    {trip.notices.map(notice => (
                      <div
                        key={notice.id}
                        className={`rounded-2xl border p-4 space-y-1.5 ${
                          notice.priority === 'urgente'
                            ? 'border-rose-200 bg-rose-50/70 text-rose-950'
                            : notice.priority === 'importante'
                            ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                            : 'border-blue-200 bg-blue-50/70 text-blue-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs uppercase tracking-wider">
                            {notice.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatDateBR(notice.publishedAt)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90 whitespace-pre-line">
                          {notice.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500">
                    Nenhum aviso no momento. Todas as orientações estão normais.
                  </div>
                )}
              </div>
            )}

            {/* ABA 6: GRUPOS & ACOMPANHANTES */}
            {activeTab === 'groups' && travelerGroup && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Grupo: {travelerGroup.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Acompanhantes, assentos e acomodação conjunta no hotel.
                    </p>
                  </div>
                  {travelerGroup.roomNotes && (
                    <span className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1 text-xs font-bold">
                      {travelerGroup.roomNotes}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Integrantes do Grupo
                  </h4>

                  {/* O próprio viajante */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-orange-200 bg-orange-50/50 text-xs">
                    <div>
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <span>{searchedTraveler.fullName}</span>
                        <span className="text-[10px] font-bold text-orange-700 bg-white px-2 py-0.5 rounded-md border border-orange-200">
                          Você
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Poltrona: {searchedReg.seatNumber || 'Não definida'} · CPF: {formatCPF(searchedTraveler.cpf)}
                      </div>
                    </div>
                    <div>
                      {isPassengerAlreadyBoarded ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                          <Check className="h-3 w-3 stroke-[2.5]" /> A Bordo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                          Aguardando
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acompanhantes */}
                  {companionRegs.map(cReg => {
                    const cTraveler = travelers.find(t => t.id === cReg.travelerId);
                    const isCBoarded = cReg.boardingStatus === 'embarcou';

                    return (
                      <div
                        key={cReg.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{cTraveler?.fullName}</div>
                          <div className="text-[11px] text-slate-500">
                            Poltrona: {cReg.seatNumber || 'Não definida'} · CPF: {cTraveler ? cTraveler.cpf.slice(0, 3) + '.***.***-' + cTraveler.cpf.slice(-2) : '-'}
                          </div>
                        </div>

                        <div>
                          {isCBoarded ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                              <Check className="h-3 w-3 stroke-[2.5]" /> A Bordo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (cTraveler) {
                                  selfPassengerCheckin(trip.slug, cTraveler.cpf);
                                }
                              }}
                              className="rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                            >
                              Dar OK ({cTraveler?.fullName.split(' ')[0]})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA 7: O QUE LEVAR & INCLUSOS */}
            {activeTab === 'packing' && (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    O que Levar, Documentos & Inclusos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orientações para preparar sua mala e não esquecer nenhum item essencial.
                  </p>
                </div>

                {/* Documentos Obrigatórios */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>Documentos Obrigatórios para Embarque</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900 list-disc list-inside">
                    <li>Documento original com foto recente (RG emitido há menos de 10 anos ou CNH válida).</li>
                    <li>Para menores de 18 anos desacompanhados dos pais: autorização com firma reconhecida.</li>
                    <li>Cartão do SUS ou comprovante do plano de saúde.</li>
                  </ul>
                </div>

                {/* Inclusos no Pacote */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>O que está incluso no seu pacote</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {(trip.inclusions || []).map((inc, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusões */}
                {trip.exclusions && trip.exclusions.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-slate-400" />
                      <span>Não incluso no pacote</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      {trip.exclusions.map((exc, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span>{exc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rodapé de Suporte com WhatsApp */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 text-center text-xs text-slate-500 space-y-2">
          <p>
            Dúvidas sobre sua reserva, horários de voo ou ponto de encontro?
          </p>
          <a
            href={buildWhatsAppLink(
              settings.whatsapp,
              `Olá equipe Raon System, preciso de suporte sobre minha viagem para ${trip.name}:`
            )}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-bold text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Falar com o Responsável no WhatsApp ({settings.whatsapp})</span>
          </a>
        </div>
      </main>
    </div>
  );
};
