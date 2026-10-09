import React, { useState } from 'react';
import {
  Bus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Share2,
  Printer,
  Smartphone,
  Phone,
  Search,
  Filter,
  UserCheck,
  Plus,
  PlayCircle,
  StopCircle,
  Trash2,
  Radio,
  MapPin,
  Calendar,
  X,
  History,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Trip, TripRegistration, BoardingStatus, BoardingSession } from '../../../types';
import { formatPhoneBR, maskCPF, buildWhatsAppLink } from '../../../lib/utils';

interface TripBoardingTabProps {
  trip: Trip;
}

const QUICK_SESSION_SUGGESTIONS = [
  { title: 'Embarque Inicial - Saída da Viagem', transport: 'Ônibus Leito', location: 'Ponto de Encontro Central' },
  { title: 'Retorno do Passeio - Entrando no Ônibus', transport: 'Ônibus Executivo', location: 'Estacionamento do Passeio' },
  { title: 'Embarque Pós-Almoço', transport: 'Ônibus / Van', location: 'Restaurante' },
  { title: 'Embarque para Passeio de Barco / Catamarã', transport: 'Catamarã / Embarcação', location: 'Píer / Marina' },
  { title: 'Retorno para o Hotel / Pousada', transport: 'Ônibus Leito', location: 'Ponto Turístico' },
  { title: 'Embarque Final - Retorno para Casa', transport: 'Ônibus Leito', location: 'Recepção do Hotel' },
];

