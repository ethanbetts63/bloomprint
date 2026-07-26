import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import FlowBackButton from '@/components/order/FlowBackButton';
import FlowNextButton from '@/components/order/FlowNextButton';

interface PlanEditorShellProps {
  title: string;
  backPath: string;
  saveButtonText: string;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
  /** Extra classes for the content area (e.g. section spacing). */
  contentClassName?: string;
  children: React.ReactNode;
}

// The shared chrome for the order editors: full-height card with a title, the
// form body, and a back/save footer. Each editor supplies only the body.
const PlanEditorShell = ({
  title,
  backPath,
  saveButtonText,
  isLoading,
  isSaving,
  onSave,
  contentClassName = '',
  children,
}: PlanEditorShellProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: 'var(--surface-beige)' }}>
      <div className="container mx-auto max-w-4xl py-0 md:py-12 px-0 md:px-4">
        <Card className="bg-white text-black border-none shadow-none md:shadow-xl md:shadow-black/5 rounded-none md:rounded-[2rem] overflow-hidden">
          <CardHeader className="px-4 md:px-8 pt-2">
            <CardTitle className="text-3xl md:text-4xl font-bold font-playfair-display">{title}</CardTitle>
          </CardHeader>
          <CardContent className={`px-4 md:px-8 ${contentClassName}`}>
            {children}
          </CardContent>
          <CardFooter className="flex flex-row justify-between items-center gap-4 py-2 px-4 md:px-8 border-t border-black/5">
            <FlowBackButton to={backPath} />
            <FlowNextButton label={saveButtonText} onClick={onSave} isLoading={isSaving} disabled={isSaving} />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PlanEditorShell;
