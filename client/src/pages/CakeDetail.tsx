import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, ApiError } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import { naira } from '../lib/format';
import { waLink } from '../lib/contact';
import type { Cake } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';
import Lightbox from '../components/Lightbox';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export default function CakeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [cake, setCake] = useState<Cake | null>(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCake(null);
    setError('');
    setQty(1);
    setSizeIdx(0);
    apiGet<Cake>(`/api/menu/${slug}`)
      .then(setCake)
      .catch((e: unknown) =>
        setError(e instanceof ApiError && e.status === 404 ? 'notfound' : 'network')
      );
  }, [slug]);

  useTitle(cake ? `${cake.name} — Relish Torte, Jos` : 'Loading… — Relish Torte');

  if (error) {
    return (
      <div className="section container-x text-center">
        <p className="font-display text-3xl font-semibold">
          {error === 'notfound' ? 'That item is not on the menu' : 'Something went wrong loading the item'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/menu" className="btn btn-primary">
            Back to menu
          </Link>
          <button type="button" className="btn btn-outline" onClick={() => navigate(0)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="section container-x">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-sand" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-sand" />
            <div className="h-9 w-64 animate-pulse rounded bg-sand" />
            <div className="h-24 w-full animate-pulse rounded bg-sand" />
          </div>
        </div>
      </div>
    );
  }

  const size = cake.sizes[sizeIdx] ?? cake.sizes[0];
  const unitPrice = size?.price ?? null;
  const total = unitPrice === null ? null : unitPrice * qty;

  const orderMessage = () => {
    const lines = [
      `Hello Relish Torte! I would like to order:`,
      `• Item: ${cake.name}`,
      size ? `• Size: ${size.label}` : '',
      cake.flavors.length ? `• Flavour: ${cake.flavors[0]}` : '',
      `• Quantity: ${qty}`,
      total !== null ? `• Total: ${naira(total)}` : `• Price: please quote for ${size?.label ?? 'custom'}`,
      `• Needed by: ____ (please confirm)`,
      `Ref from site: ${cake.slug}`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  return (
    <div className="section container-x">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-charcoal/60 transition hover:text-clay">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <button
            type="button"
            className="group block w-full overflow-hidden rounded-3xl bg-sand shadow-soft"
            onClick={() => setLightbox(true)}
            aria-label="View image full screen"
          >
            <img
              src={cake.image}
              alt={cake.name}
              className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </button>
          <p className="mt-2 text-center text-xs text-charcoal/45">Tap the image to enlarge</p>
        </div>

        <div>
          <p className="eyebrow">{CATEGORY_LABELS[cake.category]}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{cake.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {unitPrice === null ? (
              <span className="font-display text-2xl font-semibold text-cocoa">Custom quote</span>
            ) : (
              <>
                <span className="font-display text-2xl font-semibold text-cocoa">{naira(unitPrice)}</span>
                <span className="text-sm text-charcoal/50">{size?.label}</span>
              </>
            )}
            {!cake.available && (
              <span className="rounded-full bg-charcoal/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Currently unavailable
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-charcoal/70">{cake.description}</p>

          {cake.flavors.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">Flavours</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {cake.flavors.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cake.sizes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">Sizes & prices</h2>
              <div className="mt-2 overflow-hidden rounded-2xl border border-sand">
                {cake.sizes.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setSizeIdx(i)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${
                      i === sizeIdx ? 'bg-clay/10 font-semibold text-cocoa' : 'bg-white hover:bg-cream'
                    } ${i > 0 ? 'border-t border-sand' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full border-2 ${
                          i === sizeIdx ? 'border-clay bg-clay' : 'border-charcoal/30'
                        }`}
                      />
                      {s.label}
                    </span>
                    <span>{s.price === null ? 'Quote' : naira(s.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">Quantity</span>
            <div className="flex items-center gap-1 rounded-full border border-charcoal/15 bg-white p-1">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 transition hover:bg-sand disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 transition hover:bg-sand"
                onClick={() => setQty((q) => Math.min(100, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {total !== null && (
              <span className="text-sm text-charcoal/60">
                Total <strong className="text-cocoa">{naira(total)}</strong>
              </span>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={waLink(orderMessage())}
              target="_blank"
              rel="noreferrer"
              className={`btn ${cake.available ? 'btn-wa' : ''}`}
              aria-disabled={!cake.available}
              onClick={(e) => {
                if (!cake.available) e.preventDefault();
              }}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Order on WhatsApp
            </a>
            <Link
              to={`/order?item=${cake.slug}`}
              className="btn btn-outline"
              aria-disabled={!cake.available}
              onClick={(e) => {
                if (!cake.available) e.preventDefault();
              }}
            >
              Use the order form
            </Link>
          </div>

          <ul className="mt-7 space-y-2.5 border-t border-sand pt-5 text-xs leading-relaxed text-charcoal/55">
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" />
              Minimum 48 hours notice — need it sooner? WhatsApp us, we bake 24/7.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" />
              Pickup from our kitchen or delivery anywhere in Jos.
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" />
              Baked in a kitchen that handles eggs, dairy, wheat, nuts and gluten.
            </li>
          </ul>
        </div>
      </div>

      {lightbox && <Lightbox src={cake.image} alt={cake.name} onClose={() => setLightbox(false)} />}
    </div>
  );
}
