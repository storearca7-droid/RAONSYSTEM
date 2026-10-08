import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Heart,
  Home,
  UserPlus,
  Bed,
  Check,
  Edit2,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Trip, TripCompanionGroup } from '../../../types';
import { formatBRL, formatPhoneBR } from '../../../lib/utils';

interface TripGroupsTabProps {
  trip: Trip;
}

export const TripGroupsTab: React.FC<TripGroupsTabProps> = ({ trip }) => {
  const {
    travelers,
    registrations,
    payments,
    addCompanionGroup,
    deleteCompanionGroup,
    assignTravelerToGroup,
  } = useApp();

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<TripCompanionGroup['type']>('familia');
  const [roomNotes, setRoomNotes] = useState('');
  const [groupNotes, setGroupNotes] = useState('');

  // Assign traveler modal
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<TripCompanionGroup | null>(null);

  const groups = trip.groups || [];
  const tripRegs = registrations.filter(r => r.tripId === trip.id && r.status !== 'cancelled');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    addCompanionGroup(trip.id, {
      tripId: trip.id,
      name: groupName.trim(),
      type: groupType,
      roomNotes: roomNotes.trim() || undefined,
      notes: groupNotes.trim() || undefined,
    });

    setGroupName('');
    setRoomNotes('');
    setGroupNotes('');
    setIsCreatingGroup(false);
  };

  const getGroupBadge = (type: TripCompanionGroup['type']) => {
    switch (type) {
      case 'casal':
        return (
          <span className="rounded-md bg-pink-100 text-pink-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>Casal</span>
          </span>
        );
      case 'familia':
        return (
          <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <Home className="h-3 w-3" />
            <span>Família</span>
          </span>
        );
      case 'amigos':
        return (
          <span className="rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>Amigos</span>
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-slate-100 text-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase">
            Grupo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Users className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Grupos de Acompanhantes, Casais & Famílias
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Organize quem viaja junto para facilitar a alocação de quartos no hotel, assentos vizinhos no transporte e controle conjunto de pagamentos.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingGroup(!isCreatingGroup)}
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Criar Grupo</span>
        </button>
      </div>

      {/* Create Group Form */}
      {isCreatingGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-xs space-y-3 animate-in fade-in"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950">
            Novo Grupo / Família / Casal
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Grupo / Família *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Família Albuquerque, Casal Bruno & Carla, Amigos Recife"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Relação *
              </label>
              <select
                value={groupType}
                onChange={e => setGroupType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-hidden"
              >
                <option value="familia">Família</option>
                <option value="casal">Casal</option>
                <option value="amigos">Grupo de Amigos</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alocação de Quarto no Hotel / Pousada
              </label>
              <input
                type="text"
                placeholder="Ex: Apartamento Triplo Frente Mar / Suíte Casal Cama King"
                value={roomNotes}
                onChange={e => setRoomNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações de Assento / Outras
              </label>
              <input
                type="text"
                placeholder="Ex: Poltronas 11 e 12 juntas"
                value={groupNotes}
                onChange={e => setGroupNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Salvar Grupo
            </button>
          </div>
        </form>
      )}

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Nenhum grupo de acompanhantes criado ainda. Crie grupos para organizar quartos e assentos conjuntos.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map(grp => {
            const groupMembers = tripRegs.filter(r => r.groupId === grp.id);

            const totalContracted = groupMembers.reduce((sum, r) => sum + r.effectiveDue, 0);
            const totalPaid = groupMembers.reduce((sum, r) => {
              const regPays = payments.filter(p => p.registrationId === r.id && !p.refunded);
              return sum + regPays.reduce((pSum, p) => pSum + p.amount, 0);
            }, 0);

            return (
              <div
                key={grp.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {getGroupBadge(grp.type)}
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {groupMembers.length} {groupMembers.length === 1 ? 'viajante' : 'viajantes'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{grp.name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedGroupForAssign(grp)}
                        className="rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 p-1.5 text-xs font-bold"
                        title="Vincular / Gerenciar Viajantes no Grupo"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o grupo "${grp.name}"?`)) {
                            deleteCompanionGroup(trip.id, grp.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors"
                        title="Excluir grupo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Room / Bed Allocation Note */}
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-xs flex items-center gap-2 text-slate-700">
                    <Bed className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Quarto: <strong>{grp.roomNotes || 'A definir na pousada'}</strong>
                    </span>
                  </div>

                  {/* Members list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Membros do Grupo:
                    </span>
                    {groupMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nenhum passageiro vinculado a este grupo ainda.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {groupMembers.map(reg => {
                          const traveler = travelers.find(t => t.id === reg.travelerId);

                          return (
                            <div
                              key={reg.id}
                              className="flex items-center justify-between rounded-xl bg-slate-50/70 p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                  {reg.seatNumber ? `Polt. ${reg.seatNumber}` : 'S/ poltrona'}
                                </span>
                                <span className="font-bold text-slate-900 truncate">
                                  {traveler?.fullName}
                                </span>
                              </div>

                              <button
                                onClick={() => assignTravelerToGroup(reg.id, undefined)}
                                className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                                title="Desvincular do grupo"
                              >
                                Desvincular
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Group Balance */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase text-slate-400 font-medium">Contratado Grupo</span>
                    <p className="font-bold text-slate-800 tabular-nums">{formatBRL(totalContracted)}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase text-slate-400 font-medium">Quitado Grupo</span>
                    <p className="font-bold text-emerald-600 tabular-nums">{formatBRL(totalPaid)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: VINCULAR VIAJANTE AO GRUPO */}
      {selectedGroupForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900">
                  Vincular Viajantes ao Grupo
                </h4>
                <p className="text-xs text-orange-600 font-semibold">{selectedGroupForAssign.name}</p>
              </div>
              <button
                onClick={() => setSelectedGroupForAssign(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione quais viajantes confirmados fazem parte deste grupo familiar/casal:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {tripRegs.map(reg => {
                const traveler = travelers.find(t => t.id === reg.travelerId);
                const isMember = reg.groupId === selectedGroupForAssign.id;

                return (
                  <div
                    key={reg.id}
                    className="pt-2 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{traveler?.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {reg.seatNumber ? `Poltrona ${reg.seatNumber}` : 'Sem poltrona atribuída'}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        assignTravelerToGroup(
                          reg.id,
                          isMember ? undefined : selectedGroupForAssign.id
                        )
                      }
                      className={`rounded-xl px-3 py-1.5 font-bold text-xs transition-colors ${
                        isMember
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {isMember ? 'Remover' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedGroupForAssign(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
