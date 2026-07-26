// frontend/src/components/EditControl.tsx
import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { EditControlProps } from '@/types/EditControlProps';

const EditControl = ({ editUrl, locked = false }: EditControlProps) => {
  if (locked) {
    return (
      <div className="flex items-center gap-1.5 text-black/30">
        <Lock className="h-3 w-3" />
        <span className="text-xs">
          Editing closed —{' '}
          <Link href="/order-support" className="underline hover:text-black/50 transition-colors">
            contact us
          </Link>
        </span>
      </div>
    );
  }

  return (
    <Link
      href={editUrl}
      className="text-xs font-semibold text-black/40 hover:text-black underline underline-offset-4 transition-colors"
    >
      Edit
    </Link>
  );
};

export default EditControl;
