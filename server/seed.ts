import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

interface SeedCake {
  slug: string;
  name: string;
  category: string;
  description: string;
  price_from: number | null;
  sizes: { label: string; price: number | null }[];
  flavors: string[];
  image: string;
  available: number;
  featured: number;
  sort_order: number;
}

const ALL_CAKE_FLAVORS = [
  'Chocolate',
  'Vanilla',
  'Red velvet',
  'Banana bread',
  'Fruit cake',
  'Carrot cake',
  'Coconut cake',
];

const size6 = { label: '6" — serves 8–10', price: 15000 };
const size8 = { label: '8" — serves 16–20', price: 25000 };
const size10 = { label: '10" — serves 30–35', price: 40000 };

export const seedCakes: SeedCake[] = [
  {
    slug: 'box-of-6-cupcakes',
    name: 'Box of 6 Cupcakes',
    category: 'cupcakes',
    description:
      'Six hand-finished cupcakes in your choice of chocolate, vanilla or red velvet — boxed beautifully for small celebrations, gifting or office treats.',
    price_from: 8000,
    sizes: [{ label: 'Box of 6', price: 8000 }],
    flavors: ['Chocolate', 'Vanilla', 'Red velvet'],
    image: '/images/cupcake-6.svg',
    available: 1,
    featured: 1,
    sort_order: 10,
  },
  {
    slug: 'box-of-12-cupcakes',
    name: 'Box of 12 Cupcakes',
    category: 'cupcakes',
    description:
      'A dozen of our signature cupcakes — mix chocolate, vanilla and red velvet, finished with swirled buttercream. Our best-selling party box.',
    price_from: 15000,
    sizes: [{ label: 'Box of 12', price: 15000 }],
    flavors: ['Chocolate', 'Vanilla', 'Red velvet'],
    image: '/images/cupcake-12.svg',
    available: 1,
    featured: 1,
    sort_order: 11,
  },
  {
    slug: 'chocolate-cake',
    name: 'Chocolate Cake',
    category: 'celebration',
    description:
      'Deep, fudgy chocolate sponge layered with silky chocolate ganache — our most-loved birthday cake.',
    price_from: 15000,
    sizes: [size6, size8, size10],
    flavors: ['Chocolate'],
    image: '/images/cake-chocolate.svg',
    available: 1,
    featured: 1,
    sort_order: 20,
  },
  {
    slug: 'vanilla-cake',
    name: 'Vanilla Cake',
    category: 'celebration',
    description:
      'Light, fluffy vanilla sponge layered with smooth buttercream — timeless, kid-friendly and endlessly customisable.',
    price_from: 15000,
    sizes: [size6, size8, size10],
    flavors: ['Vanilla'],
    image: '/images/cake-vanilla.svg',
    available: 1,
    featured: 0,
    sort_order: 21,
  },
  {
    slug: 'red-velvet-cake',
    name: 'Red Velvet Cake',
    category: 'celebration',
    description:
      'Classic crimson layers with cream cheese frosting, finished with delicate red velvet crumbs.',
    price_from: 18000,
    sizes: [
      { label: '6" — serves 8–10', price: 18000 },
      { label: '8" — serves 16–20', price: 28000 },
      { label: '10" — serves 30–35', price: 45000 },
    ],
    flavors: ['Red velvet'],
    image: '/images/cake-red-velvet.svg',
    available: 1,
    featured: 1,
    sort_order: 22,
  },
  {
    slug: 'carrot-cake',
    name: 'Carrot Cake',
    category: 'celebration',
    description:
      'Moist spiced carrot cake with walnuts, layered and topped with cream cheese frosting.',
    price_from: 15000,
    sizes: [size6, size8, size10],
    flavors: ['Carrot cake'],
    image: '/images/cake-carrot.svg',
    available: 1,
    featured: 0,
    sort_order: 23,
  },
  {
    slug: 'coconut-cake',
    name: 'Coconut Cake',
    category: 'celebration',
    description:
      'Fragrant coconut sponge layered with coconut cream frosting and finished with toasted coconut flakes.',
    price_from: 15000,
    sizes: [size6, size8, size10],
    flavors: ['Coconut cake'],
    image: '/images/cake-coconut.svg',
    available: 1,
    featured: 0,
    sort_order: 24,
  },
  {
    slug: 'fruit-cake',
    name: 'Fruit Cake',
    category: 'celebration',
    description:
      'Rich Nigerian-style fruit cake loaded with mixed fruits and warm spice — a wedding and celebration favourite.',
    price_from: 18000,
    sizes: [
      { label: '6" — serves 8–10', price: 18000 },
      { label: '8" — serves 16–20', price: 30000 },
      { label: '10" — serves 30–35', price: 50000 },
    ],
    flavors: ['Fruit cake'],
    image: '/images/cake-fruit.svg',
    available: 1,
    featured: 1,
    sort_order: 25,
  },
  {
    slug: 'custom-cake',
    name: 'Custom Baked Cake',
    category: 'celebration',
    description:
      'Your design, your flavours. Send an inspiration photo and we will bring it to life — birthdays, weddings, graduations and corporate orders.',
    price_from: null,
    sizes: [{ label: 'Custom quote — tell us the size & design', price: null }],
    flavors: ALL_CAKE_FLAVORS,
    image: '/images/cake-custom.svg',
    available: 1,
    featured: 0,
    sort_order: 26,
  },
  {
    slug: 'banana-bread',
    name: 'Banana Bread Loaf',
    category: 'loaves',
    description:
      'Sweet-ripe banana loaf baked daily — served plain or with a walnut top. Perfect with tea.',
    price_from: 5000,
    sizes: [
      { label: 'Loaf', price: 5000 },
      { label: 'Family loaf', price: 8000 },
    ],
    flavors: ['Plain', 'Walnut', 'Chocolate chip'],
    image: '/images/cake-banana.svg',
    available: 1,
    featured: 0,
    sort_order: 40,
  },
  {
    slug: 'samosa',
    name: 'Samosa (Pack of 10)',
    category: 'confectioneries',
    description:
      'Crisp golden pastry pockets filled with spiced minced meat or vegetables — fried fresh to order.',
    price_from: 3000,
    sizes: [
      { label: 'Pack of 10', price: 3000 },
      { label: 'Tray of 25', price: 7000 },
    ],
    flavors: ['Meat', 'Veggie', 'Mixed'],
    image: '/images/samosa.svg',
    available: 1,
    featured: 0,
    sort_order: 50,
  },
  {
    slug: 'meat-pie',
    name: 'Meat Pie (Pack of 10)',
    category: 'confectioneries',
    description:
      'Flaky pastry packed with savoury minced meat, potato and carrot — Jos’ perfect snack.',
    price_from: 4500,
    sizes: [
      { label: 'Pack of 10', price: 4500 },
      { label: 'Tray of 25', price: 10500 },
    ],
    flavors: ['Classic'],
    image: '/images/meat-pie.svg',
    available: 1,
    featured: 1,
    sort_order: 51,
  },
  {
    slug: 'sausage-roll',
    name: 'Sausage Roll (Pack of 12)',
    category: 'confectioneries',
    description: 'Buttery pastry wrapped around seasoned sausage — baked golden, sold in packs.',
    price_from: 4000,
    sizes: [
      { label: 'Pack of 12', price: 4000 },
      { label: 'Tray of 24', price: 7500 },
    ],
    flavors: ['Classic'],
    image: '/images/sausage-roll.svg',
    available: 1,
    featured: 0,
    sort_order: 52,
  },
  {
    slug: 'doughnuts',
    name: 'Doughnuts (Pack of 6)',
    category: 'confectioneries',
    description: 'Soft, fluffy doughnuts — sugar dusted, glazed or chocolate topped.',
    price_from: 3500,
    sizes: [
      { label: 'Pack of 6', price: 3500 },
      { label: 'Pack of 12', price: 6500 },
    ],
    flavors: ['Sugar dusted', 'Glazed', 'Chocolate'],
    image: '/images/doughnut.svg',
    available: 1,
    featured: 0,
    sort_order: 53,
  },
];

