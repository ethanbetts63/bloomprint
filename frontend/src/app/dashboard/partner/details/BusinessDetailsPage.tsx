"use client";

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import ServiceAreaMap from '@/components/marketing/ServiceAreaMap';
import DeleteAccountSection from '@/app/dashboard/partner/details/DeleteAccountSection';
import UnifiedSummaryCard from '@/components/order/UnifiedSummaryCard';
import FlowBackButton from '@/components/order/FlowBackButton';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPartnerDashboard, updatePartnerDetails } from '@/api/partners';
import { errorMessage } from '@/lib/errors';
import { fieldErrorSummary } from '@/api/ApiError';

const BusinessDetailsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);

  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    street_address: '',
    suburb: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
  });

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const partner = await getPartnerDashboard();
        setIsDelivery(partner.partner_type === 'delivery');
        setForm({
          business_name: partner.business_name || '',
          phone: partner.phone || '',
          street_address: partner.street_address || '',
          suburb: partner.suburb || '',
          city: partner.city || '',
          state: partner.state || '',
          postcode: partner.postcode || '',
          country: partner.country || '',
        });
        setLatitude(partner.latitude);
        setLongitude(partner.longitude);
        setRadiusKm(partner.service_radius_km || 10);
      } catch {
        toast.error('Failed to load business details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPartner();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDelivery && (latitude === null || longitude === null)) {
      toast.error('Please set your delivery location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePartnerDetails({
        ...form,
        ...(isDelivery && {
          latitude,
          longitude,
          service_radius_km: radiusKm,
        }),
      });
      toast.success('Business details updated.');
    } catch (error) {
      const description = fieldErrorSummary(error);
      toast.error('Update failed', {
        description: description || errorMessage(error) || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: 'var(--surface-beige)' }} className="min-h-screen py-0 md:py-12 px-0 md:px-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSubmit}>
            <UnifiedSummaryCard
              title="Business Details"
              description="Update your business information and service area."
              footer={
                <div className="flex flex-row justify-between items-center w-full gap-4">
                  <FlowBackButton to="/dashboard/partner" label="Dashboard" />
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting && <Spinner className="mr-2 h-4 w-4 text-current" />}
                    Save Changes
                  </Button>
                </div>
              }
            >
              <div className="py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input id="business_name" name="business_name" value={form.business_name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                {isDelivery && (
                  <div className="border-t border-black/5 pt-6 space-y-4">
                    <h3 className="font-semibold text-lg text-black">Store Location</h3>

                    <div className="space-y-2">
                      <Label htmlFor="street_address">Street Address</Label>
                      <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="suburb">Suburb</Label>
                        <Input id="suburb" name="suburb" value={form.suburb} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" value={form.city} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" value={form.state} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input id="postcode" name="postcode" value={form.postcode} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" value={form.country} onChange={handleChange} />
                      </div>
                    </div>

                    <ServiceAreaMap
                      latitude={latitude}
                      longitude={longitude}
                      radiusKm={radiusKm}
                      onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                      onRadiusChange={setRadiusKm}
                    />
                  </div>
                )}
              </div>
            </UnifiedSummaryCard>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-5 w-5 text-black/20" />
              <span className="text-xs font-bold tracking-[0.2em] text-black uppercase">
                Danger Zone
              </span>
            </div>
            <DeleteAccountSection />
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessDetailsPage;
