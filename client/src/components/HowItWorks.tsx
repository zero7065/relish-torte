import { MessageCircle, Cake, Truck } from 'lucide-react';

const steps = [
  {
    icon: Cake,
    title: '1. Pick your treat',
    text: 'Choose from our menu — cakes, cupcake boxes, loaves and fresh confectioneries — or describe a custom design.',
  },
  {
    icon: MessageCircle,
    title: '2. Send the details',
    text: 'Order through the form or WhatsApp us with your flavour, size, date and inscription. We confirm within minutes.',
  },
  {
    icon: Truck,
    title: '3. Baked & delivered',
    text: 'We bake fresh around the clock, then deliver across Jos or hold it for pickup at our kitchen.',
  },
];

export default function HowItWorks() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {steps.map((s) => (
        <div key={s.title} className="card p-7">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay/10 text-clay">
            <s.icon className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
