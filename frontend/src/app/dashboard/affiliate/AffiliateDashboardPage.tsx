'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getAffiliateDiscountCodes, getDashboardAccount, getDashboardCommissions, getDashboardPayouts } from '@/api/businessAccounts';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import DashboardOverviewTable from '@/components/dashboard/DashboardOverviewTable';
import DashboardSummary, { DashboardMetric } from '@/components/dashboard/DashboardSummary';
import StripePayoutSetupNotice from '@/components/dashboard/StripePayoutSetupNotice';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { Commission, DashboardAccount, DiscountCode, Payout } from '@/types';

function payoutType(value: Payout['payout_type']): string {
  return value === 'commission' ? 'Commission payout' : 'Fulfillment payout';
}

export default function AffiliateDashboardPage() {
  const [account, setAccount] = useState<DashboardAccount | null>(null);
  const [codes, setCodes] = useState<DiscountCode[]>([]); const [codeCount, setCodeCount] = useState(0);
  const [commissions, setCommissions] = useState<Commission[]>([]); const [commissionCount, setCommissionCount] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]); const [payoutCount, setPayoutCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardAccount(), getAffiliateDiscountCodes({ pageSize: 5 }), getDashboardCommissions({ pageSize: 5 }), getDashboardPayouts({ pageSize: 5 })])
      .then(([dashboard, codePage, commissionPage, payoutPage]) => {
        if (cancelled) return;
        if (dashboard.account_type !== 'affiliate') {
          setError('This dashboard is only available to affiliates.');
          return;
        }
        setAccount(dashboard); setCodes(codePage.results); setCodeCount(codePage.count); setCommissions(commissionPage.results); setCommissionCount(commissionPage.count); setPayouts(payoutPage.results); setPayoutCount(payoutPage.count);
        setError(null);
      })
      .catch((reason) => { if (!cancelled) setError(errorMessage(reason) || 'Failed to load dashboard.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Affiliate dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {account?.business_name || 'Manage discount codes, referral commissions, and payouts.'}
        </p>
      </div>

      {loading ? (
        <section className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-500">Loading dashboard…</span>
        </section>
      ) : error || !account ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error || 'Affiliate account not found.'}
        </section>
      ) : (
        <div className="space-y-6">
          {!account.stripe_connect_onboarding_complete && <StripePayoutSetupNotice />}

          <DashboardSummary description="Current account, referral activity, and earnings.">
            <DashboardMetric label="Account" value={<DashboardStatusPill status={account.status} />} />
            <DashboardMetric label="Active codes" value={account.discount_code_summary.active_codes.toLocaleString('en-AU')} />
            <DashboardMetric label="Code uses" value={account.discount_code_summary.total_uses.toLocaleString('en-AU')} />
            <DashboardMetric label="Earned" value={formatDashboardCurrency(account.commission_summary.total_earned)} />
            <DashboardMetric label="Awaiting approval" value={formatDashboardCurrency(account.commission_summary.total_pending)} />
            <DashboardMetric label="Paid out" value={formatDashboardCurrency(account.payout_summary.total_paid)} />
          </DashboardSummary>

          <DashboardOverviewTable
            title="Discount codes"
            count={codeCount}
            viewAllHref="/dashboard/affiliate/discount-codes"
            viewAllLabel="Manage discount codes"
            headers={['Code', 'Discount', 'Times used', 'Status']}
            empty={codes.length === 0}
            emptyMessage="No discount codes yet."
          >
            {codes.map((code) => (
              <TableRow key={code.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-mono font-semibold tracking-wide text-slate-950">{code.code}</TableCell>
                <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(code.discount_amount)}</TableCell>
                <TableCell className="text-slate-700">{code.total_uses.toLocaleString('en-AU')}</TableCell>
                <TableCell className="text-right"><DashboardStatusPill status={code.is_active ? 'active' : 'inactive'} /></TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <DashboardOverviewTable
            title="Recent commissions"
            count={commissionCount}
            viewAllHref="/dashboard/affiliate/commissions"
            viewAllLabel="View all commissions"
            headers={['Commission', 'Amount', 'Status', 'Created']}
            empty={commissions.length === 0}
            emptyMessage="No commissions yet."
          >
            {commissions.map((commission) => (
              <TableRow key={commission.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-mono font-semibold text-slate-950">#{commission.id}</TableCell>
                <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(commission.amount)}</TableCell>
                <TableCell><DashboardStatusPill status={commission.status} /></TableCell>
                <TableCell className="text-right text-slate-600">{formatDashboardDateLong(commission.created_at)}</TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>

          <DashboardOverviewTable
            title="Recent payouts"
            count={payoutCount}
            viewAllHref="/dashboard/affiliate/payouts"
            viewAllLabel="View all payouts"
            headers={['Payout', 'Type', 'Amount', 'Status', 'Created']}
            empty={payouts.length === 0}
            emptyMessage="No payouts yet."
          >
            {payouts.slice(0, 5).map((payout) => (
              <TableRow key={payout.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-mono font-semibold text-slate-950">#{payout.id}</TableCell>
                <TableCell className="text-slate-700">{payoutType(payout.payout_type)}</TableCell>
                <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(payout.amount)} {payout.currency}</TableCell>
                <TableCell><DashboardStatusPill status={payout.status === 'completed' ? 'paid' : payout.status} label={payout.status === 'completed' ? 'Completed' : undefined} /></TableCell>
                <TableCell className="text-right text-slate-600">{formatDashboardDateLong(payout.created_at)}</TableCell>
              </TableRow>
            ))}
          </DashboardOverviewTable>
        </div>
      )}
    </div>
  );
}
