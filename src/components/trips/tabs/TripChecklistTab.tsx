import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
  Bus,
  Building,
  Users,
  FileText,
  Gift,
  DollarSign,
  Compass,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Trip, TripChecklistItem } from '../../../types';
import { formatDateBR } from '../../../lib/utils';

interface TripChecklistTabProps {
  trip: Trip;
}

const DEFAULT_SUGGESTIONS = [
  { title: 'Ônibus/Transporte executivo contratado e revisado', category: 'transporte' as const },
  { title: 'Hotel/Pousada confirmado com relação de quartos', category: 'hospedagem' as const },
  { title: 'Lista de passageiros cadastrados e emitida para ANTT/DER', category: 'passageiros' as const },
  { title: 'Documentos e RGs de todos os viajantes recebidos', category: 'documentos' as const },
  { title: 'Entregas de brindes, copos e mimos preparadas', category: 'brindes' as const },
  { title: 'Pagamentos dos fornecedores e parceiros efetuados', category: 'financeiro' as const },
  { title: 'Roteiro finalizado e entregue aos guias de turismo', category: 'roteiro' as const },
  { title: 'Apólice de seguro viagem emitida para todos', category: 'financeiro' as const },
  { title: 'Kit de primeiros socorros e lanches de bordo abastecidos', category: 'brindes' as const },
];

export const TripChecklistTab: React.FC<TripChecklistTabProps> = ({ trip }) => {
  const { toggleChecklistItem, addChecklistItem, deleteChecklistItem } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TripChecklistItem['category']>('transporte');
  const [newNotes, setNewNotes] = useState('');

  const items = trip.checklist || [];
  const completedCount = items.filter(i => i.isCompleted).length;
  const totalCount = items.length;
  const prepPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addChecklistItem(trip.id, {
      tripId: trip.id,
      title: newTitle.trim(),
      category: newCategory,
      isCompleted: false,
      notes: newNotes.trim() || undefined,
    });

    setNewTitle('');
    setNewNotes('');
    setIsAdding(false);
  };

  const handleAddSuggestion = (sug: typeof DEFAULT_SUGGESTIONS[0]) => {
    const exists = items.some(i => i.title.toLowerCase() === sug.title.toLowerCase());
    if (exists) {
      alert('Este item já está presente no checklist.');
      return;
    }
    addChecklistItem(trip.id, {
      tripId: trip.id,
      title: sug.title,
      category: sug.category,
      isCompleted: false,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transporte':
        return <Bus className="h-3.5 w-3.5 text-blue-600" />;
      case 'hospedagem':
        return <Building className="h-3.5 w-3.5 text-emerald-600" />;
      case 'passageiros':
        return <Users className="h-3.5 w-3.5 text-purple-600" />;
      case 'documentos':
        return <FileText className="h-3.5 w-3.5 text-amber-600" />;
      case 'brindes':
        return <Gift className="h-3.5 w-3.5 text-pink-600" />;
      case 'financeiro':
        return <DollarSign className="h-3.5 w-3.5 text-emerald-600" />;
      case 'roteiro':
        return <Compass className="h-3.5 w-3.5 text-orange-600" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Preparation Progress */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Checklist Pré-Viagem & Prontidão
            </h3>
            <p className="text-xs text-slate-500">
              Controle tudo o que precisa estar 100% pronto antes do dia do embarque.
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Adicionar Tarefa</span>
          </button>
        </div>

        {/* Big Preparation Percentage Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Índice de Preparação da Viagem</span>
            <span className="text-sm font-black tabular-nums text-slate-900">
              {completedCount} de {totalCount} concluídos ({prepPercent}%)
            </span>
          </div>

          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                prepPercent === 100
                  ? 'bg-emerald-500'
                  : prepPercent >= 70
                  ? 'bg-blue-600'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${prepPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {prepPercent === 100
                ? '🎉 Tudo pronto! Viagem liberada para o embarque com segurança.'
                : 'Atenção aos itens pendentes antes da saída do transporte.'}
            </span>
            <span className="font-semibold text-slate-600">
              {totalCount - completedCount} pendências
            </span>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <form
          onSubmit={handleAddCustom}
          className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 shadow-xs space-y-3 animate-in fade-in"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950">
            Nova Tarefa no Checklist
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                placeholder="Descrição da tarefa (ex: Kit de lanches encomendado)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:border-orange-500 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-hidden"
              >
                <option value="transporte">Transporte</option>
                <option value="hospedagem">Hospedagem</option>
                <option value="passageiros">Passageiros</option>
                <option value="documentos">Documentos</option>
                <option value="brindes">Brindes & Mimos</option>
                <option value="financeiro">Financeiro</option>
                <option value="roteiro">Roteiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                placeholder="Observações ou responsável (opcional)"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs focus:outline-hidden"
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
              className="rounded-xl bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
            >
              Salvar Tarefa
            </button>
          </div>
        </form>
      )}

      {/* Quick Suggestions Pills */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Adicionar Itens Essenciais Recomendados:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_SUGGESTIONS.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddSuggestion(sug)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors"
            >
              + {sug.title}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs divide-y divide-slate-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum item adicionado ao checklist ainda. Clique em uma das sugestões acima para começar!
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className={`flex items-start justify-between p-4 transition-colors ${
                item.isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleChecklistItem(trip.id, item.id, !item.isCompleted)}
                  className="mt-0.5 text-slate-400 hover:text-orange-600 transition-colors shrink-0"
                >
                  {item.isCompleted ? (
                    <CheckSquare className="h-5 w-5 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-300" />
                  )}
                </button>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {getCategoryIcon(item.category)}
                      <span>{item.category}</span>
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        item.isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 font-bold'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 pl-1">{item.notes}</p>
                  )}

                  {item.completedAt && (
                    <p className="text-[10px] text-emerald-700 font-medium pl-1">
                      Concluído em {formatDateBR(item.completedAt)}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteChecklistItem(trip.id, item.id)}
                className="p-1 text-slate-300 hover:text-rose-600 transition-colors shrink-0"
                title="Excluir item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
