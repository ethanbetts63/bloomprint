import LegacyBusinessDashboardRedirect from '@/components/dashboard/LegacyBusinessDashboardRedirect';
export default async function Page({ params }: { params: Promise<{ payoutId: string }> }) { const { payoutId } = await params; return <LegacyBusinessDashboardRedirect suffix={`/payouts/${payoutId}`} />; }
