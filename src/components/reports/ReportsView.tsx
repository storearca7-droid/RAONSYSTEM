import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  Download,
  Filter,
  Users,
  Compass,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  formatBRL,
  formatDateBR,
  formatDateRangeBR,
  calculateTripOccupancy,
  calculateTripFinances,
} from '../../lib/utils';

export const ReportsView: React.FC = () => {
  const { trips, registrations, payments, expenses, settings } = useApp();
  const [selectedTripId, setSelectedTripId] = useState<string>('all');

  const selectedTrip = trips.find(t => t.id === selectedTripId);

  // Filtered trips list
  const activeTrips = selectedTripId === 'all' ? trips : trips.filter(t => t.id === selectedTripId);

  // Consolidated aggregation
  const totalCapacity = activeTrips.reduce((acc, t) => acc + t.capacity, 0);
  const totalConfirmed = registrations.filter(
    r => (selectedTripId === 'all' || r.tripId === selectedTripId) && r.status === 'confirmed'
  ).length;
  const totalPending = registrations.filter(
    r => (selectedTripId === 'all' || r.tripId === selectedTripId) && r.status === 'pending'
  ).length;
  const totalWaitlist = registrations.filter(
    r => (selectedTripId === 'all' || r.tripId === selectedTripId) && r.status === 'waitlist'
  ).length;

  const occupiedSlots = totalConfirmed + totalPending;
  const availableSlots = Math.max(0, totalCapacity - occupiedSlots);
  const overallOccupancyPercent =
    totalCapacity > 0 ? Math.min(100, Math.round((occupiedSlots / totalCapacity) * 100)) : 0;

  // Financial aggregation
  const relevantRegs = registrations.filter(
    r => (selectedTripId === 'all' || r.tripId === selectedTripId) && r.status !== 'cancelled'
  );
  const totalExpectedRevenue = relevantRegs.reduce((acc, r) => acc + (r.effectiveDue || 0), 0);

  const relevantPayments = payments.filter(
    p => (selectedTripId === 'all' || p.tripId === selectedTripId) && !p.refunded
  );
  const totalReceivedRevenue = relevantPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingRevenue = Math.max(0, totalExpectedRevenue - totalReceivedRevenue);

  const relevantExpenses = expenses.filter(
    e => selectedTripId === 'all' || e.tripId === selectedTripId
  );
  const totalExpensesBudgeted = relevantExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPaid = relevantExpenses.filter(e => e.isPaid).reduce((acc, e) => acc + e.amount, 0);

  const netResult = totalReceivedRevenue - totalExpensesPaid;

  // Travelers financial states
  const fullyPaidCount = relevantRegs.filter(r => r.financialStatus === 'paid').length;
  const partialPaidCount = relevantRegs.filter(r => r.financialStatus === 'partial').length;
  const unpaidCount = relevantRegs.filter(r => r.financialStatus === 'unpaid').length;

  // Payment methods breakdown
  const paymentMethodCounts: Record<string, number> = {};
  relevantPayments.forEach(p => {
    paymentMethodCounts[p.paymentMethod] = (paymentMethodCounts[p.paymentMethod] || 0) + p.amount;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Viagem',
      'Destino',
      'Capacidade',
      'Confirmados',
      'Pendentes',
      'Livres',
      'Ocupacao (%)',
      'Receita Prevista (R$)',
      'Receita Realizada (R$)',
      'Despesas Pagas (R$)',
      'Lucro Realizado (R$)',
    ];

    const rows = activeTrips.map(t => {
      const occ = calculateTripOccupancy(t, registrations);
      const fin = calculateTripFinances(t, registrations, payments, expenses);

      return [
        `"${t.name}"`,
        `"${t.destination}"`,
        occ.totalCapacity,
        occ.confirmed,
        occ.pending,
        occ.availableSlots,
        `${occ.occupancyPercent}%`,
        fin.totalEffectiveDue.toFixed(2),
        fin.totalReceived.toFixed(2),
        fin.expensesPaid.toFixed(2),
        fin.realizedProfit.toFixed(2),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_dinho_tour_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Filter & Print bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Relatórios Executivos & Ocupação
          </h2>
          <p className="text-xs text-slate-500">
            Exportação em CSV e impressão oficial com balanço de vagas e finanças
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Todas as Viagens (Consolidado)</option>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-8">
        {/* Report Official Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white font-extrabold text-xl shadow-xs">
              DT
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                DINHO TOUR — Relatório Gerencial
              </h1>
              <p className="text-xs text-slate-500">
                {selectedTrip ? `Viagem: ${selectedTrip.name}` : 'Consolidação Geral de Todas as Viagens'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>CNPJ: {settings.cnpj}</div>
            <div>Agência Raon System</div>
          </div>
        </div>

        {/* Section 1: Balanço de Ocupação & Vagas */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            1. Balanço Operacional & Taxa de Ocupação
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Capacidade Total</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{totalCapacity}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Confirmadas</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">{totalConfirmed}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Aguardando Reserva</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">{totalPending}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Vagas Livres</span>
              <p className="mt-1 text-2xl font-bold text-cyan-600 tabular-nums">{availableSlots}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Lista de Espera</span>
              <p className="mt-1 text-2xl font-bold text-purple-600 tabular-nums">{totalWaitlist}</p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Taxa Geral de Ocupação das Vagas</span>
              <span className="tabular-nums font-bold">{overallOccupancyPercent}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full transition-all"
                style={{ width: `${overallOccupancyPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Balanço Financeiro & Resultado */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            2. Demonstração de Resultado Financeiro (DRE Sintético)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Receita Prevista</span>
              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {formatBRL(totalExpectedRevenue)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Receita Realizada</span>
              <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums">
                {formatBRL(totalReceivedRevenue)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Despesas Pagas</span>
              <p className="mt-1 text-xl font-bold text-slate-800 tabular-nums">
                {formatBRL(totalExpensesPaid)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 bg-linear-to-br from-slate-900 to-slate-800 text-white">
              <span className="text-[10px] font-semibold text-slate-300 uppercase">Lucro Realizado</span>
              <p className="mt-1 text-xl font-black text-white tabular-nums">
                {formatBRL(netResult)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Status dos Viajantes</h4>
              <div className="flex justify-between">
                <span className="text-slate-600">Totalmente Quitado:</span>
                <span className="font-bold text-emerald-600">{fullyPaidCount} viajantes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pagamento Parcial (Entrada):</span>
                <span className="font-bold text-amber-600">{partialPaidCount} viajantes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Não Pago / Em Aberto:</span>
                <span className="font-bold text-rose-600">{unpaidCount} viajantes</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900">Arrecadação por Meio de Pagamento</h4>
              {Object.entries(paymentMethodCounts).map(([method, val]) => (
                <div key={method} className="flex justify-between">
                  <span className="text-slate-600">{method}:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatBRL(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Tabela Detalhada por Viagem */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            3. Demonstrativo Detalhado por Viagem
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Viagem</th>
                  <th className="py-2.5 px-2 text-center">Vagas</th>
                  <th className="py-2.5 px-2 text-center">Confirmados</th>
                  <th className="py-2.5 px-2 text-center">Ocupação</th>
                  <th className="py-2.5 px-3 text-right">Receita Prevista</th>
                  <th className="py-2.5 px-3 text-right">Recebido</th>
                  <th className="py-2.5 px-3 text-right">Despesas</th>
                  <th className="py-2.5 px-3 text-right">Lucro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTrips.map(trip => {
                  const tripOcc = calculateTripOccupancy(trip, registrations);
                  const tripFin = calculateTripFinances(trip, registrations, payments, expenses);

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {trip.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {trip.destination}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center tabular-nums">{tripOcc.totalCapacity}</td>
                      <td className="py-2.5 px-2 text-center tabular-nums font-semibold text-emerald-600">
                        {tripOcc.confirmed}
                      </td>
                      <td className="py-2.5 px-2 text-center tabular-nums">
                        {tripOcc.occupancyPercent}%
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatBRL(tripFin.totalEffectiveDue)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-600">
                        {formatBRL(tripFin.totalReceived)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                        {formatBRL(tripFin.expensesPaid)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                          tripFin.realizedProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
                        }`}
                      >
                        {formatBRL(tripFin.realizedProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer sign */}
        <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-400">
          <div>
            Relatório gerado exclusivamente para a administração da Raon System.
          </div>
          <div className="text-right">
            Raon System — Gestão de Viagens
          </div>
        </div>
      </div>
    </div>
  );
};
