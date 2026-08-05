'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAdminUser } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminDetailTable, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, formatDashboardCurrency, formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminUserDetail } from '@/types/AdminUserDetail';

export default function AdminUserDetailPage() {
  const userId = useParams<{ userId: string }>().userId;
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getAdminUser(Number(userId))
      .then((result) => { setUser(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !user) return <AdminDetailError message={error ?? 'User not found.'} backHref="/dashboard/admin/users" />;

  const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
  const roles = [
    user.is_superuser ? 'admin' : null,
    user.is_staff && !user.is_superuser ? 'staff' : null,
    user.role === 'florist' ? 'florist' : user.role === 'affiliate' ? 'affiliate' : null,
  ].filter((role): role is string => Boolean(role));
  if (roles.length === 0) roles.push('customer');

  return (
    <AdminDetailPage
      title={name}
      description={user.email}
      backHref="/dashboard/admin/users"
      backLabel="Back to users"
    >
      <AdminDetailSection title="Account" className="xl:col-span-2">
        <AdminDetailGrid className="lg:grid-cols-3">
          <AdminDetailField label="First name" value={user.first_name} />
          <AdminDetailField label="Last name" value={user.last_name} />
          <AdminDetailField label="Email" value={user.email} />
          <AdminDetailField label="Joined" value={formatDashboardDateLong(user.date_joined)} />
          <AdminDetailField label="Status" value={<DashboardStatusPill status={user.is_active ? 'active' : 'inactive'} />} />
          <AdminDetailField
            label="Roles"
            value={<div className="flex flex-wrap gap-1.5">{roles.map((role) => <DashboardStatusPill key={role} status={role} />)}</div>}
          />
          <AdminDetailField label="Referred by" value={user.referred_by} />
          <AdminDetailField label="Stripe customer ID" value={user.stripe_customer_id} mono />
          <AdminDetailField label="Deleted at" value={user.deleted_at ? formatDashboardDateLong(user.deleted_at) : null} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection
        title="Orders"
        description={`${user.orders.length} ${user.orders.length === 1 ? 'order' : 'orders'} matched on this email address`}
        className="xl:col-span-2"
      >
        <AdminDetailTable
          headers={['Order', 'Recipient', 'Total', 'Status', 'Created', 'Action']}
          empty={user.orders.length === 0}
          emptyMessage="No orders were placed with this email address."
          minWidth={820}
        >
          {user.orders.map((order) => {
            const recipient = [order.recipient_first_name, order.recipient_last_name].filter(Boolean).join(' ');
            return (
              <TableRow key={order.id} className="border-slate-100 hover:bg-slate-50">
                <TableCell className="font-medium text-slate-900">
                  {order.order_type === 'recurring' ? 'Subscription' : 'One-off'} #{order.id}
                </TableCell>
                <TableCell className="text-slate-700">{recipient || '—'}</TableCell>
                <TableCell className="font-semibold text-slate-950">{formatDashboardCurrency(order.total_amount)}</TableCell>
                <TableCell><DashboardStatusPill status={order.status} /></TableCell>
                <TableCell className="text-slate-600">{formatDashboardDateLong(order.created_at)}</TableCell>
                <TableCell className="text-right">
                  <AdminInlineLink href={`/dashboard/admin/orders/${order.id}`}>View order</AdminInlineLink>
                </TableCell>
              </TableRow>
            );
          })}
        </AdminDetailTable>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
