import { useCallback, useEffect, useState } from 'react';
import {
  LogOut,
  ClipboardList,
  Cake,
  Star,
  Eye,
  EyeOff,
  Check,
  X,
  Trash2,
  Lock,
  CakeSlice,
} from 'lucide-react';
import { apiGet, apiSend, ApiError } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import { prettyDate } from '../lib/format';
import type { AdminOrder, Cake as CakeT, Review, OrderStatus } from '../lib/types';
import { CATEGORY_LABELS, ORDER_STATUSES } from '../lib/types';
import StarRating from '../components/StarRating';

const TOKEN_KEY = 'rt_admin_token';

const statusBadge: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-amber-100 text-amber-800',
  baking: 'bg-orange-100 text-orange-800',
  ready: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-charcoal/10 text-charcoal/70',
};

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await apiSend<{ token: string }>('POST', '/api/admin/login', { email, password });
      onLogin(res.token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-white">
          <CakeSlice className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold">Relish Torte Admin</h1>
        <p className="mt-1 text-center text-xs text-charcoal/50">Orders, menu & reviews</p>
        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="mt-5 space-y-3">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>
          <Lock className="h-4 w-4" />
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    apiGet<AdminOrder[]>('/api/admin/orders', token()).then(setOrders).catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);
  useEffect(load, [load]);

  async function setStatus(id: number, status: OrderStatus) {
    try {
      await apiSend('PATCH', `/api/admin/orders/${id}`, { status }, token());
      setOrders((prev) => (prev ? prev.map((o) => (o.id === id ? { ...o, status } : o)) : prev));
    } catch {
      setError('Could not update status');
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!orders) return <div className="h-40 animate-pulse rounded-3xl bg-sand" />;

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === 'all' ? 'bg-charcoal text-white' : 'border border-charcoal/15 text-charcoal/70'}`}
        >
          All ({orders.length})
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === s.value ? 'bg-charcoal text-white' : 'border border-charcoal/15 text-charcoal/70'}`}
          >
            {s.label} ({counts(s.value)})
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {visible.length === 0 && (
          <p className="card p-8 text-center text-sm text-charcoal/50">No orders here yet.</p>
        )}
        {visible.map((o) => (
          <div key={o.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-cocoa">{o.ref}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${statusBadge[o.status]}`}>
                    {o.status}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold">
                  {o.name} <span className="font-normal text-charcoal/60">· {o.phone}</span>
                </p>
                <p className="mt-1 text-sm text-charcoal/70">
                  <strong>{o.qty}×</strong> {o.item || o.type}
                  {o.size ? ` — ${o.size}` : ''}
                  {o.flavor ? ` — ${o.flavor}` : ''}
                </p>
                {o.inscription && (
                  <p className="mt-1 text-xs italic text-charcoal/55">Inscription: “{o.inscription}”</p>
                )}
              </div>
              <div className="text-right text-xs text-charcoal/55">
                <p className="font-semibold text-charcoal/75">Needed {prettyDate(o.needed_date)}</p>
                <p>
                  {o.delivery}
                  {o.delivery === 'Delivery' && o.area ? ` · ${o.area}` : ''}
                </p>
                <p>Received {prettyDate(o.created_at)}</p>
              </div>
            </div>
            {(o.address || o.notes || o.email) && (
              <div className="mt-3 rounded-xl bg-cream p-3 text-xs leading-relaxed text-charcoal/65">
                {o.address && <p>Address: {o.address}</p>}
                {o.email && <p>Email: {o.email}</p>}
                {o.notes && <p>Notes: {o.notes}</p>}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-charcoal/50">Status:</label>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(o.id, s.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    o.status === s.value
                      ? 'bg-clay text-white'
                      : 'border border-charcoal/15 text-charcoal/60 hover:border-clay hover:text-clay'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuTab() {
  const [items, setItems] = useState<CakeT[] | null>(null);
  const [msg, setMsg] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'celebration',
    price: '',
    description: '',
    flavors: '',
    image: '/images/cake-custom.svg',
  });

  const load = useCallback(() => {
    apiGet<CakeT[]>('/api/menu', token()).then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);

  async function patch(id: number, body: Record<string, unknown>, apply: (c: CakeT) => CakeT) {
    try {
      await apiSend('PUT', `/api/admin/menu/${id}`, body, token());
      setItems((prev) => (prev ? prev.map((c) => (c.id === id ? apply(c) : c)) : prev));
      setMsg('Saved.');
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Update failed');
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this item permanently?')) return;
    try {
      await apiSend('DELETE', `/api/admin/menu/${id}`, undefined, token());
      setItems((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
      setMsg('Item deleted.');
    } catch {
      setMsg('Delete failed');
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (newItem.name.trim().length < 2) return setMsg('Name is required');
    try {
      await apiSend('POST', '/api/admin/menu', {
        name: newItem.name,
        category: newItem.category,
        price_from: newItem.price === '' ? null : Number(newItem.price),
        description: newItem.description,
        flavors: newItem.flavors,
        image: newItem.image,
        sizes: [],
      }, token());
      setNewItem({ ...newItem, name: '', price: '', description: '', flavors: '' });
      setMsg('Item added.');
      load();
    } catch (e2) {
      setMsg(e2 instanceof ApiError ? e2.message : 'Add failed');
    }
  }

  if (!items) return <div className="h-40 animate-pulse rounded-3xl bg-sand" />;

  return (
    <div>
      {msg && <p className="mb-4 rounded-xl bg-cream px-4 py-2.5 text-xs text-charcoal/70">{msg}</p>}

      <form onSubmit={add} className="card mb-6 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" placeholder="New item name *" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
        <select className="input" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input className="input" type="number" min={0} placeholder="Price (₦) — blank = quote" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
        <input className="input" placeholder="Image path" value={newItem.image} onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="Flavours, comma separated" value={newItem.flavors} onChange={(e) => setNewItem({ ...newItem, flavors: e.target.value })} />
        <button type="submit" className="btn btn-primary sm:col-span-2 lg:col-span-4">
          <Cake className="h-4 w-4" /> Add menu item
        </button>
      </form>

      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-center gap-4 p-4">
            <img src={c.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <div className="min-w-[160px] flex-1">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-charcoal/50">{CATEGORY_LABELS[c.category]}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-charcoal/50" htmlFor={`p${c.id}`}>from</label>
              <input
                id={`p${c.id}`}
                type="number"
                min={0}
                className="input !w-28 !px-2 !py-1.5 text-right"
                defaultValue={c.price_from ?? ''}
                placeholder="quote"
                onBlur={(e) => {
                  const v = e.target.value === '' ? null : Number(e.target.value);
                  if (v !== c.price_from) patch(c.id, { price_from: v }, (x) => ({ ...x, price_from: v }));
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => patch(c.id, { available: c.available ? 0 : 1 }, (x) => ({ ...x, available: !x.available }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${c.available ? 'bg-leaf/15 text-leaf' : 'bg-charcoal/10 text-charcoal/50'}`}
            >
              {c.available ? <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Visible</span> : <span className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /> Hidden</span>}
            </button>
            <button
              type="button"
              onClick={() => patch(c.id, { featured: c.featured ? 0 : 1 }, (x) => ({ ...x, featured: !x.featured }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${c.featured ? 'bg-gold text-white' : 'border border-charcoal/15 text-charcoal/60'}`}
            >
              Bestseller
            </button>
            <button
              type="button"
              onClick={() => remove(c.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal/40 transition hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [pending, setPending] = useState<Review[]>([]);
  const [approved, setApproved] = useState<Review[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    apiGet<Review[]>('/api/admin/reviews?pending=1', token()).then(setPending).catch(() => setPending([]));
    apiGet<Review[]>('/api/admin/reviews', token())
      .then((all) => setApproved(all.filter((r) => r.approved)))
      .catch(() => setApproved([]));
  }, []);
  useEffect(load, [load]);

  async function setApprovedState(id: number, value: 0 | 1) {
    try {
      await apiSend('PATCH', `/api/admin/reviews/${id}`, { approved: value }, token());
      setMsg(value ? 'Review published.' : 'Review hidden.');
      load();
    } catch {
      setMsg('Update failed');
    }
  }

  return (
    <div className="space-y-8">
      {msg && <p className="rounded-xl bg-cream px-4 py-2.5 text-xs text-charcoal/70">{msg}</p>}

      <section>
        <h2 className="font-display text-lg font-semibold">Pending review ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 && <p className="text-sm text-charcoal/50">Nothing waiting for approval.</p>}
          {pending.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {r.name}
                    {r.location ? <span className="font-normal text-charcoal/50"> · {r.location}</span> : null}
                  </p>
                  <StarRating value={r.rating} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setApprovedState(r.id, 1)} className="flex items-center gap-1 rounded-lg bg-leaf/15 px-3 py-1.5 text-xs font-semibold text-leaf transition hover:bg-leaf/25">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button type="button" onClick={() => setApprovedState(r.id, 0)} className="flex items-center gap-1 rounded-lg bg-charcoal/10 px-3 py-1.5 text-xs font-semibold text-charcoal/60 transition hover:bg-charcoal/20">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Published ({approved.length})</h2>
        <div className="mt-3 space-y-3">
          {approved.length === 0 && <p className="text-sm text-charcoal/50">No published reviews yet.</p>}
          {approved.map((r) => (
            <div key={r.id} className="card flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold">{r.name} · {prettyDate(r.created_at)}</p>
                <StarRating value={r.rating} />
                <p className="mt-2 text-sm text-charcoal/70">{r.text}</p>
              </div>
              <button type="button" onClick={() => setApprovedState(r.id, 0)} className="flex items-center gap-1 rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-semibold text-charcoal/60 transition hover:border-clay hover:text-clay">
                <EyeOff className="h-3.5 w-3.5" /> Hide
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function token(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export default function Admin() {
  useTitle('Admin — Relish Torte');
  const [authed, setAuthed] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_KEY)));
  const [tab, setTab] = useState<'orders' | 'menu' | 'reviews'>('orders');

  useEffect(() => {
    if (!authed) return;
    apiGet<{ email: string }>('/api/admin/me', token()).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setAuthed(false);
    });
  }, [authed]);

  if (!authed) {
    return (
      <Login
        onLogin={(t) => {
          localStorage.setItem(TOKEN_KEY, t);
          setAuthed(true);
        }}
      />
    );
  }

  const tabs = [
    { key: 'orders' as const, label: 'Orders', icon: ClipboardList },
    { key: 'menu' as const, label: 'Menu', icon: Cake },
    { key: 'reviews' as const, label: 'Reviews', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay text-white">
              <CakeSlice className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold">Relish Torte · Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition sm:text-sm ${
                  tab === t.key ? 'bg-charcoal text-white' : 'text-charcoal/60 hover:bg-sand'
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                setAuthed(false);
              }}
              className="ml-1 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-charcoal/60 transition hover:bg-sand sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {tab === 'orders' && <OrdersTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'reviews' && <ReviewsTab />}
      </main>
    </div>
  );
}
