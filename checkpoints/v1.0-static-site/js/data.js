// Relish Torte — static site data (edit prices/items here or via the Admin page)
const RT_PHONE_INTL = '2348166899379';
const RT_PHONE_DISPLAY = '08166899379';
const RT_INSTAGRAM = 'https://www.instagram.com/Relish_Torte/';
const RT_INSTAGRAM_HANDLE = '@Relish_Torte';
const RT_MAPS = 'https://www.google.com/maps/search/?api=1&query=Temple%20Road%2C%20Jos%2C%20Plateau%20State%2C%20Nigeria';
const RT_ADDRESS = 'Temple Road, opposite Makeri House, Jos, Plateau State';
const RT_TAGLINE = 'love at first bite';

const RT_CATEGORIES = {
  cupcakes: 'Cupcakes',
  celebration: 'Celebration Cakes',
  loaves: 'Loaf Cakes',
  confectioneries: 'Confectioneries',
  kitchen: 'Hot Kitchen',
};

const RT_HOURS = [
  { day: 'Mon – Fri', time: 'Open 24 hours' },
  { day: 'Saturday', time: 'Open 24 hours' },
  { day: 'Sunday', time: 'Open 24 hours' },
];

const S6 = { label: '6" — serves 8–10', price: 15000 };
const S8 = { label: '8" — serves 16–20', price: 25000 };
const S10 = { label: '10" — serves 30–35', price: 40000 };

