import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Cake } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { waLink, DEFAULT_WA_MESSAGE } from '../lib/contact';

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/order', label: 'Order' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition ${
        scrolled ? 'bg-cream/90 shadow-soft backdrop-blur-md' : 'bg-cream/70 backdrop-blur-sm'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between sm:h-20">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay text-white sm:h-10 sm:w-10">
            <Cake className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
              Relish Torte
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal/50 sm:block">
              Jos &middot; Plateau State
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition hover:text-clay ${isActive ? 'text-clay' : 'text-charcoal/75'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <a href={waLink(DEFAULT_WA_MESSAGE)} target="_blank" rel="noreferrer" className="btn btn-wa !px-5 !py-2.5">
            <WhatsAppIcon className="h-4 w-4" />
            Order on WhatsApp
          </a>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-charcoal/10 text-charcoal md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-sand bg-cream md:hidden">
          <nav className="container-x flex flex-col gap-1 py-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-clay/10 text-clay' : 'text-charcoal/80 hover:bg-sand'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href={waLink(DEFAULT_WA_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-wa mt-2"
              onClick={() => setOpen(false)}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Order on WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
