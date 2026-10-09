import { Link } from 'react-router-dom';
import { Phone, Instagram, Clock, MapPin, MessageCircle, HeartHandshake, Cake, Truck } from 'lucide-react';
import { useTitle } from '../lib/useTitle';
import {
  PHONE_DISPLAY,
  PHONE_INTL,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  MAPS_URL,
  waLink,
  DEFAULT_WA_MESSAGE,
} from '../lib/contact';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

const gallery = [
  { src: '/images/cake-red-velvet.svg', alt: 'Red velvet cake' },
  { src: '/images/cupcake-12.svg', alt: 'Box of cupcakes' },
  { src: '/images/meat-pie.svg', alt: 'Fresh meat pies' },
  { src: '/images/cake-fruit.svg', alt: 'Celebration fruit cake' },
];

export default function About() {
  useTitle('About & Contact — Relish Torte, Jos');

  return (
    <div className="section container-x">
      <div className="max-w-2xl">
        <p className="eyebrow">About us</p>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
          A little bakery in Jos with big dreams
        </h1>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4 text-sm leading-relaxed text-charcoal/70 sm:text-base">
          <p>
            <strong className="text-charcoal">Relish Torte</strong> is a Plateau State bakery born
            from a simple belief: every celebration deserves a cake worth remembering. From
            intimate birthday boxes to full wedding tiers, everything is mixed, layered and
            finished by hand in our Jos kitchen.
          </p>
          <p>
            Alongside our cakes we bake the small things that make Nigerian gatherings feel
            complete — flaky meat pies, crisp samosa, sausage rolls, fluffy doughnuts and banana
            bread that never lasts the day.
          </p>
          <p>
            We are open <strong className="text-charcoal">24 hours, 7 days a week</strong>. Whether
            it is a midnight craving or a sunrise delivery, the ovens are on and we are ready.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/menu" className="btn btn-primary">
              See what we bake
            </Link>
            <a href={waLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noreferrer" className="btn btn-wa">
              <WhatsAppIcon className="h-4 w-4" />
              Chat with us
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {gallery.map((g) => (
            <div key={g.src} className="overflow-hidden rounded-3xl bg-sand shadow-soft">
              <img src={g.src} alt={g.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-105" />
            </div>
          ))}
        </div>
      </div>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay/10 text-clay">
            <Cake className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-display text-lg font-semibold">Made to order</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">
            Cakes, cupcake boxes, loaves and small chops — baked fresh after you order, never
            before.
          </p>
        </div>
        <div className="card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay/10 text-clay">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-display text-lg font-semibold">Custom designs</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">
            Send an inspiration photo and our decorators will match the colours, tiers and
            details.
          </p>
        </div>
        <div className="card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay/10 text-clay">
            <Truck className="h-5 w-5" />
          </span>
          <h2 className="mt-3 font-display text-lg font-semibold">Jos-wide delivery</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">
            We deliver across Jos and Plateau hotspots, or hold your order for pickup any time.
          </p>
        </div>
      </section>

      <section className="card mt-16 p-8 sm:p-10">
        <h2 className="font-display text-2xl font-semibold">Get in touch</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <a href={`tel:+${PHONE_INTL}`} className="group rounded-2xl border border-sand bg-cream p-5 transition hover:border-clay">
            <Phone className="h-5 w-5 text-clay" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal/50">Call us</p>
            <p className="mt-1 font-semibold group-hover:text-clay">{PHONE_DISPLAY}</p>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="group rounded-2xl border border-sand bg-cream p-5 transition hover:border-clay">
            <Instagram className="h-5 w-5 text-clay" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal/50">Instagram</p>
            <p className="mt-1 font-semibold group-hover:text-clay">{INSTAGRAM_HANDLE}</p>
          </a>
          <div className="rounded-2xl border border-sand bg-cream p-5">
            <Clock className="h-5 w-5 text-clay" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal/50">Hours</p>
            <p className="mt-1 font-semibold">Open 24/7</p>
          </div>
          <a href={MAPS_URL} target="_blank" rel="noreferrer" className="group rounded-2xl border border-sand bg-cream p-5 transition hover:border-clay">
            <MapPin className="h-5 w-5 text-clay" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-charcoal/50">Location</p>
            <p className="mt-1 font-semibold group-hover:text-clay">Jos, Plateau State</p>
          </a>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-charcoal p-5 text-sm text-cream/80">
          <MessageCircle className="h-5 w-5 shrink-0 text-[#25D366]" />
          <span>
            Fastest reply is always WhatsApp — tap the green button anytime, day or night.
          </span>
        </div>
      </section>
    </div>
  );
}
