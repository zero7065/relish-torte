import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Camera, Send, AlertCircle } from 'lucide-react';
import { apiGet, apiSend, ApiError } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import { naira, minOrderDate } from '../lib/format';
import { waLink, PHONE_DISPLAY } from '../lib/contact';
import type { Cake } from '../lib/types';
import { CATEGORY_LABELS, ORDER_TYPES, PLATEAU_AREAS } from '../lib/types';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

const typeToCategory: Record<string, string> = {
  Cupcakes: 'cupcakes',
  'Celebration cake': 'celebration',
  'Loaf cake': 'loaves',
  Confectioneries: 'confectioneries',
};

interface FormState {
  name: string;
  phone: string;
  email: string;
  type: string;
  item: string;
  flavor: string;
  size: string;
  qty: number;
  inscription: string;
  neededDate: string;
  delivery: string;
  area: string;
  address: string;
  notes: string;
}

const initial: FormState = {
  name: '',
  phone: '',
  email: '',
  type: 'Celebration cake',
  item: '',
  flavor: '',
  size: '',
  qty: 1,
  inscription: '',
  neededDate: '',
  delivery: 'Pickup',
  area: '',
  address: '',
  notes: '',
};

export default function Order() {
  useTitle('Place an Order — Relish Torte, Jos');
  const [searchParams] = useSearchParams();
  const prefillSlug = searchParams.get('item') || '';

  const [form, setForm] = useState<FormState>(initial);
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ ref: string; message: string; waText: string } | null>(null);

  useEffect(() => {
    apiGet<Cake[]>('/api/menu').then((all) => {
      setCakes(all);
      if (prefillSlug) {
        const c = all.find((x) => x.slug === prefillSlug);
        if (c) {
          const type = (Object.entries(typeToCategory).find(([, cat]) => cat === c.category) || [
            'Celebration cake',
          ])[0];
          setForm((f) => ({
            ...f,
            type,
            item: c.name,
            flavor: c.flavors[0] || '',
            size: c.sizes[0]?.label || '',
          }));
        }
      }
    });
  }, [prefillSlug]);

  const itemOptions = useMemo(() => {
    const cat = typeToCategory[form.type];
    const matched = cakes.filter((c) => c.category === cat);
    const extra = form.item && !matched.some((c) => c.name === form.item) ? [form.item] : [];
    return [...matched.map((c) => c.name), ...extra];
  }, [cakes, form.type, form.item]);

  const flavorOptions = useMemo(() => {
    const fromItem = cakes.find((c) => c.name === form.item);
    if (fromItem && fromItem.flavors.length) return fromItem.flavors;
    return ['Chocolate', 'Vanilla', 'Red velvet', 'Banana bread', 'Fruit cake', 'Carrot cake', 'Coconut cake'];
  }, [cakes, form.item]);

  const selectedCake = cakes.find((c) => c.name === form.item);
  const sizeOptions = selectedCake?.sizes.map((s) => s.label) ?? [];

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFields((fl) => {
      if (!fl[key as string]) return fl;
      const next = { ...fl };
      delete next[key as string];
      return next;
    });
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError('');
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      setPhotoError('Only jpg, png, webp or gif images are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image must be 2MB or smaller');
      e.target.value = '';
      return;
    }
    setPhoto(file);
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name';
    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = 'Enter a valid email';
    if (form.qty < 1 || form.qty > 100) errs.qty = 'Quantity must be 1–100';
    if (!form.neededDate) errs.neededDate = 'Choose the date you need it';
    else if (form.neededDate < minOrderDate()) errs.neededDate = 'We need at least 2 days notice';
    if (form.delivery === 'Delivery' && !form.area) errs.area = 'Choose a delivery area';
    if (form.delivery === 'Delivery' && form.address.trim().length < 5)
      errs.address = 'Enter your delivery address';
    setFields(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      const first = document.querySelector<HTMLElement>('[data-error="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      let filename = '';
      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = (await res.json()) as { filename?: string; error?: string };
        if (!res.ok) throw new Error(data.error || 'Image upload failed');
        filename = data.filename || '';
      }
      const payload = {
        ...form,
        qty: Number(form.qty),
        neededDate: form.neededDate,
        photo: filename,
      };
      const result = await apiSend<{ ref: string; message: string }>('POST', '/api/orders', payload);
      const sizeLine = form.size ? `Size: ${form.size}` : '';
      const waText = [
        `Hello Relish Torte! I just placed order ${result.ref} on your website:`,
        `• Name: ${form.name}`,
        `• Phone: ${form.phone}`,
        `• Item: ${form.item || form.type}`,
        sizeLine && `• ${sizeLine}`,
        form.flavor && `• Flavour: ${form.flavor}`,
        `• Quantity: ${form.qty}`,
        form.inscription && `• Inscription: "${form.inscription}"`,
        `• Needed by: ${form.neededDate}`,
        `• ${form.delivery}${form.delivery === 'Delivery' ? ` — ${form.area}, ${form.address}` : ''}`,
        form.notes && `• Notes: ${form.notes}`,
        `Total on site: ${selectedCake && form.size ? naira((selectedCake.sizes.find((s) => s.label === form.size)?.price ?? null) ? (selectedCake.sizes.find((s) => s.label === form.size)!.price! * form.qty) : null) : 'please confirm'}`,
      ]
        .filter(Boolean)
        .join('\n');
      setSuccess({ ref: result.ref, message: result.message, waText });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="section container-x max-w-3xl">
        <div className="card p-8 text-center sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf/15 text-leaf">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold">Order received!</h1>
          <p className="mt-2 text-sm text-charcoal/60">
            Your reference is <strong className="text-cocoa">{success.ref}</strong>. We will call
            you on {form.phone || PHONE_DISPLAY} shortly to confirm.
          </p>
          <div className="mt-6 rounded-2xl bg-cream p-5 text-left text-sm leading-relaxed text-charcoal/70">
            <p className="mb-2 font-semibold text-charcoal">Send it straight to our WhatsApp:</p>
            <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{success.waText}</pre>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={waLink(success.waText)} target="_blank" rel="noreferrer" className="btn btn-wa">
              <WhatsAppIcon className="h-4 w-4" />
              Send on WhatsApp now
            </a>
            <Link to="/menu" className="btn btn-outline">
              Order something else
            </Link>
          </div>
          <p className="mt-5 text-xs text-charcoal/50">
            Want to be extra sure? Call {PHONE_DISPLAY} — we answer 24/7.
          </p>
        </div>
      </div>
    );
  }

  const err = (key: string) => fields[key];

  return (
    <div className="section container-x">
      <div className="max-w-2xl">
        <p className="eyebrow">Place an order</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Tell us what you are dreaming of
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
          Fill this form and we will call you to confirm within minutes. Prefer to talk? WhatsApp
          us any time — we are open 24/7.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-10 grid max-w-4xl gap-6 lg:grid-cols-2" noValidate>
        <fieldset className="card p-6 lg:col-span-2">
          <legend className="px-1 font-display text-lg font-semibold">About you</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div data-error={Boolean(err('name'))}>
              <label className="label" htmlFor="name">Full name *</label>
              <input id="name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Chidinma Okafor" />
              {err('name') && <p className="mt-1 text-xs text-red-600">{err('name')}</p>}
            </div>
            <div data-error={Boolean(err('phone'))}>
              <label className="label" htmlFor="phone">Phone / WhatsApp *</label>
              <input id="phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0803 000 0000" inputMode="tel" />
              {err('phone') && <p className="mt-1 text-xs text-red-600">{err('phone')}</p>}
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input id="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" inputMode="email" />
              {err('email') && <p className="mt-1 text-xs text-red-600">{err('email')}</p>}
            </div>
            <div>
              <label className="label" htmlFor="qty">Quantity *</label>
              <input id="qty" type="number" min={1} max={100} className="input" value={form.qty} onChange={(e) => set('qty', Number(e.target.value))} />
              {err('qty') && <p className="mt-1 text-xs text-red-600">{err('qty')}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="px-1 font-display text-lg font-semibold">What are we baking?</legend>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label" htmlFor="type">Order type *</label>
              <select id="type" className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, item: '', flavor: '', size: '' }))}>
                {ORDER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="item">Item (optional)</label>
              <select id="item" className="input" value={itemOptions.includes(form.item) ? form.item : ''} onChange={(e) => {
                const name = e.target.value;
                const cake = cakes.find((c) => c.name === name);
                setForm((f) => ({
                  ...f,
                  item: name,
                  flavor: cake?.flavors[0] || f.flavor,
                  size: cake?.sizes[0]?.label || '',
                }));
              }}>
                <option value="">Not sure yet — advise me</option>
                {itemOptions.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-charcoal/45">
                Browsing{' '}
                {CATEGORY_LABELS[typeToCategory[form.type] as keyof typeof CATEGORY_LABELS] ||
                  form.type}
                {} — leave blank for a custom quote.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="flavor">Flavour</label>
                <select id="flavor" className="input" value={form.flavor} onChange={(e) => set('flavor', e.target.value)}>
                  <option value="">Let us choose</option>
                  {flavorOptions.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="size">Size</label>
                <select id="size" className="input" value={form.size} onChange={(e) => set('size', e.target.value)}>
                  <option value="">Not sure yet</option>
                  {sizeOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="inscription">Inscription on the cake (optional)</label>
              <input id="inscription" className="input" maxLength={200} value={form.inscription} onChange={(e) => set('inscription', e.target.value)} placeholder='e.g. "Happy Birthday Ada!"' />
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="px-1 font-display text-lg font-semibold">When & how?</legend>
          <div className="mt-4 space-y-4">
            <div data-error={Boolean(err('neededDate'))}>
              <label className="label" htmlFor="neededDate">Needed by *</label>
              <input id="neededDate" type="date" min={minOrderDate()} className="input" value={form.neededDate} onChange={(e) => set('neededDate', e.target.value)} />
              {err('neededDate') ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {err('neededDate')}
                </p>
              ) : (
                <p className="mt-1 text-xs text-charcoal/45">Minimum 2 days from today</p>
              )}
            </div>
            <div>
              <span className="label">Fulfilment *</span>
              <div className="flex gap-2">
                {['Pickup', 'Delivery'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('delivery', d)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      form.delivery === d
                        ? 'border-clay bg-clay/10 text-cocoa'
                        : 'border-sand bg-white text-charcoal/60 hover:border-charcoal/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {form.delivery === 'Delivery' && (
              <>
                <div data-error={Boolean(err('area'))}>
                  <label className="label" htmlFor="area">Delivery area in Jos *</label>
                  <select id="area" className="input" value={form.area} onChange={(e) => set('area', e.target.value)}>
                    <option value="">Select an area</option>
                    {PLATEAU_AREAS.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  {err('area') && <p className="mt-1 text-xs text-red-600">{err('area')}</p>}
                </div>
                <div data-error={Boolean(err('address'))}>
                  <label className="label" htmlFor="address">Street address / landmark *</label>
                  <input id="address" className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Behind Total Filling Station, Rayfield" />
                  {err('address') && <p className="mt-1 text-xs text-red-600">{err('address')}</p>}
                </div>
              </>
            )}
            <div>
              <label className="label" htmlFor="notes">Notes (colours, design ideas, allergies…)</label>
              <textarea id="notes" rows={3} className="input resize-none" maxLength={1000} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Gold and white theme, serves about 20 people…" />
            </div>
            <div>
              <span className="label">Inspiration photo (optional, max 2MB)</span>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-charcoal/25 bg-cream px-4 py-3 text-sm text-charcoal/60 transition hover:border-clay hover:text-charcoal">
                <Camera className="h-5 w-5 text-clay" />
                <span className="truncate">{photo ? photo.name : 'Choose an image (jpg, png, webp)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              </label>
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            </div>
          </div>
        </fieldset>

        <div className="lg:col-span-2">
          {formError && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                'Sending…'
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit order request
                </>
              )}
            </button>
            <a
              href={waLink(`Hello Relish Torte! I want to order: ${form.item || form.type || 'something custom'} for ${form.neededDate || 'a date I will share'}.`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Skip — WhatsApp instead
            </a>
            <span className="text-xs text-charcoal/50">We reply day or night.</span>
          </div>
        </div>
      </form>
    </div>
  );
}
