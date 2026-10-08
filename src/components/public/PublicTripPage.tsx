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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatDateBR,
  formatDateRangeBR,
  formatPhoneBR,
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

  // Inscription form state
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('AL');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    registrationId?: string;
    message: string;
    isWaitlist?: boolean;
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
              className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Voltar ao Painel
            </button>
          )}
        </div>
      </div>
    );
  }

  const occ = calculateTripOccupancy(trip, registrations);

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
    if (!fullName.trim() || !cpf.trim() || !phone.trim() || !city.trim()) {
      alert('Por favor, preencha nome completo, CPF, WhatsApp e cidade.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = registerTravelerToTrip(
        trip.id,
        {
          fullName: fullName.trim(),
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
          notes: notes.trim(),
          documentUrl,
        },
        {
          isPublic: true,
        }
      );

      setIsSubmitting(false);

      if (res.success) {
        setSubmissionResult({
          success: true,
          registrationId: res.registrationId,
          message: res.message,
          isWaitlist: res.status === 'waitlist',
        });
      } else {
        alert(res.message);
      }
    }, 400);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: trip.name,
        text: `Participe da viagem para ${trip.destination} com a Dinho Tour!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-800">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 font-extrabold text-white text-base shadow-xs">
              DT
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block leading-tight">
                DINHO TOUR
              </span>
              <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider block">
                Viagens & Turismo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setPublicCheckinSlug(trip.slug)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 shadow-xs transition-colors"
            >
              <Bus className="h-3.5 w-3.5" />
              <span>Portal do Viajante (CPF)</span>
            </button>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Painel Admin</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
              title="Compartilhar"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-xl">
          <div className="relative h-64 sm:h-96 w-full">
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

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                  {trip.category}
                </span>
                <span className="text-xs text-orange-200 font-medium">
                  {trip.destination}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {trip.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-200 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                </div>
                <span aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span>Saída às {trip.departureTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Investimento
            </span>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
              {formatBRL(trip.pricePerPerson)}
            </div>
            <span className="text-xs text-slate-500">Por pessoa (condições facilitadas)</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ponto de Embarque
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
              {trip.departureLocation}
            </div>
            <span className="text-xs text-slate-500">Chegada: {trip.arrivalLocation}</span>
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

            <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occ.isFull ? 'bg-rose-500' : 'bg-orange-600'
                }`}
                style={{ width: `${occ.occupancyPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {occ.occupiedSlots} de {occ.totalCapacity} vagas reservadas
            </span>
          </div>
        </div>

        {/* Boarding & Traveler Portal Callout Banner */}
        <div className="rounded-3xl border border-orange-200 bg-linear-to-r from-orange-500 to-amber-600 p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-xs">
                <Bus className="h-4 w-4" />
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Já é passageiro desta viagem?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-orange-100 max-w-lg">
              Acesse o <strong>Portal do Viajante com seu CPF</strong>: confira sua vaga, se falta pagar ou se está quitado, horários de voo/ônibus, roteiro dia a dia e confirme sua presença no embarque.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPublicCheckinSlug(trip.slug)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-orange-700 shadow-md hover:bg-orange-50 active:scale-[0.99] transition-all shrink-0"
          >
            <Bus className="h-4 w-4" />
            <span>Acessar Portal do Viajante (CPF)</span>
          </button>
        </div>

        {/* Official Trip Notices / Avisos da Viagem */}
        {trip.notices && trip.notices.length > 0 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <h3 className="font-bold text-base text-slate-900">
                Avisos & Comunicados Importantes da Agência
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
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Sobre este Roteiro
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
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Programação Dia a Dia
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

        {/* REGISTRATION FORM SECTION */}
        <div id="inscricao" className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-lg space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {occ.isFull ? 'Entrar na Lista de Espera' : 'Formulário de Inscrição'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {occ.isFull
                  ? 'Esta viagem atingiu a capacidade máxima. Inscreva-se para ser chamado em caso de desistência.'
                  : 'Preencha seus dados para reservar sua vaga com a Dinho Tour'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Dados protegidos pela LGPD</span>
            </div>
          </div>

          {/* Submission Success Box */}
          {submissionResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-emerald-950">
                  {submissionResult.isWaitlist
                    ? 'Inscrição na Lista de Espera Confirmada!'
                    : 'Inscrição Enviada com Sucesso!'}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                  {submissionResult.message}
                </p>
              </div>

              {/* Agency Payment Details */}
              <div className="max-w-md mx-auto rounded-2xl border border-emerald-200 bg-white p-5 text-left text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Dados da Dinho Tour para Depósito / Pix:</span>
                  <span className="text-[11px] font-semibold text-emerald-700">Chave {settings.pixKeyType}</span>
                </div>
                <div className="font-mono bg-slate-50 p-2.5 rounded-xl font-bold text-slate-900 select-all text-center">
                  {settings.pixKey}
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>Banco: {settings.bankName} - {settings.bankAccount}</p>
                  <p>WhatsApp Oficial: {settings.whatsapp}</p>
                </div>
              </div>

              <p className="text-[11px] text-emerald-700">
                Nossa equipe entrará em contato via WhatsApp ({phone}) para confirmar a reserva.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome como no documento"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
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
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RG</label>
                  <input
                    type="text"
                    placeholder="Número e órgão emissor"
                    value={rg}
                    onChange={e => setRg(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp com DDD *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(82) 99999-9999"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cidade / UF *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Sua cidade"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm focus:outline-hidden"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      className="w-14 rounded-xl border border-slate-200 px-2 py-2 text-xs sm:text-sm text-center focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contato de Emergência
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do contato (Parentesco)"
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Emergência
                  </label>
                  <input
                    type="text"
                    placeholder="(82) 99999-9999"
                    value={emergencyPhone}
                    onChange={e => setEmergencyPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Anexar Documento (RG ou CNH) - Opcional
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs">
                      <Upload className="h-4 w-4 text-slate-500" />
                      <span>Selecionar Imagem ou PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                    </label>
                    {documentUrl && (
                      <span className="text-xs text-emerald-600 font-semibold">
                        ✓ Documento anexado com segurança
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações (restrições alimentares, assento ou dúvidas)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Alguma restrição ou pedido especial?"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-[11px] text-slate-400">
                  Ao clicar em enviar, você concorda com os termos de reserva da Dinho Tour.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all ${
                    occ.isFull
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-orange-600 hover:bg-orange-700 active:scale-[0.99]'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSubmitting
                      ? 'Processando...'
                      : occ.isFull
                      ? 'Entrar na Lista de Espera'
                      : 'Quero Participar — Enviar Inscrição'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">DINHO TOUR — Gestão de Viagens</p>
        <p className="mt-1">
          WhatsApp: {settings.whatsapp} · CNPJ: {settings.cnpj} · {settings.city} - {settings.state}
        </p>
      </footer>
    </div>
  );
};