const seedReviews = [
  {
    name: 'Chidinma O.',
    location: 'Jos',
    rating: 5,
    text: 'The red velvet cake for my daughter’s birthday was the highlight of the party. Moist, fresh and not too sweet — exactly how we asked for it. Delivered right on time!',
  },
  {
    name: 'Mrs. Aisha Bello',
    location: 'Rayfield',
    rating: 5,
    text: 'We ordered a fruit cake for our traditional wedding and everybody was asking who baked it. Rich, moist and beautifully finished. We are customers for life.',
  },
  {
    name: 'Emeka N.',
    location: 'Jos South',
    rating: 5,
    text: 'Ordered a box of 12 cupcakes at 10pm for an office surprise — it was delivered by 8am. The 24/7 promise is real!',
  },
  {
    name: 'Grace P.',
    location: 'Bukuru',
    rating: 4,
    text: 'Their meat pies are still the freshest I have had in Jos. Crispy outside, packed with filling. I always order for family meetings.',
  },
  {
    name: 'Tunde & Funke',
    location: 'Rayfield',
    rating: 5,
    text: 'Our graduation cake was exactly the design we sent, down to the colours. Thank you for the patience with all our changes!',
  },
  {
    name: 'Halima S.',
    location: 'Jos North',
    rating: 5,
    text: 'The banana bread never lasts a day in our house. Baked fresh every single time. Highly recommended!',
  },
];

export function ensureSeed(db: Database.Database): void {
  const cakeCount = db.prepare('SELECT COUNT(*) AS c FROM cakes').get() as { c: number };
  if (cakeCount.c === 0) {
    const insert = db.prepare(
      `INSERT INTO cakes (slug, name, category, description, price_from, sizes, flavors, image, available, featured, sort_order)
       VALUES (@slug, @name, @category, @description, @price_from, @sizes, @flavors, @image, @available, @featured, @sort_order)`
    );
    const tx = db.transaction((rows: SeedCake[]) => {
      for (const row of rows) {
        insert.run({ ...row, sizes: JSON.stringify(row.sizes), flavors: JSON.stringify(row.flavors) });
      }
    });
    tx(seedCakes);
  }

  const reviewCount = db.prepare('SELECT COUNT(*) AS c FROM reviews').get() as { c: number };
  if (reviewCount.c === 0) {
    const insert = db.prepare(
      'INSERT INTO reviews (name, location, rating, text, approved) VALUES (?, ?, ?, ?, 1)'
    );
    const tx = db.transaction((rows: typeof seedReviews) => {
      for (const r of rows) insert.run(r.name, r.location, r.rating, r.text);
    });
    tx(seedReviews);
  }

  const email = process.env.ADMIN_EMAIL || 'admin@relishtorte.ng';
  const password = process.env.ADMIN_PASSWORD || 'RelishTorte123!';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`
  ).run(email, hash);
}
