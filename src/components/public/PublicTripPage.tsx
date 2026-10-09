import React, { useState } from 'react';
import {
  Compass,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Send,
  Check,
  CreditCard,
  QrCode,
  Info,
  Bus,
  Bell,
  AlertTriangle,
  Copy,
  MessageCircle,
  Sparkles,
  Phone,
  FileText,
  Handshake,
  ChevronRight,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  formatBRL,
  formatDateBR,
  formatDateRangeBR,
  formatPhoneBR,
  formatCPF,
  isValidCPF,
  calculateTripOccupancy,
  buildWhatsAppLink,
} from '../../lib/utils';

interface PublicTripPageProps {
  slug: string;
  onBackToAdmin?: () => void;
}

export const PublicTripPage: React.FC<PublicTripPageProps> = ({ slug, onBackToAdmin }) => {
  const { trips, registrations, registerTravelerToTrip, settings, setPublicCheckinSlug } = useApp();

  const trip = trips.find(t => t.slug === slug) || trips[0];

  // Inscription form state with separate First and Last Name as requested
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('AL');
  const [address, setAddress] = useState('');
  const [boardingLocationChoice, setBoardingLocationChoice] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  
  // Payment Method selection: Pix, Cartão de Crédito, Boleto, Negociar com o Operador
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [copiedPix, setCopiedPix] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    registrationId?: string;
    message: string;
    isWaitlist?: boolean;
    chosenPaymentMethod: PaymentMethod;
    chosenInstallments?: number;
  } | null>(null);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F6F8FC]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Viagem não encontrada</h2>
          <p className="text-xs text-slate-500">
            O link pode ter expirado ou a viagem foi arquivada.
          </p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  const occ = calculateTripOccupancy(trip, registrations);

  const scrollToRegistration = () => {
    const el = document.getElementById('quero-viajar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCpfChange = (val: string) => {
    const formatted = formatCPF(val);
    setCpf(formatted);
    if (formatted.length === 14) {
      if (!isValidCPF(formatted)) {
        setCpfError('CPF com dígitos inválidos. Verifique os números.');
      } else {
        setCpfError(null);
      }
    } else {
      setCpfError(null);
    }
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = val;
    if (digits.length <= 11) {
      if (digits.length > 6) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      } else if (digits.length > 2) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      }
    }
    setPhone(formatted);
  };

  const handleEmergencyPhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    let formatted = val;
    if (digits.length <= 11) {
      if (digits.length > 6) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      } else if (digits.length > 2) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      }
    }
    setEmergencyPhone(formatted);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setDocumentUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullNameTrimmed = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor, informe seu Nome e Sobrenome.');
      return;
    }
    if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) {
      alert('Por favor, informe um CPF válido completo (11 dígitos).');
      return;
    }
    if (cpfError) {
      alert('O CPF informado é inválido. Por favor, confira os números digitados.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      alert('Por favor, informe um WhatsApp válido com DDD para contato.');
      return;
    }
    if (!city.trim()) {
      alert('Por favor, informe sua cidade.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const fullNotes = [
        notes.trim(),
        boardingLocationChoice.trim() ? `Ponto de Embarque preferido: ${boardingLocationChoice.trim()}` : '',
        paymentMethod === 'Cartão de Crédito' ? `Forma de Pagamento: Cartão de Crédito (${selectedInstallments}x)` : `Forma de Pagamento: ${paymentMethod}`,
      ].filter(Boolean).join(' | ');

      const res = registerTravelerToTrip(
        trip.id,
        {
          fullName: fullNameTrimmed,
          cpf: cpf.trim(),
          rg: rg.trim(),
          birthDate,
          phone: phone.trim(),
          email: email.trim(),
          city: city.trim(),
          state: state.trim(),
          address: address.trim(),
          emergencyContactName: emergencyName.trim(),
          emergencyContactPhone: emergencyPhone.trim(),
          notes: fullNotes,
          documentUrl,
        },
        {
          isPublic: true,
          paymentMethod,
        }
      );

      setIsSubmitting(false);

      if (res.success) {
        setSubmissionResult({
          success: true,
          registrationId: res.registrationId,
          message: res.message,
          isWaitlist: res.status === 'waitlist',
          chosenPaymentMethod: paymentMethod,
          chosenInstallments: selectedInstallments,
        });
      } else {
        alert(res.message);
      }
    }, 450);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: trip.name,
        text: `Participe da viagem para ${trip.destination} com a ${settings.agencyName || 'Raon System'}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link da viagem copiado para a área de transferência!');
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings.pixKey || 'pix@raonsystem.com.br');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // WhatsApp message helper for post-registration
  const getWhatsAppConfirmationUrl = () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const msg = `Olá! Acabei de me cadastrar na viagem *${trip.name}* pelo site!\n` +
      `👤 *Nome:* ${fullName}\n` +
      `📄 *CPF:* ${cpf}\n` +
      `💳 *Forma de Pagamento:* ${paymentMethod}${paymentMethod === 'Cartão de Crédito' ? ` (${selectedInstallments}x)` : ''}\n` +
      `Gostaria de confirmar minha reserva e combinar os detalhes!`;
    return buildWhatsAppLink(settings.whatsapp, msg);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-800 pb-24 sm:pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 font-extrabold text-white text-base shadow-xs">
              RS
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight">
                {settings.agencyName || 'Raon System'}
              </span>
              <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider block">
                Viagens & Turismo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick CTA button to jump directly to registration */}
            <button
              onClick={scrollToRegistration}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-700 shadow-xs transition-transform active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Quero Viajar</span>
            </button>

            <button
              onClick={() => setPublicCheckinSlug(trip.slug)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Bus className="h-3.5 w-3.5 text-orange-600" />
              <span>Já sou Passageiro (CPF)</span>
            </button>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Painel Admin</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              title="Compartilhar Link"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
          <div className="relative h-72 sm:h-96 md:h-[420px] w-full">
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
              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                <Compass className="h-16 w-16 text-orange-500/30" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
                  {trip.category}
                </span>
                <span className="rounded-lg bg-white/20 backdrop-blur-xs px-2.5 py-1 text-xs text-orange-100 font-semibold">
                  {trip.destination}
                </span>
                {occ.isFull ? (
                  <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase">
                    Vagas Esgotadas (Lista de Espera)
                  </span>
                ) : (
                  <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold uppercase">
                    {occ.availableSlots} vagas restantes
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                {trip.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 pt-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span>Saída às {trip.departureTime}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  <span>Embarque: {trip.departureLocation}</span>
                </div>
              </div>

              {/* Direct Hero CTA Button */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToRegistration}
                  className="flex items-center gap-2 rounded-2xl bg-orange-600 hover:bg-orange-500 px-6 py-3 text-sm sm:text-base font-extrabold text-white shadow-lg transition-transform active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Quero Viajar — Reservar Minha Vaga</span>
                  <ArrowDown className="h-4 w-4" />
                </button>

                <div className="text-xs sm:text-sm text-orange-200 font-medium">
                  A partir de <strong className="text-white text-base sm:text-lg">{formatBRL(trip.pricePerPerson)}</strong> por pessoa
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Investimento por Pessoa
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums mt-1 text-orange-600">
              {formatBRL(trip.pricePerPerson)}
            </div>
            <span className="text-xs text-slate-500">Pix, Boleto, Cartão até 12x ou Negociação direta</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ponto & Horário de Embarque
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
              {trip.departureLocation}
            </div>
            <span className="text-xs text-slate-500">
              Concentração {trip.departureTime} · Retorno {formatDateBR(trip.returnDate)}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Disponibilidade
              </span>
              {occ.isFull ? (
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                  LOTADA
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600">
                  {occ.availableSlots} vagas restantes
                </span>
              )}
            </div>

            <div className="mt-2 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occ.isFull ? 'bg-rose-500' : 'bg-orange-600'
                }`}
                style={{ width: `${occ.occupancyPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {occ.occupiedSlots} de {occ.totalCapacity} vagas já reservadas
            </span>
          </div>
        </div>

        {/* Official Trip Notices */}
        {trip.notices && trip.notices.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="font-bold text-base text-slate-900">
                Avisos & Comunicados Importantes
              </h3>
            </div>

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
          </div>
        )}

        {/* Description & Overview */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="h-5 w-5 text-orange-600" />
            <span>Sobre este Roteiro</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
            {trip.description}
          </p>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-bold text-base text-slate-900">O que está incluso</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              {(trip.inclusions || []).map((inc, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-bold text-base text-slate-900">O que não está incluso</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              {(trip.exclusions || []).map((exc, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Day-by-Day Itinerary */}
        {trip.itinerary && trip.itinerary.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span>Programação Dia a Dia</span>
            </h2>

            <div className="space-y-6">
              {trip.itinerary.map(day => (
                <div key={day.id} className="border-l-2 border-orange-500 pl-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-100 text-orange-800 px-2 py-0.5 text-xs font-bold">
                      Dia {day.dayNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{day.title}</h3>
                  </div>
                  {day.description && (
                    <p className="text-xs text-slate-500">{day.description}</p>
                  )}

                  <div className="space-y-2 pt-1">
                    {(day.activities || []).map(act => (
                      <div
                        key={act.id}
                        className="rounded-xl bg-slate-50 p-3 text-xs flex items-start gap-3"
                      >
                        <span className="font-mono font-bold text-orange-600 bg-white rounded px-2 py-0.5 shadow-2xs">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* REGISTRATION & ADHESION SECTION ("QUERO VIAJAR / RESERVAR") */}
        {/* ============================================================ */}
        <div
          id="quero-viajar"
          className="rounded-3xl border border-orange-200/90 bg-white p-6 sm:p-10 shadow-xl space-y-8 scroll-mt-20 relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                <span>Opção Quero Viajar / Reservar</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {occ.isFull ? 'Entrar na Lista de Espera' : 'Formulário de Inscrição & Adesão'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {occ.isFull
                  ? 'Esta viagem atingiu a capacidade máxima. Inscreva-se para ser chamado em caso de desistência.'
                  : `Preencha seus dados para reservar sua vaga na viagem para ${trip.destination}.`}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60 shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Segurança garantida (LGPD)</span>
            </div>
          </div>

          {/* Submission Success Screen */}
          {submissionResult ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 sm:p-10 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <Check className="h-9 w-9 stroke-[3]" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold uppercase tracking-wider inline-block">
                  {submissionResult.isWaitlist ? 'Lista de Espera Registrada' : 'Inscrição Enviada com Sucesso'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
                  Parabéns, {firstName}! Sua reserva foi iniciada!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800">
                  {submissionResult.message}
                </p>
              </div>

              {/* PAYMENT INSTRUCTIONS BOX TAILORED TO CHOSEN METHOD */}
              <div className="max-w-xl mx-auto rounded-2xl border border-emerald-200 bg-white p-6 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {submissionResult.chosenPaymentMethod === 'Pix' && (
                      <QrCode className="h-5 w-5 text-emerald-600" />
                    )}
                    {submissionResult.chosenPaymentMethod === 'Cartão de Crédito' && (
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    )}
                    {submissionResult.chosenPaymentMethod === 'Boleto' && (
                      <FileText className="h-5 w-5 text-amber-600" />
                    )}
                    {submissionResult.chosenPaymentMethod === 'Negociar com Operador' && (
                      <Handshake className="h-5 w-5 text-orange-600" />
                    )}
                    <span className="font-bold text-sm text-slate-900">
                      Forma de Pagamento: {submissionResult.chosenPaymentMethod}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatBRL(trip.pricePerPerson)}
                  </span>
                </div>

                {/* PIX DETAILS */}
                {submissionResult.chosenPaymentMethod === 'Pix' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Faça o Pix no valor de <strong>{formatBRL(trip.pricePerPerson)}</strong> para a chave abaixo e envie o comprovante:
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-900 text-xs sm:text-sm select-all">
                        {settings.pixKey || 'pix@raonsystem.com.br'}
                      </div>
                      <button
                        onClick={handleCopyPix}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 text-xs font-bold transition-colors shrink-0"
                      >
                        {copiedPix ? 'Copiado!' : 'Copiar Chave'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p>Tipo de Chave: {settings.pixKeyType || 'CNPJ'} · Banco: {settings.bankName || 'Inter'}</p>
                      <p>Após pagar, clique no botão abaixo para enviar o comprovante no WhatsApp.</p>
                    </div>
                  </div>
                )}

                {/* CREDIT CARD DETAILS */}
                {submissionResult.chosenPaymentMethod === 'Cartão de Crédito' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Você selecionou pagamento no <strong>Cartão de Crédito em {submissionResult.chosenInstallments || 1}x de {formatBRL(trip.pricePerPerson / (submissionResult.chosenInstallments || 1))}</strong>.
                    </p>
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-blue-900 space-y-1">
                      <p className="font-bold">Como funciona a cobrança?</p>
                      <p className="text-[11px] text-blue-800">
                        Nossa equipe gerou o link de pagamento seguro e vai enviar diretamente no seu WhatsApp ({phone}). Você também pode clicar no botão abaixo para abrir o chat e pagar imediatamente.
                      </p>
                    </div>
                  </div>
                )}

                {/* BOLETO DETAILS */}
                {submissionResult.chosenPaymentMethod === 'Boleto' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Você optou por pagamento via <strong>Boleto Bancário</strong>.
                    </p>
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5 text-xs text-amber-900 space-y-1">
                      <p className="font-bold">Emissão do Boleto</p>
                      <p className="text-[11px] text-amber-800">
                        O boleto será emitido nominalmente para seu CPF (<strong>{cpf}</strong>) e enviado no seu WhatsApp ({phone}) e e-mail.
                      </p>
                    </div>
                  </div>
                )}

                {/* NEGOCIAR COM O OPERADOR */}
                {submissionResult.chosenPaymentMethod === 'Negociar com Operador' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Sua solicitação de negociação direta foi registrada!
                    </p>
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-3.5 text-xs text-orange-950 space-y-1">
                      <p className="font-bold">Combinação com o Operador</p>
                      <p className="text-[11px] text-orange-900">
                        Clique no botão verde abaixo para falar direto com o operador no WhatsApp. Você pode combinar parcelamento via carnê, pagamento em dinheiro ou acerto no embarque.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                <a
                  href={getWhatsAppConfirmationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition-transform active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Falar no WhatsApp com a Agência</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPublicCheckinSlug(trip.slug)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors"
                >
                  <Bus className="h-4 w-4 text-orange-600" />
                  <span>Portal do Viajante (com CPF)</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: PERSONAL DATA */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-1 border-b border-slate-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-black">
                    1
                  </span>
                  <span>Seus Dados Pessoais</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sobrenome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: da Silva"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  {/* CPF with validation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        CPF (Obrigatório) *
                      </label>
                      <span className="text-[10px] text-slate-400">Usado no embarque</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => handleCpfChange(e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-hidden ${
                        cpfError
                          ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 focus:border-orange-500'
                      }`}
                    />
                    {cpfError && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">
                        {cpfError}
                      </p>
                    )}
                  </div>

                  {/* RG */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      RG (Documento de Identidade)
                    </label>
                    <input
                      type="text"
                      placeholder="Número e Órgão Emissor"
                      value={rg}
                      onChange={e => setRg(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp com DDD *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      placeholder="(82) 99999-9999"
                      value={phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Enviaremos os vouchers e confirmações neste número
                    </span>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  {/* City and State */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cidade / UF *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Sua cidade"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={state}
                        onChange={e => setState(e.target.value.toUpperCase())}
                        className="w-14 rounded-xl border border-slate-200 px-2 py-2 text-xs sm:text-sm text-center font-bold focus:border-orange-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Preferred Boarding Point */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ponto de Embarque Preferido
                    </label>
                    <input
                      type="text"
                      placeholder={`Padrão da viagem: ${trip.departureLocation}`}
                      value={boardingLocationChoice}
                      onChange={e => setBoardingLocationChoice(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: PAYMENT METHOD (PIX, BOLETO, CARTAO, OPERADOR) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-black">
                      2
                    </span>
                    <span>Escolha a Forma de Pagamento</span>
                  </div>
                  <span className="text-xs font-bold text-orange-600">
                    Valor: {formatBRL(trip.pricePerPerson)}
                  </span>
                </div>

                {/* Grid of 4 Payment Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: PIX */}
                  <div
                    onClick={() => setPaymentMethod('Pix')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      paymentMethod === 'Pix'
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'Pix' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Pix Instantâneo</div>
                          <span className="text-[11px] text-emerald-700 font-semibold">Aprovação Imediata</span>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'Pix' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'Pix' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Chave Pix e QR Code direto na tela com envio de comprovante fácil.
                    </p>
                  </div>

                  {/* Option 2: CARTAO DE CREDITO */}
                  <div
                    onClick={() => setPaymentMethod('Cartão de Crédito')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      paymentMethod === 'Cartão de Crédito'
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'Cartão de Crédito' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Cartão de Crédito</div>
                          <span className="text-[11px] text-blue-700 font-semibold">Parcele em até 12x</span>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'Cartão de Crédito' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'Cartão de Crédito' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Link de pagamento seguro para pagar pelo celular sem sair de casa.
                    </p>
                  </div>

                  {/* Option 3: BOLETO */}
                  <div
                    onClick={() => setPaymentMethod('Boleto')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      paymentMethod === 'Boleto'
                        ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'Boleto' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Boleto Bancário</div>
                          <span className="text-[11px] text-amber-700 font-semibold">À vista</span>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'Boleto' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'Boleto' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Emitido nominalmente para o seu CPF e enviado no seu WhatsApp e e-mail.
                    </p>
                  </div>

                  {/* Option 4: NEGOCIAR COM O OPERADOR */}
                  <div
                    onClick={() => setPaymentMethod('Negociar com Operador')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      paymentMethod === 'Negociar com Operador'
                        ? 'border-orange-500 bg-orange-50/60 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'Negociar com Operador' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Handshake className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">Negociar com o Operador</div>
                          <span className="text-[11px] text-orange-700 font-semibold">Carnê, Dinheiro ou Personalizado</span>
                        </div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'Negociar com Operador' ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === 'Negociar com Operador' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Fale diretamente no WhatsApp com nossa equipe para acertar condições especiais.
                    </p>
                  </div>
                </div>

                {/* Sub-config for Credit Card Installments */}
                {paymentMethod === 'Cartão de Crédito' && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-blue-950">
                      Simulação de Parcelas no Cartão:
                    </label>
                    <select
                      value={selectedInstallments}
                      onChange={e => setSelectedInstallments(Number(e.target.value))}
                      className="w-full rounded-xl border border-blue-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 12].map(n => {
                        const val = trip.pricePerPerson / n;
                        return (
                          <option key={n} value={n}>
                            {n}x de {formatBRL(val)} {n === 1 ? '(à vista)' : 'sem juros'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>

              {/* STEP 3: EMERGENCY & OBSERVATIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-1 border-b border-slate-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-black">
                    3
                  </span>
                  <span>Informações Complementares & Observações</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contato de Emergência (Nome / Parentesco)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Maria da Silva (Mãe)"
                      value={emergencyName}
                      onChange={e => setEmergencyName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone do Contato de Emergência
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="(82) 99999-9999"
                      value={emergencyPhone}
                      onChange={e => handleEmergencyPhoneChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observações (Restrições alimentares, preferência de assento, acompanhantes...)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Alguma restrição, pedido especial ou nome de quem viaja junto com você?"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Anexar Foto do Documento (RG ou CNH) — Opcional
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                        <Upload className="h-4 w-4 text-slate-500" />
                        <span>Selecionar Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDocumentUpload}
                          className="hidden"
                        />
                      </label>
                      {documentUrl && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          <span>Documento anexado</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-[11px] text-slate-400">
                  Ao clicar em enviar, você confirma o interesse na vaga para a viagem com a {settings.agencyName || 'Raon System'}.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-9 py-4 text-sm sm:text-base font-extrabold text-white shadow-xl transition-all ${
                    occ.isFull
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-orange-600 hover:bg-orange-500 active:scale-95'
                  }`}
                >
                  <Send className="h-5 w-5" />
                  <span>
                    {isSubmitting
                      ? 'Processando Inscrição...'
                      : occ.isFull
                      ? 'Entrar na Lista de Espera'
                      : 'Quero Viajar — Confirmar Minha Reserva'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Floating Bottom Bar for Mobile conversion */}
      {!submissionResult && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 p-3 sm:hidden backdrop-blur-md shadow-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Investimento</span>
            <div className="text-base font-black text-orange-600 tabular-nums">
              {formatBRL(trip.pricePerPerson)}
            </div>
          </div>
          <button
            onClick={scrollToRegistration}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-md active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Quero Viajar (Reservar)</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-800 text-sm">{settings.agencyName || 'Raon System'} — Gestão de Viagens</p>
        <p className="mt-1">
          WhatsApp: {settings.whatsapp} · CNPJ: {settings.cnpj} · {settings.city} - {settings.state}
        </p>
      </footer>
    </div>
  );
};
