
import type { StepProgressBarProps } from '@/types/StepProgressBarProps';

const StepProgressBar = ({ currentStep, totalSteps, planName, isReview, customLabel }: StepProgressBarProps) => {
    const progressPercent = isReview ? 100 : (currentStep / totalSteps) * 100;

    const displayLabel = customLabel || (isReview ? "Final Review" : `Step ${currentStep} of ${totalSteps}`);

    return (
        <div className="w-full bg-white border-b border-black/10 px-4 py-4">
            <div className="container mx-auto max-w-3xl">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold tracking-[0.2em] text-black/80 uppercase">
                        {planName}
                    </p>
                    <p className="text-s font-semibold text-black/80">
                        {displayLabel}
                    </p>
                </div>
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default StepProgressBar;
