import { Suspense } from 'react';
import AdminMessagesPage from '@/app/dashboard/admin/messages/AdminMessagesPage';

export default function Page() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <AdminMessagesPage />
    </Suspense>
  );
}
