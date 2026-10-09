import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Instagram, Cake } from 'lucide-react';
import {
  PHONE_DISPLAY,
  PHONE_INTL,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  waLink,
  DEFAULT_WA_MESSAGE,
} from '../lib/contact';

export default function Footer() {
  return (
    <footer className="bg-cocoa text-cream/85">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay text-white">
              <Cake className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-semibold text-white">Relish Torte</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Celebration cakes, cupcake boxes and fresh confectioneries — baked from scratch and
            delivered across Jos, Plateau State.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="transition hover:text-white" to="/menu">Full menu</Link></li>
            <li><Link className="transition hover:text-white" to="/order">Place an order</Link></li>
            <li><Link className="transition hover:text-white" to="/reviews">Customer reviews</Link></li>
            <li><Link className="transition hover:text-white" to="/about">About us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a href={`tel:+${PHONE_INTL}`} className="flex items-center gap-2 transition hover:text-white">
                <Phone className="h-4 w-4 text-clay" /> {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={waLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
                WhatsApp us — 24/7
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition hover:text-white">
                <Instagram className="h-4 w-4 text-clay" /> {INSTAGRAM_HANDLE}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-clay" /> Open 24 hours, every day
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-clay" /> Jos, Plateau State, Nigeria
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">We deliver to</h3>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Jos North, Jos South, Jos East, Jos West, Rayfield, Bukuru, Barkin Ladi, Riyom, Bassa
            and Mangu. Pickup from our kitchen available around the clock.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/55 sm:flex-row">
          <span>© {new Date().getFullYear()} Relish Torte. Baked with love in Jos.</span>
          <span>Orders: {PHONE_DISPLAY} · Instagram {INSTAGRAM_HANDLE}</span>
        </div>
      </div>
    </footer>
  );
}