export const TripBoardingTab: React.FC<TripBoardingTabProps> = ({ trip }) => {
  const {
    travelers,
    registrations,
    updateBoardingStatus,
    setPublicCheckinSlug,
    createBoardingSession,
    setActiveBoardingSession,
    closeBoardingSession,
    deleteBoardingSession,
    updateSessionPassengerStatus,
  } = useApp();

  const sessions = trip.boardingSessions || [];
  const activeSession = sessions.find(s => s.isActive);

  // Selected session to view in the table: either the active session, a specific session, or 'general'
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    return activeSession?.id || (sessions.length > 0 ? sessions[0].id : 'general');
  });

  // Modal for creating a new on-demand session
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionTransport, setSessionTransport] = useState('Ônibus Executivo');
  const [sessionLocation, setSessionLocation] = useState('');
  const [sessionTime, setSessionTime] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | BoardingStatus>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingSeatRegId, setEditingSeatRegId] = useState<string | null>(null);
  const [seatInputValue, setSeatInputValue] = useState('');

  // Confirmed registrations only (eligible for boarding)
  const confirmedRegs = registrations.filter(
    r => r.tripId === trip.id && (r.status === 'confirmed' || r.status === 'pending')
  );

  const currentSession = sessions.find(s => s.id === selectedSessionId);

  // Calculate stats based on whether we are viewing a specific session or general boarding
  const getPassengerRecord = (regId: string) => {
    if (currentSession && currentSession.records && currentSession.records[regId]) {
      return currentSession.records[regId];
    }
    const reg = registrations.find(r => r.id === regId);
    return {
      status: reg?.boardingStatus || 'aguardando',
      confirmedAt: reg?.boardingTime,
      selfChecked: reg?.boardingSelfChecked || false,
    };
  };

  const boardedCount = confirmedRegs.filter(r => getPassengerRecord(r.id).status === 'embarcou').length;
  const waitingCount = confirmedRegs.filter(r => getPassengerRecord(r.id).status === 'aguardando').length;
  const missedCount = confirmedRegs.filter(r => getPassengerRecord(r.id).status === 'faltou').length;
  const totalCount = confirmedRegs.length;
  const progressPercent = totalCount > 0 ? Math.round((boardedCount / totalCount) * 100) : 0;

  const filteredRegs = confirmedRegs.filter(r => {
    const traveler = travelers.find(t => t.id === r.travelerId);
    if (!traveler) return false;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      traveler.fullName.toLowerCase().includes(term) ||
      traveler.cpf.includes(term) ||
      (r.seatNumber && r.seatNumber.toLowerCase().includes(term));

    const record = getPassengerRecord(r.id);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesGroup = selectedGroupFilter === 'all' || r.groupId === selectedGroupFilter;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  const checkinUrl = `${window.location.origin}${window.location.pathname}?portal=${trip.slug}`;

  const handleCopyCheckinLink = () => {
    navigator.clipboard.writeText(checkinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareCheckinWhatsApp = () => {
    const sessionName = currentSession ? ` para a conferência de *${currentSession.title}* (${currentSession.transportType})` : '';
    const msg = `Olá viajante da Raon System! Acesse o Portal do Viajante${sessionName} para *${trip.name}* com seu CPF para conferir horários, sua poltrona e dar o OK de presença no transporte:\n${checkinUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSaveSeat = (regId: string) => {
    updateBoardingStatus(regId, registrations.find(r => r.id === regId)?.boardingStatus || 'aguardando', {
      seatNumber: seatInputValue.trim(),
    });
    setEditingSeatRegId(null);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    const newSession = createBoardingSession(trip.id, {
      title: sessionTitle.trim(),
      transportType: sessionTransport.trim(),
      location: sessionLocation.trim() || undefined,
      scheduledTime: sessionTime.trim() || undefined,
      setAsActive: true,
    });

    setSelectedSessionId(newSession.id);
    setSessionTitle('');
    setSessionTransport('Ônibus Executivo');
    setSessionLocation('');
    setSessionTime('');
    setIsNewSessionModalOpen(false);
  };

  const handleSelectQuickSuggestion = (sug: typeof QUICK_SESSION_SUGGESTIONS[0]) => {
    setSessionTitle(sug.title);
    setSessionTransport(sug.transport);
    setSessionLocation(sug.location);
  };

  const handleUpdatePassengerStatus = (regId: string, newStatus: BoardingStatus) => {
    if (currentSession) {
      updateSessionPassengerStatus(trip.id, currentSession.id, regId, newStatus, false);
    } else {
      updateBoardingStatus(regId, newStatus);
    }
  };

  const handleMarkAllBoarded = () => {
    if (window.confirm(`Deseja marcar todos os ${waitingCount} passageiros aguardando como EMBARCADOS nesta conferência?`)) {
      confirmedRegs.forEach(r => {
        if (getPassengerRecord(r.id).status === 'aguardando') {
          handleUpdatePassengerStatus(r.id, 'embarcou');
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Boarding Sessions Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Bus className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Lista de Embarque & Conferência no Transporte
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Crie chamadas de embarque dinâmicas para cada atividade da viagem (saídas, passeios, retorno de almoço e paradas).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              <span>+ Nova Chamada de Embarque</span>
            </button>

            <button
              onClick={handleCopyCheckinLink}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareCheckinWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setPublicCheckinSlug(trip.slug)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Smartphone className="h-4 w-4" />
              <span>Abrir no Celular</span>
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              title="Imprimir Manifesto de Embarque"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ON-DEMAND SESSIONS SELECTOR BAR */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-orange-600" />
              <span>Chamadas de Embarque da Viagem ({sessions.length})</span>
            </span>

            {activeSession && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Chamada Ativa: {activeSession.title}</span>
              </span>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center space-y-2">
              <p className="text-xs text-slate-600">
                Nenhuma conferência avulsa criada ainda. Crie uma chamada sempre que o grupo for entrar no ônibus ou embarcação para acompanhar quem deu OK em tempo real!
              </p>
              <button
                onClick={() => setIsNewSessionModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Criar 1ª Conferência de Embarque</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sessions.map(session => {
                const isSelected = selectedSessionId === session.id;
                const recs = session.records || {};
                const sBoarded = confirmedRegs.filter(r => recs[r.id]?.status === 'embarcou').length;
                const sPercent = totalCount > 0 ? Math.round((sBoarded / totalCount) * 100) : 0;

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          {session.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>AO VIVO</span>
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] font-semibold">
                              Encerrada
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-slate-500">
                            {session.transportType}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {session.title}
                        </h4>
                        {session.location && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{session.location}</span>
                          </p>
                        )}
                      </div>

                      {/* Mini session controls */}
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {session.isActive ? (
                          <button
                            onClick={() => closeBoardingSession(trip.id, session.id)}
                            className="rounded-lg bg-amber-100 text-amber-800 p-1 hover:bg-amber-200"
                            title="Encerrar conferência (todos a bordo)"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveBoardingSession(trip.id, session.id)}
                            className="rounded-lg bg-emerald-100 text-emerald-800 p-1 hover:bg-emerald-200"
                            title="Tornar chamada ativa agora"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir conferência "${session.title}"?`)) {
                              deleteBoardingSession(trip.id, session.id);
                              if (selectedSessionId === session.id) {
                                setSelectedSessionId(sessions.find(s => s.id !== session.id)?.id || 'general');
                              }
                            }
                          }}
                          className="rounded-lg text-slate-400 hover:text-rose-600 p-1"
                          title="Excluir conferência"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">A Bordo:</span>
                      <span className="font-bold tabular-nums text-slate-900">
                        {sBoarded}/{totalCount} ({sPercent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Session Progress Bar & Counters */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">
              Conferência Selecionada:{' '}
              <strong className="text-slate-900">
                {currentSession ? currentSession.title : 'Embarque Geral da Viagem'}
              </strong>
            </span>
            <span className="font-bold tabular-nums text-slate-900">
              {boardedCount} de {totalCount} a bordo ({progressPercent}%)
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : progressPercent > 60
                  ? 'bg-orange-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Embarcados</span>
              <span className="text-xl font-black text-emerald-800 tabular-nums">{boardedCount}</span>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Aguardando</span>
              <span className="text-xl font-black text-amber-800 tabular-nums">{waitingCount}</span>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-200/80 p-3 text-center">
              <span className="text-[10px] font-bold uppercase text-rose-700 block">Faltaram</span>
              <span className="text-xl font-black text-rose-800 tabular-nums">{missedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por passageiro ou poltrona..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-orange-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trip.groups && trip.groups.length > 0 && (
            <select
              value={selectedGroupFilter}
              onChange={e => setSelectedGroupFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Todos os Grupos / Famílias</option>
              {trip.groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.type})
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Todos os Status ({totalCount})</option>
            <option value="embarcou">Apenas Embarcados ({boardedCount})</option>
            <option value="aguardando">Aguardando no Ponto ({waitingCount})</option>
            <option value="faltou">Faltantes ({missedCount})</option>
          </select>

          {waitingCount > 0 && (
            <button
              onClick={handleMarkAllBoarded}
              className="rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              ✓ Marcar Restantes como Embarcados
            </button>
          )}
        </div>
      </div>

      {/* Passenger Boarding Table */}
      {filteredRegs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Nenhum passageiro encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Poltrona</th>
                <th className="py-3 px-4">Passageiro</th>
                <th className="py-3 px-3">WhatsApp / Contato</th>
                <th className="py-3 px-3">Status nesta Conferência</th>
                <th className="py-3 px-3">Origem do Check-in</th>
                <th className="py-3 px-4 text-center">Marcar Presença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegs.map(reg => {
                const traveler = travelers.find(t => t.id === reg.travelerId);
                const record = getPassengerRecord(reg.id);
                const currentStatus = record.status;

                return (
                  <tr
                    key={reg.id}
                    className={`transition-colors ${
                      currentStatus === 'embarcou'
                        ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                        : currentStatus === 'faltou'
                        ? 'bg-rose-50/30 hover:bg-rose-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Poltrona / Assento */}
                    <td className="py-3 px-3 text-center">
                      {editingSeatRegId === reg.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={4}
                            value={seatInputValue}
                            onChange={e => setSeatInputValue(e.target.value)}
                            className="w-12 rounded-lg border border-orange-500 p-1 text-center font-bold text-xs"
                            placeholder="01"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveSeat(reg.id)}
                            className="text-xs text-emerald-600 font-bold"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingSeatRegId(reg.id);
                            setSeatInputValue(reg.seatNumber || '');
                          }}
                          className="font-mono font-bold text-slate-700 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 px-2 py-1 rounded-md"
                          title="Clique para editar poltrona"
                        >
                          {reg.seatNumber || '--'}
                        </button>
                      )}
                    </td>

                    {/* Nome do Passageiro */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900">{traveler?.fullName}</span>
                        {reg.groupId && (() => {
                          const grp = trip.groups?.find(g => g.id === reg.groupId);
                          if (!grp) return null;
                          return (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold border border-blue-200/60">
                              {grp.name} {reg.roomType ? `· ${reg.roomType}` : ''}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        CPF: {traveler ? maskCPF(traveler.cpf) : '-'} · RG: {traveler?.rg || 'Não inf.'}
                      </div>
                    </td>

                    {/* WhatsApp */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">
                          {traveler ? formatPhoneBR(traveler.phone) : '-'}
                        </span>
                        {traveler?.phone && currentStatus === 'aguardando' && (
                          <a
                            href={buildWhatsAppLink(
                              traveler.phone,
                              `Olá ${traveler.fullName}, a equipe Raon System está aguardando você para o embarque (${currentSession ? currentSession.title : trip.departureLocation})! Já está no transporte?`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-200"
                            title="Cobrar presença no WhatsApp"
                          >
                            Avisar
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {currentStatus === 'embarcou' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Embarcou</span>
                        </span>
                      ) : currentStatus === 'faltou' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <XCircle className="h-3 w-3" />
                          <span>Faltou</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                          <Clock className="h-3 w-3" />
                          <span>Aguardando</span>
                        </span>
                      )}
                    </td>

                    {/* Origem do Check-in */}
                    <td className="py-3 px-3 text-[11px]">
                      {currentStatus === 'embarcou' ? (
                        record.selfChecked ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Auto Check-in (CPF)</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Marcado pelo Guia</span>
                        )
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                      {record.confirmedAt && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(record.confirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>

                    {/* Quick Action Toggles */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleUpdatePassengerStatus(reg.id, 'embarcou')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            currentStatus === 'embarcou'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          Embarcou
                        </button>

                        <button
                          onClick={() => handleUpdatePassengerStatus(reg.id, 'aguardando')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                            currentStatus === 'aguardando'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'border border-amber-300 text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          Aguardando
                        </button>

                        <button
                          onClick={() => handleUpdatePassengerStatus(reg.id, 'faltou')}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                            currentStatus === 'faltou'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          Faltou
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

      {/* CREATE NEW BOARDING SESSION MODAL */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Bus className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nova Chamada de Embarque
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crie uma lista de conferência agora para os passageiros darem OK ao entrar.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewSessionModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Sugestões Rápidas de Momentos da Viagem:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SESSION_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectQuickSuggestion(sug)}
                    className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors text-left"
                  >
                    {sug.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título da Conferência / Momento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Retorno do Passeio de Barco - Entrando no Ônibus"
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transporte / Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ônibus Leito, Catamarã, Van"
                    value={sessionTransport}
                    onChange={e => setSessionTransport(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Local de Embarque
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Estacionamento do Píer, Restaurante"
                    value={sessionLocation}
                    onChange={e => setSessionLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 font-medium">
                💡 Esta chamada será <strong>ativada imediatamente</strong>. O link de check-in que os passageiros acessam com CPF passará a registrar a presença diretamente nesta atividade!
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-2xs"
                >
                  Criar & Ativar Chamada Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
