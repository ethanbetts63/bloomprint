import AdminGuard from '@/shared_components/AdminGuard';
import AdminOrdersPage from '@/app/dashboard/admin/orders/AdminOrdersPage';

export default function Page() {
  return (
    <AdminGuard>
      <AdminOrdersPage />
    </AdminGuard>
  );
}
