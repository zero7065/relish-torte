import { WhatsAppIcon } from './WhatsAppIcon';
import { waLink, DEFAULT_WA_MESSAGE } from '../lib/contact';

export default function WhatsAppFloat() {
  return (
    <a
      href={waLink(DEFAULT_WA_MESSAGE)}
      target="_blank"
      rel="noreferrer"
      title="Order on WhatsApp — we reply 24/7"
      aria-label="Order on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition duration-200 hover:scale-105 hover:bg-[#1EBE5A] sm:bottom-7 sm:right-7"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
