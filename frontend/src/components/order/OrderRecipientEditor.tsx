"use client";
import RecipientForm from '@/components/order/RecipientForm';
import PlanEditorShell from '@/components/order/PlanEditorShell';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePlanEditor } from '@/hooks/usePlanEditor';
import { EMPTY_RECIPIENT, recipientFromPlan } from '@/lib/recipientData';
import type { RecipientData } from '@/types/RecipientData';
import type { OrderRecipientEditorProps } from '@/types/OrderRecipientEditorProps';

const OrderRecipientEditor = ({
    mode,
    title,
    saveButtonText,
    onSaveNavigateTo,
    backPath,
    getPlan,
    updatePlan,
}: OrderRecipientEditorProps) => {
    const editor = usePlanEditor<RecipientData>({
        mode,
        getPlan,
        updatePlan,
        onSaveNavigateTo,
        backPath,
        initialData: EMPTY_RECIPIENT,
        fromPlan: recipientFromPlan,
        toPayload: (data) => ({ ...data }),
        validate: (data) =>
            !data.recipient_first_name || !data.recipient_street_address || !data.recipient_city
                ? "Please fill in at least the recipient's first name, address, and city."
                : null,
        savedMessage: 'Recipient details updated successfully!',
        loadErrorMessage: 'Failed to load plan data.',
        saveErrorMessage: 'Failed to save recipient details.',
    });

    return (
        <PlanEditorShell
            title={title}
            backPath={backPath}
            saveButtonText={saveButtonText}
            isLoading={editor.isLoading}
            isSaving={editor.isSaving}
            onSave={editor.handleSave}
        >
            <RecipientForm formData={editor.formData} onFormChange={editor.setField} title="" />

            <div className="grid gap-2 mt-2 pb-4">
                <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
                <Textarea
                    id="delivery-notes"
                    placeholder="e.g., Leave at the front door, ring the bell twice, etc."
                    value={editor.formData.delivery_notes}
                    onChange={(e) => editor.setField('delivery_notes', e.target.value)}
                    rows={3}
                />
                <p className="text-sm text-muted-foreground">Any special instructions for the delivery driver.</p>
            </div>
        </PlanEditorShell>
    );
};

export default OrderRecipientEditor;
