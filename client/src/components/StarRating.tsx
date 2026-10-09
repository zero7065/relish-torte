import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}

export default function StarRating({ value, onChange, size = 'h-4 w-4' }: Props) {
  if (onChange) {
    return (
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className="transition hover:scale-110"
          >
            <Star
              className={`${size} ${n <= value ? 'fill-gold text-gold' : 'text-charcoal/25'}`}
            />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= value ? 'fill-gold text-gold' : 'text-charcoal/20'}`} />
      ))}
    </div>
  );
}
