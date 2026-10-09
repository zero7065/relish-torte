import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        onClick={onClose}
        aria-label="Close image"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[85vh] max-w-[92vw] rounded-3xl object-contain shadow-lift"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