const RT_MENU = [
  {
    slug: 'box-of-6-cupcakes',
    name: 'Box of 6 Cupcakes',
    category: 'cupcakes',
    description: 'Six hand-finished cupcakes in your choice of chocolate, vanilla or red velvet — boxed beautifully for small celebrations, gifting or office treats.',
    price_from: 8000,
    sizes: [{ label: 'Box of 6', price: 8000 }],
    flavors: ['Chocolate', 'Vanilla', 'Red velvet'],
    image: 'images/cupcake-6.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'box-of-12-cupcakes',
    name: 'Box of 12 Cupcakes',
    category: 'cupcakes',
    description: 'A dozen of our signature cupcakes — mix chocolate, vanilla and red velvet, finished with swirled buttercream. Our best-selling party box.',
    price_from: 15000,
    sizes: [{ label: 'Box of 12', price: 15000 }],
    flavors: ['Chocolate', 'Vanilla', 'Red velvet'],
    image: 'images/cupcake-12.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'chocolate-cake',
    name: 'Chocolate Cake',
    category: 'celebration',
    description: 'Deep, fudgy chocolate sponge layered with silky chocolate ganache — our most-loved birthday cake.',
    price_from: 15000,
    sizes: [S6, S8, S10],
    flavors: ['Chocolate'],
    image: 'images/cake-chocolate.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'vanilla-cake',
    name: 'Vanilla Cake',
    category: 'celebration',
    description: 'Light, fluffy vanilla sponge layered with smooth buttercream — timeless, kid-friendly and endlessly customisable.',
    price_from: 15000,
    sizes: [S6, S8, S10],
    flavors: ['Vanilla'],
    image: 'images/cake-vanilla.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'red-velvet-cake',
    name: 'Red Velvet Cake',
    category: 'celebration',
    description: 'Classic crimson layers with cream cheese frosting, finished with delicate red velvet crumbs.',
    price_from: 18000,
    sizes: [
      { label: '6" — serves 8–10', price: 18000 },
      { label: '8" — serves 16–20', price: 28000 },
      { label: '10" — serves 30–35', price: 45000 },
    ],
    flavors: ['Red velvet'],
    image: 'images/cake-red-velvet.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'carrot-cake',
    name: 'Carrot Cake',
    category: 'celebration',
    description: 'Moist spiced carrot cake with walnuts, layered and topped with cream cheese frosting.',
    price_from: 15000,
    sizes: [S6, S8, S10],
    flavors: ['Carrot cake'],
    image: 'images/cake-carrot.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'coconut-cake',
    name: 'Coconut Cake',
    category: 'celebration',
    description: 'Fragrant coconut sponge layered with coconut cream frosting and finished with toasted coconut flakes.',
    price_from: 15000,
    sizes: [S6, S8, S10],
    flavors: ['Coconut cake'],
    image: 'images/cake-coconut.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'fruit-cake',
    name: 'Fruit Cake',
    category: 'celebration',
    description: 'Rich Nigerian-style fruit cake loaded with mixed fruits and warm spice — a wedding and celebration favourite.',
    price_from: 18000,
    sizes: [
      { label: '6" — serves 8–10', price: 18000 },
      { label: '8" — serves 16–20', price: 30000 },
      { label: '10" — serves 30–35', price: 50000 },
    ],
    flavors: ['Fruit cake'],
    image: 'images/cake-fruit.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'custom-cake',
    name: 'Custom Baked Cake',
    category: 'celebration',
    description: 'Your design, your flavours. Send an inspiration photo and we will bring it to life — birthdays, weddings, graduations and corporate orders.',
    price_from: null,
    sizes: [{ label: 'Custom quote — tell us the size & design', price: null }],
    flavors: ['Chocolate', 'Vanilla', 'Red velvet', 'Banana bread', 'Fruit cake', 'Carrot cake', 'Coconut cake'],
    image: 'images/cake-custom.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'banana-bread',
    name: 'Banana Bread Loaf',
    category: 'loaves',
    description: 'Sweet-ripe banana loaf baked daily — served plain or with a walnut top. Perfect with tea.',
    price_from: 5000,
    sizes: [
      { label: 'Loaf', price: 5000 },
      { label: 'Family loaf', price: 8000 },
    ],
    flavors: ['Plain', 'Walnut', 'Chocolate chip'],
    image: 'images/cake-banana.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'samosa',
    name: 'Samosa (Pack of 10)',
    category: 'confectioneries',
    description: 'Crisp golden pastry pockets filled with spiced minced meat or vegetables — fried fresh to order.',
    price_from: 3000,
    sizes: [
      { label: 'Pack of 10', price: 3000 },
      { label: 'Tray of 25', price: 7000 },
    ],
    flavors: ['Meat', 'Veggie', 'Mixed'],
    image: 'images/samosa.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'meat-pie',
    name: 'Meat Pie (Pack of 10)',
    category: 'confectioneries',
    description: 'Flaky pastry packed with savoury minced meat, potato and carrot — Jos’ perfect snack.',
    price_from: 4500,
    sizes: [
      { label: 'Pack of 10', price: 4500 },
      { label: 'Tray of 25', price: 10500 },
    ],
    flavors: ['Classic'],
    image: 'images/meat-pie.svg',
    available: true,
    featured: true,
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
    image: 'images/sausage-roll.svg',
    available: true,
    featured: false,
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
    image: 'images/doughnut.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'jollof-rice',
    name: 'Party Jollof Rice',
    category: 'kitchen',
    description: 'Smoky Nigerian jollof cooked fresh with pepper sauce — single plates or full party trays with your choice of protein.',
    price_from: 3500,
    sizes: [
      { label: 'Single plate', price: 3500 },
      { label: 'Party tray (8–10)', price: 20000 },
      { label: 'Party tray (15–20)', price: 38000 },
    ],
    flavors: ['Chicken', 'Beef', 'Mixed protein'],
    image: 'images/kitchen-jollof.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'pasta',
    name: 'Creamy Pasta',
    category: 'kitchen',
    description: 'Pasta tossed in a rich creamy sauce with grilled chicken and vegetables — comfort in a bowl, ready around the clock.',
    price_from: 4000,
    sizes: [
      { label: 'Single plate', price: 4000 },
      { label: 'Family pack', price: 12000 },
    ],
    flavors: ['Creamy', 'Tomato basil'],
    image: 'images/kitchen-pasta.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'pizza',
    name: 'Stone-Baked Pizza',
    category: 'kitchen',
    description: 'Hand-stretched base, generous toppings, melted cheese — pepperoni, chicken BBQ or veggie supreme.',
    price_from: 6500,
    sizes: [
      { label: '9" — personal', price: 6500 },
      { label: '12" — share', price: 10000 },
    ],
    flavors: ['Pepperoni', 'Chicken BBQ', 'Veggie supreme'],
    image: 'images/kitchen-pizza.svg',
    available: true,
    featured: true,
  },
  {
    slug: 'burger',
    name: 'Relish Burger & Fries',
    category: 'kitchen',
    description: 'Juicy beef patty with cheese and fresh slaw in a soft bun, served with golden fries and house sauce.',
    price_from: 4500,
    sizes: [
      { label: 'Single', price: 4500 },
      { label: 'Combo (with drink)', price: 6000 },
    ],
    flavors: ['Beef', 'Chicken'],
    image: 'images/kitchen-burger.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'grilled-chicken',
    name: 'Grilled Chicken & Chips',
    category: 'kitchen',
    description: 'Slow-grilled quarter chicken glazed in our spice rub, served with chips and coleslaw.',
    price_from: 5500,
    sizes: [
      { label: 'Quarter', price: 5500 },
      { label: 'Half', price: 9000 },
    ],
    flavors: ['Spicy', 'Mild'],
    image: 'images/kitchen-chicken.svg',
    available: true,
    featured: false,
  },
  {
    slug: 'garden-salad',
    name: 'Garden Salad',
    category: 'kitchen',
    description: 'Crisp greens, tomatoes, cucumbers and carrots with a light vinaigrette — the fresh side of our kitchen.',
    price_from: 3000,
    sizes: [
      { label: 'Single bowl', price: 3000 },
      { label: 'Party bowl', price: 9000 },
    ],
    flavors: ['Classic vinaigrette'],
    image: 'images/kitchen-salad.svg',
    available: true,
    featured: false,
  },
];

