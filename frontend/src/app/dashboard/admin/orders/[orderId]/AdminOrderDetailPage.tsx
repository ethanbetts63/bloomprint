'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAdminOrderDetail } from '@/api/admin';
import {
  AdminDetailError, AdminDetailField, AdminDetailGrid, AdminDetailLoading, AdminDetailPage,
  AdminDetailSection, AdminDetailTable, AdminInlineLink,
} from '@/components/dashboard/AdminDetail';
import {
  DashboardStatusPill, dashboardLabel, formatDashboardCoordinates, formatDashboardCurrency,
  formatDashboardDateLong,
} from '@/components/dashboard/DashboardData';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/errors';
import type { AdminOrderDetail } from '@/types/AdminOrderDetail';

export default function AdminOrderDetailPage() {
  const orderId = useParams<{ orderId: string }>().orderId;
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    getAdminOrderDetail(orderId)
      .then((result) => { setOrder(result); setError(null); })
      .catch((reason) => setError(errorMessage(reason)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <AdminDetailLoading />;
  if (error || !order) return <AdminDetailError message={error ?? 'Order not found.'} backHref="/dashboard/admin/orders" />;

  const customerName = `${order.customer_first_name} ${order.customer_last_name}`.trim();
  const recipientName = [order.recipient_first_name, order.recipient_last_name].filter(Boolean).join(' ');
  const address = [
    order.recipient_street_address, order.recipient_suburb, order.recipient_city,
    order.recipient_state, order.recipient_postcode, order.recipient_country,
  ].filter(Boolean).join(', ');
  const typeLabel = order.order_type === 'recurring' ? 'Subscription' : 'One-off';

  return (
    <AdminDetailPage
      title={`${typeLabel} order #${order.id}`}
      description={`${customerName} · Created ${formatDashboardDateLong(order.created_at)}`}
      backHref="/dashboard/admin/orders"
      backLabel="Back to orders"
    >
      <AdminDetailSection title="Order details">
        <AdminDetailGrid>
          <AdminDetailField label="Status" value={<DashboardStatusPill status={order.status} />} />
          <AdminDetailField label="Type" value={typeLabel} />
          <AdminDetailField label="Budget" value={formatDashboardCurrency(order.budget)} />
          <AdminDetailField label="Total" value={formatDashboardCurrency(order.total_amount)} />
          <AdminDetailField label="Frequency" value={dashboardLabel(order.frequency)} />
          <AdminDetailField label="Start date" value={formatDashboardDateLong(order.start_date)} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Customer">
        <AdminDetailGrid>
          <AdminDetailField label="Name" value={customerName} />
          <AdminDetailField label="Email" value={order.customer_email} />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Recipient">
        <AdminDetailGrid>
          <AdminDetailField label="Name" value={recipientName} />
          <AdminDetailField label="Preferred delivery time" value={dashboardLabel(order.preferred_delivery_time)} />
          <AdminDetailField label="Address" value={address} wide />
          <AdminDetailField
            label="Coordinates"
            value={formatDashboardCoordinates(order.latitude, order.longitude)}
            wide
          />
          <AdminDetailField label="Delivery notes" value={order.delivery_notes} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection title="Preferences">
        <AdminDetailGrid>
          <AdminDetailField label="Flower notes" value={order.flower_notes} wide />
        </AdminDetailGrid>
      </AdminDetailSection>

      <AdminDetailSection
        title="Deliveries"
        description={`${order.events.length} ${order.events.length === 1 ? 'delivery' : 'deliveries'}`}
        className="xl:col-span-2"
      >
        <AdminDetailTable
          headers={['Reference', 'Delivery date', 'Status', 'Action']}
          empty={order.events.length === 0}
          emptyMessage="No deliveries are attached to this order."
        >
          {order.events.map((event) => (
            <TableRow key={event.id} className="border-slate-100 hover:bg-slate-50">
              <TableCell className="font-mono text-slate-700">{event.reference}</TableCell>
              <TableCell className="font-medium text-slate-900">{formatDashboardDateLong(event.delivery_date)}</TableCell>
              <TableCell><DashboardStatusPill status={event.status} /></TableCell>
              <TableCell className="text-right">
                <AdminInlineLink href={`/dashboard/admin/events/${event.id}`}>View delivery</AdminInlineLink>
              </TableCell>
            </TableRow>
          ))}
        </AdminDetailTable>
      </AdminDetailSection>
    </AdminDetailPage>
  );
}
