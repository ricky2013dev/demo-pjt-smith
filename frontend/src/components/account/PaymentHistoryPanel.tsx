import React, { useMemo, useState } from 'react';
import type { Account, AccountPayment, AccountPaymentMethod } from './types';
import { describeMethod } from './PaymentSetupForm';

interface PaymentHistoryPanelProps {
  account: Account;
  payments: AccountPayment[];
  /** The method invoices are charged to, named in the summary. */
  paymentMethod: AccountPaymentMethod | null;
}

/** Invoice states, in the order the filter offers them. */
const STATUS_FILTERS = ['all', 'paid', 'pending', 'failed', 'refunded'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  failed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  refunded: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
};

const statusClassName = (status: string) =>
  STATUS_STYLES[status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

const formatCurrency = (amount: string, currency = 'USD') => {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

/** Dates arrive as plain `YYYY-MM-DD`, so they are formatted without a timezone. */
const formatDate = (date: string | null) => {
  if (!date) return '—';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** "Mar 1 – Mar 31, 2026", or a dash for one-off charges that cover no period. */
const formatPeriod = (payment: AccountPayment) => {
  if (!payment.periodStart || !payment.periodEnd) return '—';
  return `${formatDate(payment.periodStart)} – ${formatDate(payment.periodEnd)}`;
};

const PaymentHistoryPanel: React.FC<PaymentHistoryPanelProps> = ({ account, payments, paymentMethod }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const summary = useMemo(() => {
    const total = (rows: AccountPayment[]) => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const thisYear = String(new Date().getFullYear());

    return {
      paidThisYear: total(payments.filter((row) => row.status === 'paid' && row.issuedDate.startsWith(thisYear))),
      outstanding: total(payments.filter((row) => row.status === 'pending' || row.status === 'failed')),
      lastPaid: payments.find((row) => row.status === 'paid') ?? null,
      failedCount: payments.filter((row) => row.status === 'failed').length,
    };
  }, [payments]);

  const visiblePayments = useMemo(
    () => (statusFilter === 'all' ? payments : payments.filter((row) => row.status === statusFilter)),
    [payments, statusFilter]
  );

  const countFor = (status: StatusFilter) =>
    status === 'all' ? payments.length : payments.filter((row) => row.status === status).length;

  const tile = (label: string, value: string, hint: string, tone?: 'warn') => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {tile(
          'Paid this year',
          formatCurrency(String(summary.paidThisYear)),
          `${new Date().getFullYear()} invoices settled`
        )}
        {tile(
          'Outstanding',
          formatCurrency(String(summary.outstanding)),
          summary.failedCount > 0
            ? `${summary.failedCount} failed ${summary.failedCount === 1 ? 'charge' : 'charges'} to retry`
            : 'Invoices not yet paid',
          summary.outstanding > 0 ? 'warn' : undefined
        )}
        {tile(
          'Last payment',
          summary.lastPaid ? formatCurrency(summary.lastPaid.amount, summary.lastPaid.currency) : '—',
          summary.lastPaid ? `${formatDate(summary.lastPaid.paidDate)} · ${describeMethod(paymentMethod)}` : 'No payments yet'
        )}
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">receipt_long</span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Invoices</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Everything billed to {account.name}, newest first.
              </p>
            </div>
          </div>

          {/* Status filter — the counts make an empty result obvious before it is picked */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  aria-pressed={isActive}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {status} ({countFor(status)})
                </button>
              );
            })}
          </div>
        </header>

        {visiblePayments.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {payments.length === 0
              ? 'No invoices have been raised against this clinic yet.'
              : `No ${statusFilter} invoices.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Billing Period</th>
                  <th className="px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3 font-medium">Paid</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 align-top">
                    <td className="px-5 py-3">
                      <span className="block font-medium text-slate-900 dark:text-white">{payment.invoiceNumber}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{payment.description}</span>
                      {payment.failureReason && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <span className="material-symbols-outlined text-sm">error</span>
                          {payment.failureReason}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatPeriod(payment)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(payment.issuedDate)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(payment.paidDate)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {payment.paymentMethod || '—'}
                      {payment.referenceNumber && (
                        <span className="block text-xs text-slate-400 dark:text-slate-500">
                          {payment.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusClassName(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
          Invoices are raised by InSpline against the payment method set up under Payment Setup.
          Contact support to dispute a charge or request a copy of a receipt.
        </p>
      </section>
    </div>
  );
};

export default PaymentHistoryPanel;