const RT_REVIEWS = [
  {
    id: 1,
    name: 'Chidinma O.',
    location: 'Jos',
    rating: 5,
    text: 'The red velvet cake for my daughter’s birthday was the highlight of the party. Moist, fresh and not too sweet — exactly how we asked for it. Delivered right on time!',
    approved: true,
  },
  {
    id: 2,
    name: 'Mrs. Aisha Bello',
    location: 'Rayfield',
    rating: 5,
    text: 'We ordered a fruit cake for our traditional wedding and everybody was asking who baked it. Rich, moist and beautifully finished. We are customers for life.',
    approved: true,
  },
  {
    id: 3,
    name: 'Emeka N.',
    location: 'Jos South',
    rating: 5,
    text: 'Ordered a box of 12 cupcakes at 10pm for an office surprise — it was delivered by 8am. The 24/7 promise is real!',
    approved: true,
  },
  {
    id: 4,
    name: 'Grace P.',
    location: 'Bukuru',
    rating: 4,
    text: 'Their meat pies are still the freshest I have had in Jos. Crispy outside, packed with filling. I always order for family meetings.',
    approved: true,
  },
  {
    id: 5,
    name: 'Tunde & Funke',
    location: 'Rayfield',
    rating: 5,
    text: 'Our graduation cake was exactly the design we sent, down to the colours. Thank you for the patience with all our changes!',
    approved: true,
  },
  {
    id: 6,
    name: 'Halima S.',
    location: 'Jos North',
    rating: 5,
    text: 'The banana bread never lasts a day in our house. Baked fresh every single time. Highly recommended!',
    approved: true,
  },
];

const RT_ORDER_TYPES = ['Cupcakes', 'Celebration cake', 'Loaf cake', 'Confectioneries', 'Hot Kitchen', 'Custom design', 'Catering', 'Apprenticeship'];

const RT_TYPE_TO_CATEGORY = {
  Cupcakes: 'cupcakes',
  'Celebration cake': 'celebration',
  'Loaf cake': 'loaves',
  Confectioneries: 'confectioneries',
  'Hot Kitchen': 'kitchen',
};

const RT_AREAS = ['Jos North', 'Jos South', 'Jos East', 'Jos West', 'Barkin Ladi', 'Riyom', 'Bassa', 'Mangu', 'Other (specify in notes)'];

// ---------- catering services (from the brand flyer) ----------
const RT_CATERING = [
  'Wedding Cakes',
  'Birthday Cakes',
  'Anniversary Cakes',
  'Cupcakes',
  'Pastries',
  'Events & more',
];

// ---------- apprenticeship & programs ----------
const RT_PROGRAMS = [
  {
    id: 'taster',
    name: 'One-Day Taster Session',
    price: 15000,
    priceNote: 'per person',
    duration: '1 day · 10am – 4pm',
    icon: 'whisk',
    points: [
      'Sponge, buttercream & piping basics',
      'Take home what you bake',
      'All ingredients & tools provided',
      'No experience needed',
    ],
  },
  {
    id: 'foundations',
    name: 'Baking Foundations',
    price: 60000,
    priceNote: '2-week program',
    duration: '2 weeks · Mon – Fri',
    icon: 'cake',
    badge: 'Most popular',
    points: [
      'Breads, sponges, frostings & fills',
      'Hygiene, costing & kitchen setup',
      'Certificate of completion',
      'Small class sizes (max 8)',
    ],
  },
  {
    id: 'mastery',
    name: 'Cake Decorating Mastery',
    price: 120000,
    priceNote: '4-week program',
    duration: '4 weeks · Mon – Fri',
    icon: 'star',
    points: [
      'Fondant, gum paste & tiered cakes',
      'Design studio + photo portfolio day',
      'Business module: pricing & clients',
      '1-on-1 mentorship with our head baker',
    ],
  },
];

const RT_SOON_PROGRAM = {
  name: 'Kids Holiday Baking Camp',
  status: 'Coming soon',
  blurb: 'Our famous kids program is rolling into the holidays — where little bakers create big memories. Ages 7–15, Monday to Friday, breakfast and apron included.',
  note: 'Next dates drop soon — join the waitlist and be first to know.',
};

const RT_ARCHIVE_PROGRAM = {
  name: 'Summer Baking Classes for Kids',
  meta: '3rd August – 3rd September · Ages 7–15 · ₦50,000',
  note: 'Concluded — thank you to every little baker who joined us!',
};

// former apprentices — drop real photos as images/apprentice-1.jpg … apprentice-6.jpg
const RT_ALUMNI = [
  { name: 'Grace M.', program: 'Foundations', quote: 'Went from home baker to taking weekend orders.', image: 'images/apprentice-1.svg' },
  { name: 'Daniel K.', program: 'Decorating Mastery', quote: 'Now cakes for every occasion in my family.', image: 'images/apprentice-2.svg' },
  { name: 'Halima Y.', program: 'Foundations', quote: 'Started a small cupcake business in Jos North.', image: 'images/apprentice-3.svg' },
  { name: 'Tolu A.', program: 'One-Day Taster', quote: 'The taster hooked me — I came back for more.', image: 'images/apprentice-4.svg' },
  { name: 'Ruth E.', program: 'Decorating Mastery', quote: 'My tiered wedding samples landed my first client.', image: 'images/apprentice-5.svg' },
  { name: 'Ibrahim S.', program: 'Foundations', quote: 'Learned costing — my profits doubled.', image: 'images/apprentice-6.svg' },
];

const RT_ADMIN_PIN = '2407';
