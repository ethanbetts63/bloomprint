// futureflower/frontend/src/components/RecipientForm.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// This could be defined in a shared types file later
import type { RecipientData } from '@/types/RecipientData';
import type { RecipientFormProps } from '@/types/RecipientFormProps';

const RecipientForm = ({
  formData,
  onFormChange,
  title = "Recipient Details",
  hideNameFields = false
}: RecipientFormProps) => {
  const handleChange = (field: keyof RecipientData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange(field, e.target.value);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {!hideNameFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient_first_name">First Name<span className="text-red-500">*</span></Label>
              <Input id="recipient_first_name" value={formData.recipient_first_name} onChange={handleChange('recipient_first_name')} placeholder="Jane" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipient_last_name">Last Name<span className="text-red-500">*</span></Label>
              <Input id="recipient_last_name" value={formData.recipient_last_name} onChange={handleChange('recipient_last_name')} placeholder="Doe" />
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="recipient_street_address">Street Address<span className="text-red-500">*</span></Label>
          <Input id="recipient_street_address" value={formData.recipient_street_address} onChange={handleChange('recipient_street_address')} placeholder="123 Blossom Lane" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient_suburb">Suburb<span className="text-red-500">*</span></Label>
            <Input id="recipient_suburb" value={formData.recipient_suburb} onChange={handleChange('recipient_suburb')} placeholder="Suburb" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient_city">City<span className="text-red-500">*</span></Label>
            <Input id="recipient_city" value={formData.recipient_city} onChange={handleChange('recipient_city')} placeholder="Perth" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient_state">State</Label>
            <Input id="recipient_state" value={formData.recipient_state} onChange={handleChange('recipient_state')} placeholder="WA" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient_postcode">Postcode<span className="text-red-500">*</span></Label>
            <Input id="recipient_postcode" value={formData.recipient_postcode} onChange={handleChange('recipient_postcode')} placeholder="90210" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient_country">Country<span className="text-red-500">*</span></Label>
            <Input id="recipient_country" value={formData.recipient_country} onChange={handleChange('recipient_country')} placeholder="Australia" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientForm;
