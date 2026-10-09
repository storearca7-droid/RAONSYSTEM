import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  Plus,
  Share2,
  Copy,
  Check,
  MoreVertical,
  CopyPlus,
  Edit2,
  Trash2,
  ExternalLink,
  Bus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Trip, TripCategory, TripStatus } from '../../types';
import {
  formatBRL,
  formatDateRangeBR,
  calculateTripOccupancy,
  calculateTripFinances,
  buildWhatsAppLink,
} from '../../lib/utils';

interface TripsListViewProps {
  onOpenNewTripModal: () => void;
  onEditTrip: (trip: Trip) => void;
}

export const TripsListView: React.FC<TripsListViewProps> = ({
  onOpenNewTripModal,
  onEditTrip,
}) => {
  const {
    trips,
    registrations,
    payments,
    expenses,
    setSelectedTripId,
    duplicateTrip,
    deleteTrip,
    setPublicTripSlug,
    setPublicCheckinSlug,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TripCategory>('all');
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredTrips = trips.filter(trip => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || trip.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCopyLink = (tripSlug: string, tripId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${tripSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedTripId(tripId);
    setTimeout(() => setCopiedTripId(null), 2000);
  };

  const handleCopyPortalLink = (tripSlug: string, tripId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${tripSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedTripId(`portal_${tripId}`);
    setTimeout(() => setCopiedTripId(null), 2000);
  };

  const handleShareWhatsApp = (trip: Trip) => {
    const url = `${window.location.origin}${window.location.pathname}?viagem=${trip.slug}`;
    const message = `Olá! Confira nossa viagem para *${trip.name}* com a Raon System!\nDatas: ${formatDateRangeBR(
      trip.departureDate,
      trip.returnDate
    )}\nValor: ${formatBRL(trip.pricePerPerson)}\nGaranta sua vaga no link:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDelete = (trip: Trip) => {
    if (confirm(`Tem certeza que deseja excluir a viagem "${trip.name}"?`)) {
      const res = deleteTrip(trip.id);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls: Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por viagem, destino..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Todos os Status</option>
            <option value="publicada">Publicada</option>
            <option value="rascunho">Rascunho</option>
            <option value="encerrada">Encerrada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Todas Categorias</option>
            <option value="Excursão">Excursão</option>
            <option value="Praia">Praia</option>
            <option value="Cultural">Cultural</option>
            <option value="Aventura">Aventura</option>
            <option value="Religioso">Religioso</option>
            <option value="Passeio">Passeio</option>
            <option value="Corporativo">Corporativo</option>
            <option value="Nacional">Nacional</option>
            <option value="Internacional">Internacional</option>
          </select>

          <button
            onClick={onOpenNewTripModal}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Viagem</span>
          </button>
        </div>
      </div>

      {/* Grid of Trips */}
      {filteredTrips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Compass className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            Nenhuma viagem encontrada
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Tente mudar os filtros de busca ou cadastre uma nova viagem.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const occ = calculateTripOccupancy(trip, registrations);
            const fin = calculateTripFinances(trip, registrations, payments, expenses);

            return (
              <div
                key={trip.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:shadow-md hover:border-slate-300 relative"
              >
                {/* Image Banner */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
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
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-500">
                      <Compass className="h-10 w-10 text-orange-400/50" />
                    </div>
                  )}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                      {trip.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {occ.isFull ? (
                        <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          LOTADA
                        </span>
                      ) : (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${
                            trip.status === 'publicada'
                              ? 'bg-emerald-600'
                              : trip.status === 'rascunho'
                              ? 'bg-slate-600'
                              : 'bg-amber-600'
                          }`}
                        >
                          {trip.status}
                        </span>
                      )}

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === trip.id ? null : trip.id)
                          }
                          className="rounded-lg bg-slate-900/80 p-1 text-white hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdownId === trip.id && (
                          <div className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg text-xs text-slate-700">
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                onEditTrip(trip);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                              <span>Editar Viagem</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                duplicateTrip(trip.id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50"
                            >
                              <CopyPlus className="h-3.5 w-3.5 text-slate-500" />
                              <span>Duplicar</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                setPublicCheckinSlug(trip.slug);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-orange-50 text-orange-600 font-semibold"
                            >
                              <Bus className="h-3.5 w-3.5" />
                              <span>Portal do Viajante (CPF)</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleCopyPortalLink(trip.slug, trip.id);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700"
                            >
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Copiar Link do Viajante</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                setPublicTripSlug(trip.slug);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                              <span>Página de Vendas / Inscrição</span>
                            </button>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                handleDelete(trip);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Excluir Viagem</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
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

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5 space-y-4">
                  {/* Clean unboxed dates */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatDateRangeBR(trip.departureDate, trip.returnDate)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{trip.departureLocation || 'Embarque Central'}</span>
                  </div>

                  {/* Occupancy Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="text-slate-600">
                        {occ.occupiedSlots} de {occ.totalCapacity} vagas
                        {occ.waitlist > 0 && ` (+${occ.waitlist} espera)`}
                      </span>
                      <span className="font-bold tabular-nums text-slate-800">
                        {occ.occupancyPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occ.isFull ? 'bg-rose-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${occ.occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Mini Details */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-medium">Preço</span>
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatBRL(trip.pricePerPerson)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 font-medium">Recebido</span>
                      <p className="font-semibold text-emerald-600 tabular-nums">
                        {formatBRL(fin.totalReceived)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedTripId(trip.id)}
                      className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                      Acessar Gestão
                    </button>

                    <button
                      onClick={() => setPublicCheckinSlug(trip.slug)}
                      title="Abrir Portal do Viajante (Login com CPF)"
                      className="rounded-xl border border-orange-200 bg-orange-50 p-2 text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      <Bus className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleCopyPortalLink(trip.slug, trip.id)}
                      title="Copiar link do Portal do Viajante (para enviar aos passageiros)"
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                    >
                      {copiedTripId === `portal_${trip.id}` ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleShareWhatsApp(trip)}
                      title="Compartilhar no WhatsApp"
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
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
    </div>
  );
};
