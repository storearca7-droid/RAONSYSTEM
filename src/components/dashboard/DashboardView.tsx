import React, { useState } from 'react';
import {
  Compass,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Share2,
  Copy,
  Check,
  Bus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatDateRangeBR,
  calculateTripOccupancy,
  calculateTripFinances,
  buildWhatsAppLink,
} from '../../lib/utils';

interface DashboardViewProps {
  onOpenNewTripModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewTripModal }) => {
  const { trips, registrations, payments, expenses, setSelectedTripId, setActiveMenu, setPublicTripSlug, setPublicCheckinSlug } = useApp();
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  // Derived metrics from real data
  const publishedTrips = trips.filter(t => t.status === 'publicada');
  const now = new Date();
  const upcomingTrips = publishedTrips.filter(t => new Date(t.departureDate) >= now);

  const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed');
  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const waitlistRegistrations = registrations.filter(r => r.status === 'waitlist');

  // Overall capacity & availability
  const totalCapacity = publishedTrips.reduce((acc, t) => acc + t.capacity, 0);
  const occupiedSlots = publishedTrips.reduce((acc, t) => {
    const occ = calculateTripOccupancy(t, registrations);
    return acc + occ.occupiedSlots;
  }, 0);
  const availableSlots = Math.max(0, totalCapacity - occupiedSlots);

  // Financial indicators
  const totalReceived = payments.filter(p => !p.refunded).reduce((acc, p) => acc + p.amount, 0);
  const activeRegs = registrations.filter(r => r.status !== 'cancelled');
  const totalContracted = activeRegs.reduce((acc, r) => acc + (r.effectiveDue || 0), 0);
  const totalToReceive = Math.max(0, totalContracted - totalReceived);

  // Overdue registrations
  const overdueRegs = activeRegs.filter(r => r.financialStatus === 'overdue');
  const overdueAmount = overdueRegs.reduce((acc, r) => {
    const paidForReg = payments
      .filter(p => p.registrationId === r.id && !p.refunded)
      .reduce((pAcc, p) => pAcc + p.amount, 0);
    return acc + Math.max(0, r.effectiveDue - paidForReg);
  }, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Trips nearing capacity or full
  const fullTrips = publishedTrips.filter(t => {
    const occ = calculateTripOccupancy(t, registrations);
    return occ.isFull;
  });

  const handleCopyLink = (tripSlug: string, tripId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${tripSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedTripId(tripId);
    setTimeout(() => setCopiedTripId(null), 2000);
  };

  const handleShareWhatsApp = (trip: typeof trips[0]) => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${trip.slug}`;
    const message = `Olá! Confira nossa viagem para *${trip.name}* com a Raon System!\nDatas: ${formatDateRangeBR(
      trip.departureDate,
      trip.returnDate
    )}\nValor: ${formatBRL(trip.pricePerPerson)}\nGaranta sua vaga no link:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setActiveMenu('trips');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Critical Alerts Banner (if pending registrations or full trips exist) */}
      {(pendingRegistrations.length > 0 || fullTrips.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingRegistrations.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {pendingRegistrations.length} {pendingRegistrations.length === 1 ? 'inscrição aguardando aprovação' : 'inscrições aguardando aprovação'}
                  </h4>
                  <p className="text-xs text-amber-700">
                    Viajantes aguardam validação no painel para confirmar a vaga.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMenu('travelers')}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap"
              >
                Revisar
              </button>
            </div>
          )}

          {fullTrips.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {fullTrips.length} {fullTrips.length === 1 ? 'viagem lotada' : 'viagens lotadas'} (100% ocupada)
                  </h4>
                  <p className="text-xs text-rose-700">
                    Novas inscrições são direcionadas automaticamente para a lista de espera.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMenu('trips')}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors whitespace-nowrap"
              >
                Ver Viagens
              </button>
            </div>
          )}
        </div>
      )}

      {/* 8 Essential Stat Cards */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Visão Geral em Tempo Real
          </h2>
          <span className="text-xs text-slate-500">
            Atualizado a partir dos registros confirmados
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Viagens Ativas */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Viagens Ativas</span>
              <Compass className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {publishedTrips.length}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {trips.length} cadastradas no total
            </div>
          </div>

          {/* Card 2: Próximas Viagens */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Próximos Embarques</span>
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {upcomingTrips.length}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Nos próximos meses
            </div>
          </div>

          {/* Card 3: Viajantes Confirmados */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Viajantes Confirmados</span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {confirmedRegistrations.length}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              +{waitlistRegistrations.length} em lista de espera
            </div>
          </div>

          {/* Card 4: Vagas Disponíveis */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Vagas Disponíveis</span>
              <CheckCircle2 className="h-4 w-4 text-cyan-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {availableSlots}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              De {totalCapacity} vagas totais
            </div>
          </div>

          {/* Card 5: Pagamentos Recebidos */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Recebido</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">
              {formatBRL(totalReceived)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Confirmado em caixa/banco
            </div>
          </div>

          {/* Card 6: A Receber */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">A Receber</span>
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">
              {formatBRL(totalToReceive)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Saldos das inscrições
            </div>
          </div>

          {/* Card 7: Pagamentos Atrasados */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Atrasados</span>
              <div className="h-2 w-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 tabular-nums">
              {formatBRL(overdueAmount)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {overdueRegs.length} {overdueRegs.length === 1 ? 'viajante pendente' : 'viajantes pendentes'}
            </div>
          </div>

          {/* Card 8: Despesas Totais */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Despesas</span>
              <div className="h-2 w-2 rounded-full bg-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums">
              {formatBRL(totalExpenses)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Gastos operacionais
            </div>
          </div>
        </div>
      </section>

      {/* Trips List with Progress & Live Occupancy */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Viagens em Destaque & Ocupação
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhamento de vagas, ingressos e links públicos para divulgação rápida
            </p>
          </div>
          <button
            onClick={() => setActiveMenu('trips')}
            className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            <span>Ver todas as viagens ({trips.length})</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Compass className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">
              Nenhuma viagem cadastrada ainda
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Comece cadastrando sua primeira excursão ou roteiro turístico para a Raon System.
            </p>
            <button
              onClick={onOpenNewTripModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700"
            >
              + Cadastrar primeira viagem
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 6).map(trip => {
              const occ = calculateTripOccupancy(trip, registrations);
              const fin = calculateTripFinances(trip, registrations, payments, expenses);

              return (
                <div
                  key={trip.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    {trip.imageUrl ? (
                      <img
                        src={trip.imageUrl}
                        alt={trip.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-tr from-slate-900 to-slate-800 text-slate-500">
                        <Compass className="h-10 w-10 text-orange-400/50" />
                      </div>
                    )}

                    {/* Gradient Overlay for Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Over-image metadata */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                        {trip.category}
                      </span>

                      {occ.isFull ? (
                        <span className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider animate-pulse">
                          VIAGEM LOTADA
                        </span>
                      ) : trip.status === 'rascunho' ? (
                        <span className="rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-xs">
                          Rascunho
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                          {occ.availableSlots} vagas livres
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[11px] text-orange-300 font-medium">
                        {trip.destination}
                      </p>
                      <h3 className="text-base font-bold text-white line-clamp-1">
                        {trip.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5 space-y-4">
                    {/* Unboxed Metadata (Zero-pill discipline) */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Saída {trip.departureTime}</span>
                    </div>

                    {/* Occupancy Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                        <span className="text-slate-600">
                          Ocupação ({occ.occupiedSlots}/{occ.totalCapacity} vagas)
                        </span>
                        <span
                          className={`font-bold tabular-nums ${
                            occ.isFull ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {occ.occupancyPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            occ.isFull
                              ? 'bg-rose-500'
                              : occ.occupancyPercent > 75
                              ? 'bg-amber-500'
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${occ.occupancyPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Price and Financial Mini Summary */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          Preço / viajante
                        </span>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatBRL(trip.pricePerPerson)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          Arrecadado
                        </span>
                        <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                          {formatBRL(fin.totalReceived)}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewTrip(trip.id)}
                        className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        Ver Detalhes
                      </button>

                      <button
                        onClick={() => setPublicCheckinSlug(trip.slug)}
                        title="Portal do Viajante (Login com CPF) & Presença no Transporte"
                        className="flex items-center justify-center rounded-xl border border-orange-200 bg-orange-50 p-2 text-orange-600 hover:bg-orange-100 transition-colors"
                      >
                        <Bus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleCopyLink(trip.slug, trip.id)}
                        title="Copiar link público da viagem"
                        className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                      >
                        {copiedTripId === trip.id ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(trip)}
                        title="Compartilhar no WhatsApp"
                        className="flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
