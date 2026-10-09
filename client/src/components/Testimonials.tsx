import { Quote } from 'lucide-react';
import type { Review } from '../lib/types';
import StarRating from './StarRating';

export default function Testimonials({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <figure key={r.id} className="card flex h-full flex-col p-6">
          <Quote className="h-7 w-7 text-clay/40" />
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/75">
            “{r.text}”
          </blockquote>
          <figcaption className="mt-5 border-t border-sand pt-4">
            <StarRating value={r.rating} />
            <p className="mt-2 text-sm font-semibold">
              {r.name}
              {r.location ? <span className="font-normal text-charcoal/50"> · {r.location}</span> : null}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
