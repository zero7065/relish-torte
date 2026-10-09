import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Sparkles, ArrowRight } from 'lucide-react';
import { apiGet } from '../lib/api';
import { useTitle } from '../lib/useTitle';
import { waLink, DEFAULT_WA_MESSAGE, PHONE_DISPLAY } from '../lib/contact';
import type { Cake, Review, Category } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/types';
import CakeCard from '../components/CakeCard';
import Testimonials from '../components/Testimonials';
import HowItWorks from '../components/HowItWorks';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

const categoryCards: { key: Category; image: string }[] = [
  { key: 'celebration', image: '/images/cake-red-velvet.svg' },
  { key: 'cupcakes', image: '/images/cupcake-12.svg' },
  { key: 'loaves', image: '/images/cake-banana.svg' },
  { key: 'confectioneries', image: '/images/meat-pie.svg' },
];

export default function Home() {
  useTitle('Relish Torte — Cakes, Cupcakes & Confectioneries in Jos');
  const [featured, setFeatured] = useState<Cake[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    apiGet<Cake[]>('/api/menu?featured=1').then(setFeatured).catch(() => setFeatured([]));
    apiGet<Review[]>('/api/reviews').then((r) => setReviews(r.slice(0, 3))).catch(() => setReviews([]));
  }, []);

  return (
    <>
      <section className="relative flex min-h-[86vh] items-center overflow-hidden">
        <img src="/images/hero.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/60 to-charcoal/20" />
        <div className="container-x relative py-20">
          <div className="max-w-2xl text-white">
            <p className="animate-fade-up eyebrow !text-blush">Jos · Plateau State · Open 24/7</p>
            <h1 className="animate-fade-up delay-1 mt-4 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Beautiful cakes, baked fresh around the clock.
            </h1>
            <p className="animate-fade-up delay-2 mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Relish Torte crafts celebration cakes, cupcake boxes and Nigerian confectioneries —
              samosa, meat pies and more — baked to order and delivered across Jos.
            </p>
            <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
              <a href={waLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noreferrer" className="btn btn-wa">
                <WhatsAppIcon className="h-4 w-4" />
                Order on WhatsApp
              </a>
              <Link to="/menu" className="btn btn-light">
                Explore the menu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="animate-fade-up delay-3 mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blush" /> Open 24 hours
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-gold text-gold" /> Loved across Jos
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-blush" /> Custom designs welcome
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container-x">
        <div className="max-w-2xl">
          <p className="eyebrow">What we bake</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            From celebration tiers to lunchbox treats
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((c) => (
            <Link
              key={c.key}
              to={`/menu?cat=${c.key}`}
              className="group card overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="aspect-[4/3] overflow-hidden bg-sand">
                <img
                  src={c.image}
                  alt={CATEGORY_LABELS[c.key]}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-display text-base font-semibold">{CATEGORY_LABELS[c.key]}</span>
                <ArrowRight className="h-4 w-4 text-clay transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Bestsellers</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                Jos keeps coming back for these
              </h2>
            </div>
            <Link to="/menu" className="text-sm font-semibold text-clay hover:text-cocoa">
              View full menu →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card h-96 animate-pulse bg-sand/60" />
                ))
              : featured.slice(0, 6).map((cake) => <CakeCard key={cake.slug} cake={cake} />)}
          </div>
        </div>
      </section>

      <section className="section container-x">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Ordering is simple</h2>
        </div>
        <div className="mt-10">
          <HowItWorks />
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Kind words</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                What our customers say
              </h2>
            </div>
            <Link to="/reviews" className="text-sm font-semibold text-clay hover:text-cocoa">
              Read all reviews →
            </Link>
          </div>
          <div className="mt-10">
            {reviews.length ? (
              <Testimonials reviews={reviews} />
            ) : (
              <p className="text-sm text-charcoal/50">Be the first to leave a review!</p>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-cocoa">
        <div className="container-x relative flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <h2 className="max-w-2xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Craving something sweet at 2AM? We are awake.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-cream/70">
            Relish Torte bakes 24 hours a day, 7 days a week. Call {PHONE_DISPLAY}, WhatsApp us, or
            place your order online — we will confirm within minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={waLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noreferrer" className="btn btn-wa">
              <WhatsAppIcon className="h-4 w-4" />
              Chat with us
            </a>
            <Link to="/order" className="btn btn-light">
              Fill the order form
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
