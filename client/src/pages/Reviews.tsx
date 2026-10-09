import { useEffect, useState } from 'react';
import { PenLine, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, apiSend, ApiError } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import type { Review } from '../lib/types';
import Testimonials from '../components/Testimonials';
import StarRating from '../components/StarRating';

export default function Reviews() {
  useTitle('Reviews — Relish Torte, Jos');
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiGet<Review[]>('/api/reviews').then(setReviews).catch(() => setReviews([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Please enter your name';
    if (text.trim().length < 10) errs.text = 'A few more words, please (min 10 characters)';
    setFields(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await apiSend('POST', '/api/reviews', { name, location, rating, text });
      setDone(true);
      setName('');
      setLocation('');
      setText('');
      setRating(5);
    } catch (e2) {
      if (e2 instanceof ApiError) {
        setFields(e2.fields);
        setError(e2.message);
      } else {
        setError('Could not submit your review. Please try again.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="section container-x">
      <div className="max-w-2xl">
        <p className="eyebrow">Reviews</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          Loved by celebrations across Jos
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/60">
          Real words from customers who trusted us with their biggest moments — birthdays,
          weddings, office treats and quiet cravings.
        </p>
      </div>

      <div className="mt-10">
        {reviews === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-56 animate-pulse bg-sand/60" />
            ))}
          </div>
        ) : (
          <Testimonials reviews={reviews} />
        )}
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-7 sm:p-9">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay/10 text-clay">
              <PenLine className="h-5 w-5" />
            </span>
            <h2 className="font-display text-xl font-semibold">Share your experience</h2>
          </div>

          {done ? (
            <div className="mt-6 rounded-2xl bg-leaf/10 p-5 text-sm text-leaf">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Thank you!
              </p>
              <p className="mt-1 text-charcoal/70">
                Your review is in the queue — it will appear on this page after a quick check.
              </p>
              <button type="button" className="btn btn-outline mt-4" onClick={() => setDone(false)}>
                Write another review
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="rname">Your name *</label>
                  <input id="rname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ngozi A." />
                  {fields.name && <p className="mt-1 text-xs text-red-600">{fields.name}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="rloc">Area (optional)</label>
                  <input id="rloc" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Rayfield" />
                </div>
              </div>
              <div>
                <span className="label">Rating</span>
                <StarRating value={rating} onChange={setRating} size="h-6 w-6" />
              </div>
              <div>
                <label className="label" htmlFor="rtext">Your review *</label>
                <textarea id="rtext" rows={4} className="input resize-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell us about the cake, the service, the reactions…" />
                {fields.text && <p className="mt-1 text-xs text-red-600">{fields.text}</p>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? 'Sending…' : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit review
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="card h-fit p-7">
          <h2 className="font-display text-xl font-semibold">Why people order again</h2>
          <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-charcoal/70">
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              Baked fresh to order — never sitting on a shelf.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              Open 24 hours: last-minute plans are welcome.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              Custom designs matched to your inspiration photos.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
              Delivery across Jos and pickup any time of day.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
