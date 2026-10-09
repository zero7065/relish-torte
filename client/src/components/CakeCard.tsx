import { Link } from 'react-router-dom';
import type { Cake } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';
import { naira } from '../lib/format';

export default function CakeCard({ cake }: { cake: Cake }) {
  return (
    <Link
      to={`/menu/${cake.slug}`}
      className="group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        <img
          src={cake.image}
          alt={cake.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {cake.featured && (
            <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
              Bestseller
            </span>
          )}
          {!cake.available && (
            <span className="rounded-full bg-charcoal/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
              Unavailable
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">
          {CATEGORY_LABELS[cake.category]}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{cake.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-charcoal/60">
          {cake.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-cocoa">
            {cake.price_from === null ? (
              <span className="text-sm text-charcoal/60">Custom quote</span>
            ) : (
              <>
                <span className="text-xs font-medium text-charcoal/50">from </span>
                {naira(cake.price_from)}
              </>
            )}
          </span>
          <span className="text-sm font-semibold text-clay transition group-hover:translate-x-0.5">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
