"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { getTermsByType } from '@/api';
import type { TermsAndConditions } from '@/types/TermsAndConditions';
import { Spinner } from '@/components/ui/spinner';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import SummarySection from '@/components/SummarySection';
import { errorMessage } from '@/lib/errors';

const VALID_TYPES = ['florist', 'customer', 'affiliate'] as const;
type TermsType = typeof VALID_TYPES[number];

const TYPE_LABELS: Record<TermsType, string> = {
    florist: 'Florist',
    customer: 'Customer',
    affiliate: 'Affiliate',
};

const TermsAndConditionsPage = () => {
    const params = useParams();
    const type = params.type as string | undefined;
    const router = useRouter();
    const [terms, setTerms] = useState<TermsAndConditions | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const validType = VALID_TYPES.includes(type as TermsType) ? (type as TermsType) : null;

    useEffect(() => {
        if (!validType) return;

        const fetchTerms = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getTermsByType(validType);
                setTerms(data);
            } catch (err) {
                setError(errorMessage(err) || 'Failed to load terms and conditions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTerms();
    }, [validType]);

    if (!validType) {
        router.replace('/terms-and-conditions/customer');
        return null;
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner className="w-8 h-8 mr-2" />
                    <p className="text-black/60">Loading...</p>
                </div>
            );
        }

        if (error) {
            return (
                <p className="text-red-500">{error}</p>
            );
        }

        if (terms) {
            return (
                <div
                    className="text-black [&_*]:text-black [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: terms.content }}
                />
            );
        }

        return null;
    };

    return (
        <>
            <div style={{ backgroundColor: 'var(--color4)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
                <div className="container mx-auto max-w-4xl">
                    <UnifiedSummaryCard
                        title="Terms & Conditions"
                        description={`${TYPE_LABELS[validType]} Terms & Conditions`}
                    >
                        <SummarySection label={TYPE_LABELS[validType]}>
                            {renderContent()}
                        </SummarySection>
                    </UnifiedSummaryCard>
                </div>
            </div>
        </>
    );
};

export default TermsAndConditionsPage;
