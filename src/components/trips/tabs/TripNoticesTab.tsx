import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  Send,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Trip, TripNotice } from '../../../types';
import { formatDateBR } from '../../../lib/utils';

interface TripNoticesTabProps {
  trip: Trip;
}

export const TripNoticesTab: React.FC<TripNoticesTabProps> = ({ trip }) => {
  const { addNotice, deleteNotice, setPublicTripSlug } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<TripNotice['priority']>('importante');

  const notices = trip.notices || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    addNotice(trip.id, {
      tripId: trip.id,
      title: title.trim(),
      message: message.trim(),
      priority,
      isActive: true,
    });

    setTitle('');
    setMessage('');
    setIsAdding(false);
  };

  const getPriorityBadge = (p: TripNotice['priority']) => {
    switch (p) {
      case 'urgente':
        return (
          <span className="rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Urgente</span>
          </span>
        );
      case 'importante':
        return (
          <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Importante</span>
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Informativo</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Bell className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Avisos & Comunicados aos Passageiros
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Publique mudanças de horário, instruções do ponto de encontro e alertas climáticos que aparecem em destaque no link público da viagem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPublicTripSlug(trip.slug)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-orange-600" />
            <span>Ver no Link Público</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Novo Aviso</span>
          </button>
        </div>
      </div>

      {/* Add Notice Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-xs space-y-4 animate-in fade-in"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950">
            Publicar Novo Comunicado Oficial
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título do Comunicado *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mudança de Ponto de Embarque / Chegada Antecipada"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nível de Atenção *
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-hidden"
              >
                <option value="importante">Importante (Destaque Âmbar)</option>
                <option value="urgente">Urgente (Destaque Vermelho)</option>
                <option value="informativo">Informativo (Destaque Azul)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mensagem Completa para os Passageiros *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explique os detalhes, horários e orientações necessárias..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publicar Agora</span>
            </button>
          </div>
        </form>
      )}

      {/* Notices List */}
      <div className="space-y-3">
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
            Nenhum aviso publicado para esta viagem. Clique em "+ Novo Aviso" para alertar os passageiros.
          </div>
        ) : (
          notices.map(notice => (
            <div
              key={notice.id}
              className={`rounded-2xl border p-5 shadow-xs space-y-2 transition-all ${
                notice.priority === 'urgente'
                  ? 'border-rose-200 bg-rose-50/70 text-rose-950'
                  : notice.priority === 'importante'
                  ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                  : 'border-blue-200 bg-blue-50/70 text-blue-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(notice.priority)}
                  <h4 className="font-bold text-sm text-slate-900">{notice.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Publicado em {formatDateBR(notice.publishedAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteNotice(trip.id, notice.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Excluir aviso"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pl-1 whitespace-pre-line">
                {notice.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
