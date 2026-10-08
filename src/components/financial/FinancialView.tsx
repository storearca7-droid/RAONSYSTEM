import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Receipt,
  AlertCircle,
  Filter,
  CheckCircle2,
  Calendar,
  Download,
  CreditCard,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatBRL, formatDateBR } from '../../lib/utils';
import { PaymentMethod, FinancialStatus } from '../../types';

export const FinancialView: React.FC = () => {
  const { trips, registrations, payments, expenses, travelers } = useApp();

  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | FinancialStatus>('all');

  // Filtered registrations
  const filteredRegs = registrations.filter(r => {
    if (r.status === 'cancelled') return false;
    const matchTrip = selectedTripFilter === 'all' || r.tripId === selectedTripFilter;
    const matchStatus = selectedStatusFilter === 'all' || r.financialStatus === selectedStatusFilter;
    return matchTrip && matchStatus;
  });

  // Filtered payments (preventing double counting)
  const activePayments = payments.filter(p => {
    if (p.refunded) return false;
    if (selectedTripFilter !== 'all' && p.tripId !== selectedTripFilter) return false;
    return true;
  });

  // Filtered expenses
  const activeExpenses = expenses.filter(e => {
    if (selectedTripFilter !== 'all' && e.tripId !== selectedTripFilter) return false;
    return true;
  });

  // Consolidated Financial Totals
  const totalContracted = filteredRegs.reduce((acc, r) => acc + (r.effectiveDue || 0), 0);
  const totalReceived = activePayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = Math.max(0, totalContracted - totalReceived);

  const overdueRegs = filteredRegs.filter(r => r.financialStatus === 'overdue');
  const totalOverdue = overdueRegs.reduce((acc, r) => {
    const paidForReg = activePayments
      .filter(p => p.registrationId === r.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return acc + Math.max(0, r.effectiveDue - paidForReg);
  }, 0);

  const totalExpensesPlanned = activeExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPaid = activeExpenses.filter(e => e.isPaid).reduce((acc, e) => acc + e.amount, 0);

  const netRealized = totalReceived - totalExpensesPaid;
  const netEstimated = totalContracted - totalExpensesPlanned;

  // Breakdown by Payment Method
  const paymentMethodBreakdown: Record<string, number> = {};
  activePayments.forEach(p => {
    paymentMethodBreakdown[p.paymentMethod] = (paymentMethodBreakdown[p.paymentMethod] || 0) + p.amount;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Consolidação Financeira da Agência
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhe receitas, saldos pendentes, despesas e margem operacional real
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Trip Selector */}
          <select
            value={selectedTripFilter}
            onChange={e => setSelectedTripFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Todas as Viagens</option>
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-hidden"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Totalmente Pagos</option>
            <option value="partial">Parcialmente Pagos</option>
            <option value="unpaid">Não Pagos</option>
            <option value="overdue">Atrasados</option>
          </select>
        </div>
      </div>

      {/* 6 Key Financial Indicator Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Receita Prevista
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
            {formatBRL(totalContracted)}
          </p>
          <span className="text-[11px] text-slate-500">{filteredRegs.length} viajantes</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Recebido em Caixa
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-600 tabular-nums">
            {formatBRL(totalReceived)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">
            {totalContracted > 0 ? Math.round((totalReceived / totalContracted) * 100) : 0}% arrecadado
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Saldo a Receber
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-amber-600 tabular-nums">
            {formatBRL(totalPending)}
          </p>
          <span className="text-[11px] text-slate-500">Parcelas pendentes</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Valores Atrasados
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-rose-600 tabular-nums">
            {formatBRL(totalOverdue)}
          </p>
          <span className="text-[11px] text-rose-700 font-medium">
            {overdueRegs.length} com pendência
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Despesas Pagas
          </span>
          <p className="mt-1 text-lg sm:text-xl font-bold text-slate-800 tabular-nums">
            {formatBRL(totalExpensesPaid)}
          </p>
          <span className="text-[11px] text-slate-500">De {formatBRL(totalExpensesPlanned)} orçadas</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs bg-linear-to-br from-slate-900 to-slate-800 text-white">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
            Resultado Líquido
          </span>
          <p className="mt-1 text-lg sm:text-xl font-black text-white tabular-nums">
            {formatBRL(netRealized)}
          </p>
          <span className="text-[11px] text-orange-300 font-medium">Caixa consolidado</span>
        </div>
      </div>

      {/* Distribution by Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Formas de Pagamento</h3>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {Object.keys(paymentMethodBreakdown).length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum pagamento registrado.</p>
            ) : (
              Object.entries(paymentMethodBreakdown).map(([method, amount]) => {
                const percent = totalReceived > 0 ? Math.round((amount / totalReceived) * 100) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{method}</span>
                      <span className="tabular-nums font-bold text-slate-900">
                        {formatBRL(amount)} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Financial Flow summary per trip */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Desempenho por Viagem</h3>
            <span className="text-xs text-slate-500">Receitas vs Despesas</span>
          </div>

          <div className="space-y-3">
            {trips.map(t => {
              const tripRegs = registrations.filter(r => r.tripId === t.id && r.status !== 'cancelled');
              const tripContracted = tripRegs.reduce((acc, r) => acc + (r.effectiveDue || 0), 0);
              const tripPayments = payments.filter(p => p.tripId === t.id && !p.refunded);
              const tripReceived = tripPayments.reduce((acc, p) => acc + p.amount, 0);
              const tripExp = expenses.filter(e => e.tripId === t.id && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
              const profit = tripReceived - tripExp;

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{t.name}</h4>
                    <p className="text-[11px] text-slate-500">{t.destination}</p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Recebido</span>
                      <span className="font-bold text-emerald-600 tabular-nums">
                        {formatBRL(tripReceived)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Despesas</span>
                      <span className="font-bold text-slate-700 tabular-nums">
                        {formatBRL(tripExp)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Lucro</span>
                      <span
                        className={`font-black tabular-nums ${
                          profit >= 0 ? 'text-blue-600' : 'text-rose-600'
                        }`}
                      >
                        {formatBRL(profit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complete Financial Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Livro de Lançamentos & Inscrições ({filteredRegs.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-2.5 px-3">Viajante</th>
                <th className="py-2.5 px-3">Viagem</th>
                <th className="py-2.5 px-3">Status Financeiro</th>
                <th className="py-2.5 px-3 text-right">Devido</th>
                <th className="py-2.5 px-3 text-right">Pago</th>
                <th className="py-2.5 px-3 text-right">Saldo</th>
                <th className="py-2.5 px-3">Forma Preferencial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegs.map(reg => {
                const traveler = travelers.find(t => t.id === reg.travelerId);
                const trip = trips.find(t => t.id === reg.tripId);
                const regPayments = activePayments.filter(p => p.registrationId === reg.id);
                const paid = regPayments.reduce((acc, p) => acc + p.amount, 0);
                const balance = Math.max(0, reg.effectiveDue - paid);

                return (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {traveler?.fullName || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{trip?.destination || '-'}</td>
                    <td className="py-2.5 px-3">
                      {reg.financialStatus === 'paid' ? (
                        <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                          Quitado
                        </span>
                      ) : reg.financialStatus === 'partial' ? (
                        <span className="rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                          Parcial
                        </span>
                      ) : (
                        <span className="rounded-md bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-semibold">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                      {formatBRL(reg.effectiveDue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 tabular-nums">
                      {formatBRL(paid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                      {formatBRL(balance)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{reg.paymentMethod || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
