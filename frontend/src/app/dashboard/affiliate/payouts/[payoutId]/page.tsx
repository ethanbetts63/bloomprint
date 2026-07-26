import DashboardPayoutDetailPage from '@/components/dashboard/DashboardPayoutDetailPage';
export default async function Page({ params }: { params: Promise<{ payoutId: string }> }) { const { payoutId } = await params; return <DashboardPayoutDetailPage payoutId={payoutId} accountType="affiliate" />; }
