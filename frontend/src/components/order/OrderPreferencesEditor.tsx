"use client";
import PlanEditorShell from '@/components/order/PlanEditorShell';
import { Textarea } from '@/components/ui/textarea';
import { usePlanEditor } from '@/hooks/usePlanEditor';
import type { Order } from '@/types/Order';
import type { OrderPreferencesEditorProps } from '@/types/OrderPreferencesEditorProps';

interface PreferencesData {
    flower_notes: string;
}

const OrderPreferencesEditor = ({
    mode,
    title = "The Florist's Brief",
    saveButtonText,
    onSaveNavigateTo,
    backPath,
    getPlan,
    updatePlan,
}: OrderPreferencesEditorProps) => {
    const editor = usePlanEditor<PreferencesData>({
        mode,
        getPlan,
        updatePlan,
        onSaveNavigateTo,
        backPath,
        initialData: { flower_notes: '' },
        fromPlan: (plan: Order) => ({ flower_notes: plan.flower_notes || '' }),
        toPayload: (data) => ({ flower_notes: data.flower_notes }),
        savedMessage: 'Preferences saved successfully!',
        loadErrorMessage: 'Failed to load your preferences.',
        saveErrorMessage: 'Failed to save preferences.',
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
            <div className="pb-4">
                <h3 className="text-xl font-semibold mb-2">What should the florist know?</h3>
                <p className="text-sm text-gray-600 mb-4">The occasion, favourite colours, dislikes, allergies — anything that helps them get it right.</p>
                <Textarea
                    placeholder="She loves peonies but hates lilies. Keep it soft and pastel."
                    value={editor.formData.flower_notes}
                    onChange={(e) => editor.setField('flower_notes', e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
        </PlanEditorShell>
    );
};

export default OrderPreferencesEditor;
