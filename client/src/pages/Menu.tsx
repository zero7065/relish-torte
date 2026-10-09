import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { apiGet } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import type { Cake, Category } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';
import CakeCard from '../components/CakeCard';

const filters: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'celebration', label: CATEGORY_LABELS.celebration },
  { key: 'cupcakes', label: CATEGORY_LABELS.cupcakes },
  { key: 'loaves', label: CATEGORY_LABELS.loaves },
  { key: 'confectioneries', label: CATEGORY_LABELS.confectioneries },
];

export default function MenuPage() {
  useTitle('Menu — Relish Torte, Jos');
  const [cakes, setCakes] = useState<Cake[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('cat') || 'all';
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiGet<Cake[]>('/api/menu').then(setCakes).catch(() => setCakes([]));
  }, []);

  const visible = useMemo(() => {
    if (!cakes) return [];
    return cakes.filter((c) => {
      const catOk = category === 'all' || c.category === category;
      const q = query.trim().toLowerCase();
      const qOk =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.flavors.some((f) => f.toLowerCase().includes(q));
      return catOk && qOk;
    });
  }, [cakes, category, query]);

  return (
    <div className="section container-x">
      <div className="max-w-2xl">
        <p className="eyebrow">Our menu</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Cakes, cupcakes & confectioneries
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
          Everything is baked to order. Prices are starting points — custom designs are quoted
          after we hear your idea.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSearchParams(f.key === 'all' ? {} : { cat: f.key })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === f.key
                  ? 'bg-charcoal text-white'
                  : 'border border-charcoal/15 text-charcoal/70 hover:border-charcoal/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chocolate, samosa…"
            className="input !pl-10"
            aria-label="Search the menu"
          />
        </div>
      </div>

      <div className="mt-8">
        {cakes === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-96 animate-pulse bg-sand/60" />
            ))}
          </div>
        ) : visible.length ? (
          <>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-charcoal/45">
              {visible.length} item{visible.length > 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((cake) => (
                <CakeCard key={cake.slug} cake={cake} />
              ))}
            </div>
          </>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <SearchX className="h-9 w-9 text-charcoal/30" />
            <p className="font-display text-lg font-semibold">Nothing matches that</p>
            <p className="text-sm text-charcoal/55">Try another search or category.</p>
            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => {
                setQuery('');
                setSearchParams({});
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
