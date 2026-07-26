import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImpactTierSelector } from '@/components/order/ImpactTierSelector';
import type { OrderStructureFormProps } from '@/types/OrderStructureFormProps';
import { MIN_DAYS_BEFORE_CREATE, MIN_DAYS_BEFORE_EDIT, minDeliveryDate } from '@/lib/systemConstants';

const OrderStructureForm = ({
    formData,
    onFormChange,
    setIsDebouncePending,
    isEdit = false,
    isPaid = false,
}: OrderStructureFormProps) => {
    const handleBudgetChange = (budget: number) => {
        if (setIsDebouncePending) setIsDebouncePending(true);
        onFormChange('budget', budget);
    };

    const leadTime = isEdit ? MIN_DAYS_BEFORE_EDIT : MIN_DAYS_BEFORE_CREATE;

    return (
        <div className="space-y-6">
            {!isPaid && <ImpactTierSelector value={formData.budget} onChange={handleBudgetChange} />}

            <div className="grid gap-2">
                <Label htmlFor="start-date">Delivery Date</Label>
                <Input
                    id="start-date"
                    type="date"
                    min={minDeliveryDate(isEdit)}
                    value={formData.start_date}
                    onChange={(e) => onFormChange('start_date', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                    The date the bouquet will be delivered. Must be at least {leadTime} days from today.
                </p>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="card-message">Card Message</Label>
                <Textarea
                    id="card-message"
                    placeholder="e.g., Happy Birthday! Hope you have a wonderful day."
                    value={formData.card_message}
                    onChange={(e) => onFormChange('card_message', e.target.value)}
                    rows={4}
                />
                <p className="text-sm text-muted-foreground">The message to be included with the delivery.</p>
            </div>
        </div>
    );
};

export default OrderStructureForm;
