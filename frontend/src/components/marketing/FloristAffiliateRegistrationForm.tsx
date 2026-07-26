"use client";
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { registerFloristOrAffiliate } from '@/api/businessAccounts';
import { acceptTerms } from '@/api';
import type { FloristAffiliateRegistrationData } from '@/types';
import { errorMessage } from '@/lib/errors';
import { fieldErrorSummary } from '@/api/ApiError';

const ServiceAreaMap = dynamic(() => import('@/components/marketing/ServiceAreaMap'), { ssr: false });

interface FloristAffiliateRegistrationFormProps {
  accountType: 'florist' | 'affiliate';
  className?: string;
}

const FloristAffiliateRegistrationForm = ({ accountType, className = '' }: FloristAffiliateRegistrationFormProps) => {
  const router = useRouter();
  const formTopRef = useRef<HTMLDivElement>(null);
  const { handleLoginSuccess } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partnerTermsAccepted, setPartnerTermsAccepted] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  const isDelivery = accountType === 'florist';

  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    business_name: '',
    phone: '',
    street_address: '',
    suburb: '',
    city: '',
    state: '',
    postcode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }

    if (isDelivery && (latitude === null || longitude === null)) {
      toast.error('Please set your delivery location on the map.');
      return;
    }

    if (!partnerTermsAccepted) {
      toast.error('Please accept the terms and conditions before registering.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirm_password, ...formData } = form;
      const data: FloristAffiliateRegistrationData = {
        ...formData,
        partner_type: isDelivery ? 'delivery' : 'non_delivery',
        ...(isDelivery && {
          latitude: latitude!,
          longitude: longitude!,
          service_radius_km: radiusKm,
        }),
      };

      await registerFloristOrAffiliate(data);
      await handleLoginSuccess();
      await acceptTerms(isDelivery ? 'florist' : 'affiliate');
      router.push(isDelivery ? '/dashboard/florist' : '/dashboard/affiliate');
    } catch (error) {
      const description = fieldErrorSummary(error);
      toast.error('Registration failed', {
        description: description || errorMessage(error) || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirm_password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }
    changeStep(2);
  };

  const changeStep = (nextStep: 1 | 2) => {
    setStep(nextStep);
    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const showAccountStep = !isDelivery || step === 1;
  const showLocationStep = isDelivery && step === 2;
  const showTerms = !isDelivery || step === 2;

  return (
    <div
      ref={formTopRef}
      className={`min-w-0 scroll-mt-28 rounded-none border-y border-black/10 bg-white p-5 text-black shadow-xl shadow-black/5 sm:rounded-xl sm:border sm:p-6 lg:p-7 ${className}`}
    >
      <div className="border-b border-black/10 pb-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="break-words text-2xl font-bold text-black font-playfair-display">
            {isDelivery ? 'Create your florist account' : 'Create your affiliate account'}
          </h2>
          {isDelivery && (
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-black/50">
              Step {step} of 2
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-black/60">
          {!isDelivery
            ? 'Sign up to get your unique discount code and start earning commissions.'
            : step === 1
              ? 'Sign up to fulfil flower deliveries in your area and earn from each order.'
              : 'Set your store location and the area you deliver to.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        {showAccountStep && (
        <>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
            <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
            <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password <span className="text-red-500">*</span></Label>
            <Input id="confirm_password" name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">{isDelivery ? 'Business Name' : 'Business/Podcast/Social Name'}</Label>
            <Input id="business_name" name="business_name" value={form.business_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>
        </>
        )}

        {showLocationStep && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Store Location</h3>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={form.state} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" name="postcode" value={form.postcode} onChange={handleChange} />
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

        {showTerms && (
        <div className="space-y-3 border-t border-black/10 pt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={partnerTermsAccepted}
              onCheckedChange={(checked) => setPartnerTermsAccepted(checked === true)}
              className="mt-0.5 flex-shrink-0"
            />
            <span className="text-sm leading-relaxed text-black/70">
              I have read and agree to the{' '}
              <Link href={`/terms-and-conditions/${isDelivery ? 'florist' : 'affiliate'}`} target="_blank" className="text-black underline hover:text-black/70">
                {isDelivery ? 'Florist Terms & Conditions' : 'Affiliate Terms & Conditions'}
              </Link>
              .
            </span>
          </label>
        </div>
        )}

        {isDelivery && step === 1 ? (
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-between rounded-lg bg-black px-5 py-4 text-left text-white transition hover:bg-black/85"
          >
            <span className="block text-sm font-semibold">Continue to store location</span>
            <ChevronRight className="h-5 w-5 text-white/70" />
          </button>
        ) : (
          <div className="space-y-3">
            {isDelivery && step === 2 && (
              <button
                type="button"
                onClick={() => changeStep(1)}
                className="inline-flex items-center gap-1 text-sm font-medium text-black/60 transition hover:text-black"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to account details
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !partnerTermsAccepted}
              className="flex w-full items-center justify-between rounded-lg bg-black px-5 py-4 text-left text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="block text-sm font-semibold">
                {isSubmitting ? 'Setting up…' : `Create ${isDelivery ? 'florist' : 'affiliate'} account`}
              </span>
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white/70" />
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FloristAffiliateRegistrationForm;
