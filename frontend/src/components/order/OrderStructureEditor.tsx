"use client";
import OrderStructureForm from '@/components/order/OrderStructureForm';
import PlanEditorShell from '@/components/order/PlanEditorShell';
import { usePlanEditor } from '@/hooks/usePlanEditor';
import type { Order } from '@/types/Order';
import type { OrderStructureData } from '@/types/OrderStructureData';
import type { OrderStructureEditorProps } from '@/types/OrderStructureEditorProps';
import { minDeliveryDate } from '@/lib/systemConstants';

const OrderStructureEditor = ({
    mode,
    isPaid = false,
    title = 'Delivery Details',
    saveButtonText,
    onSaveNavigateTo,
    backPath,
    getPlan,
    updatePlan,
}: OrderStructureEditorProps) => {
    const isEdit = mode === 'edit';

    const editor = usePlanEditor<OrderStructureData>({
        mode,
        getPlan,
        updatePlan,
        onSaveNavigateTo,
        backPath,
        initialData: { budget: 125, start_date: minDeliveryDate(isEdit), card_message: '' },
        fromPlan: (plan: Order) => {
            let startDate = plan.start_date || minDeliveryDate(isEdit);
            if (plan.status !== 'active' && startDate < minDeliveryDate(isEdit)) {
                startDate = minDeliveryDate(isEdit);
            }
            return {
                budget: Number(plan.budget) || 125,
                start_date: startDate,
                card_message: plan.card_message || '',
            };
        },
        toPayload: (data) =>
            isPaid
                ? { start_date: data.start_date, card_message: data.card_message }
                : { budget: data.budget, start_date: data.start_date, card_message: data.card_message },
        savedMessage: 'Plan details updated successfully!',
        loadErrorMessage: 'Failed to load plan details',
        saveErrorMessage: 'Failed to save plan details.',
    });

    return (
        <PlanEditorShell
            title={title}
            backPath={backPath}
            saveButtonText={saveButtonText}
            isLoading={editor.isLoading}
            isSaving={editor.isSaving}
            onSave={editor.handleSave}
            contentClassName="space-y-8"
        >
            <OrderStructureForm
                formData={editor.formData}
                onFormChange={editor.setField}
                setIsDebouncePending={() => {}}
                isEdit={isEdit}
                isPaid={isPaid}
            />
        </PlanEditorShell>
    );
};

export default OrderStructureEditor;
