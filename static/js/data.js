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

// former apprentices — real photos from images/photos/; `fb` is the SVG fallback.
// Swap in portraits anytime: drop apprentice-1.jpg … apprentice-6.jpg into images/ and point `image` at them.
const RT_ALUMNI = [
  { name: 'Grace M.', program: 'Foundations', quote: 'Went from home baker to taking weekend orders.', image: 'images/photos/learn-1.jpg', fb: 'images/apprentice-1.svg' },
  { name: 'Daniel K.', program: 'Decorating Mastery', quote: 'Now cakes for every occasion in my family.', image: 'images/photos/design-3.jpg', fb: 'images/apprentice-2.svg' },
  { name: 'Halima Y.', program: 'Foundations', quote: 'Started a small cupcake business in Jos North.', image: 'images/photos/cupcake-6.jpg', fb: 'images/apprentice-3.svg' },
  { name: 'Tolu A.', program: 'One-Day Taster', quote: 'The taster hooked me — I came back for more.', image: 'images/photos/learn-2.jpg', fb: 'images/apprentice-4.svg' },
  { name: 'Ruth E.', program: 'Decorating Mastery', quote: 'My tiered wedding samples landed my first client.', image: 'images/photos/design-1.jpg', fb: 'images/apprentice-5.svg' },
  { name: 'Ibrahim S.', program: 'Foundations', quote: 'Learned costing — my profits doubled.', image: 'images/photos/learn-3.jpg', fb: 'images/apprentice-6.svg' },
];

// ---------- real photography defaults (admin can override any of these) ----------
const RT_PHOTO_MAP = {
  'box-of-6-cupcakes': 'images/photos/cupcake-6.jpg',
  'box-of-12-cupcakes': 'images/photos/cupcake-12.jpg',
  'chocolate-cake': 'images/photos/cake-chocolate.jpg',
  'vanilla-cake': 'images/photos/cake-vanilla.jpg',
  'red-velvet-cake': 'images/photos/cake-red-velvet.jpg',
  'carrot-cake': 'images/photos/cake-carrot.jpg',
  'coconut-cake': 'images/photos/cake-coconut.jpg',
  'fruit-cake': 'images/photos/cake-fruit.jpg',
  'custom-cake': 'images/photos/cake-custom.jpg',
  'banana-bread': 'images/photos/cake-banana.jpg',
  'samosa': 'images/photos/samosa.jpg',
  'meat-pie': 'images/photos/meat-pie.jpg',
  'sausage-roll': 'images/photos/sausage-roll.jpg',
  'doughnuts': 'images/photos/doughnut.jpg',
  'jollof-rice': 'images/photos/kitchen-jollof.jpg',
  'pasta': 'images/photos/kitchen-pasta.jpg',
  'pizza': 'images/photos/kitchen-pizza.jpg',
  'burger': 'images/photos/kitchen-burger.jpg',
  'grilled-chicken': 'images/photos/kitchen-chicken.jpg',
  'garden-salad': 'images/photos/kitchen-salad.jpg',
};

// ---------- editable content blocks (admin Content tab writes to rt_content) ----------
const RT_ABOUT = {
  eyebrow: '— OUR STORY —',
  headline: 'From a Jos kitchen to a neighbourhood legend',
  paragraphs: [
    'Relish Torte began with one oven, one recipe book and a simple promise — bake it like it\u2019s for family. That promise still runs the kitchen on Temple Road, opposite Makeri House, where the lights never go off.',
    'Celebration tiers, cupcake boxes, party jollof and warm meat pies \u2014 everything leaves our counter scratch-made, because in Jos we believe love should be edible.',
    'Today we bake around the clock, cater events across Plateau State and train the next generation of bakers in our apprenticeship programs \u2014 all from the same counter, with the same promise.',
  ],
  founded: 'Founded in Jos \u00b7 Open 24/7',
  promise: 'Bake it like it\u2019s for family.',
};

const RT_WHY = [
  {
    icon: 'clock', title: 'Open 24/7, every day',
    text: 'Craving at 2AM or prepping a party at dawn — the ovens never sleep and we confirm orders within minutes.',
    long: 'The lights on Temple Road never switch off. A 2AM birthday panic, a dawn office brief or a last-minute christening — the mixer is already running. Orders placed through the website or WhatsApp are confirmed by a human within minutes, at any hour, seven days a week. Night shift, early flight, owambe that ran late: we have baked for all of it.'
  },
  {
    icon: 'leaf', title: 'Scratch-made, always',
    text: 'No mixes, no shortcuts. Sponges, fillings and doughs are made fresh at the counter every single day.',
    long: 'No mixes, no preservatives, no yesterday\'s sponge. Butter is creamed, dough is kneaded and fillings are whipped on site every single day, which is why the counter smells the way it does at 6AM. If it did not come out of our oven, we do not sell it — and anything that fails the taste test at the bench never reaches the display case.'
  },
  {
    icon: 'star', title: 'Custom designs welcome',
    text: 'Send an inspiration photo and we replicate it \u2014 birthdays, weddings, graduations, corporate orders.',
    long: 'Send one inspiration photo and our decorators match the colours, tiers, texture and inscription — birthdays, weddings, graduations, corporate launches. Prefer to design it yourself? The Cake Studio on the Order page lets you stack the tiers, pick flavours and set colours before you ever speak to a human, and Torte will quote it while you wait.'
  },
  {
    icon: 'truck', title: 'Delivered across Jos',
    text: 'Same-day delivery across Jos and Plateau, or pick up hot from Temple Road, opposite Makeri House.',
    long: 'Same-day delivery across Jos and Plateau — Rayfield, Bukuru, GRA, Vwang, Rantya and beyond — with riders who call on approach and boxes built to survive the road. Skip the fee entirely by picking up warm from the counter, opposite Makeri House, any hour you like. Either way your cake travels boxed, strapped and level.'
  },
  {
    icon: 'heart', title: 'Made like it is for family',
    text: 'Bake it the way you would bake for your own table — that first rule still decides everything that leaves this kitchen.',
    long: 'Relish Torte started with one oven and a promise: bake it like it is for family. That promise still runs the kitchen. Portions are generous, decorations are finished by hand, and anything less than right gets remade instead of sold. It is the reason first-time customers become regulars — and regulars become the people who recommend us at every celebration in Jos.'
  },
  {
    icon: 'award', title: 'Trained hands, fair prices',
    text: 'Every decorator came through our apprenticeship bench — hygiene, costing and finish standards included.',
    long: 'Every decorator here came through the Relish Torte apprenticeship program, trained on hygiene, costing and finish standards before touching a customer order. Fair prices come from the same discipline: honest portions, local sourcing where we can, and no surprise charges on the final invoice. What we quote on WhatsApp is what you pay at the door.'
  },
];

const RT_HOW = [
  { step: '1', title: 'Pick your treat', text: 'Browse the 20-item menu, stack a custom tier in the Cake Studio, or simply describe it to Torte — the assistant knows every price, flavour and delivery area.' },
  { step: '2', title: 'Send the details', text: 'The order form writes your whole brief into WhatsApp — item, date, address, design notes. We confirm the price and your slot within minutes, day or night.' },
  { step: '3', title: 'Baked & delivered', text: 'We bake fresh around the clock, photograph it for your approval, then ride it across Jos or hold it warm for pickup at Temple Road.' },
];

// 3D cascading showcase — home page "Why Relish Torte" section
const RT_CASCADE = [
  { image: 'images/photos/space-3.jpg', alt: 'Fresh trays coming out of the Relish Torte oven', title: 'Ovens that never sleep', text: '24/7 production, confirmed in minutes' },
  { image: 'images/photos/bread-1.jpg', alt: 'Scratch-made bread baked daily by Relish Torte', title: 'Scratch-made daily', text: 'Flour, butter and time — nothing from a box' },
  { image: 'images/photos/design-1.jpg', alt: 'Three-tier custom wedding cake by Relish Torte', title: 'Custom tiers by hand', text: 'Matched to your inspiration photo' },
  { image: 'images/photos/cupcake-6.jpg', alt: 'Box of Relish Torte cupcakes ready for delivery', title: 'Boxed and ready to ride', text: 'Packed to survive Jos roads' },
  { image: 'images/photos/kitchen-jollof.jpg', alt: 'Hot kitchen catering spread from Relish Torte', title: 'The hot kitchen', text: 'Catering for weddings, offices and owambe nights' },
  { image: 'images/photos/learn-1.jpg', alt: 'Apprentice bakers training at Relish Torte', title: 'Trained hands', text: 'Every decorator came through our bench' },
];

// the entire order process — rendered as the spreadsheet table on the home page
const RT_PROCESS = [
  { stage: 'Browse & get inspired', detail: 'Walk the full menu, open the Cake Studio or ask Torte — the assistant knows every price, flavour, delivery area and opening hour on the site.', timing: 'Anytime, 24/7', who: 'You + Ask Torte', status: 'Instant', tone: 'hot' },
  { stage: 'Design or pick your item', detail: 'Choose a signature bake or describe a custom tier: inspiration photos, colours, tiers, inscription, budget. Nothing is locked in yet and browsing costs nothing.', timing: 'About 10 minutes', who: 'You', status: 'Free to browse', tone: 'soft' },
  { stage: 'Quote & confirm', detail: 'We reply on WhatsApp with the exact price, the dates we can take your order and any design notes. Questions are answered by a real person, not a bot.', timing: 'Usually under 15 min', who: 'Front desk', status: 'Instant reply', tone: 'hot' },
  { stage: 'Slot locked + deposit', detail: 'Your date goes on the production calendar the moment a 50% deposit lands. Same-day orders can be paid in full instead — either way the slot is yours.', timing: 'Same day', who: 'You + front desk', status: 'Same day', tone: 'cool' },
  { stage: 'Design sketch & prep', detail: 'Your design is sketched, colours are matched and ingredients are staged. Custom tiers rest overnight so the sponge sets right and the fondant behaves.', timing: '1-2 days before', who: 'Design studio', status: 'Scheduled', tone: 'soft' },
  { stage: 'Bake fresh', detail: 'Sponges, doughs and fillings are made from scratch in the early hours — never from frozen stock, never the day before. What we bake today is sold today.', timing: 'Order day, from 4 AM', who: 'Bakers', status: 'Fresh', tone: 'cool' },
  { stage: 'Fill, coat & decorate', detail: 'Layering, crumb coat, final coat, fondant or buttercream work, hand-piped inscription and finishing detail — done in the order your design demands.', timing: 'Order day', who: 'Decorators', status: 'Same day', tone: 'cool' },
  { stage: 'Quality check & photo proof', detail: 'Weight, finish, structure and inscription are checked against your brief, then photographed and sent to you before anything is packed.', timing: 'Before packing', who: 'Supervisor', status: 'Proof sent', tone: 'hot' },
  { stage: 'Pack & label', detail: 'Boxed with support, ribboned, labelled with the care card and your name — or boxed party-ready in dozens for events and office spreads.', timing: 'Same day', who: 'Front desk', status: 'Ready', tone: 'cool' },
  { stage: 'Deliver or pick up', detail: 'Riders deliver across Jos — Rayfield, Bukuru, GRA, Vwang, Rantya — and call on approach. Pickup orders wait warm at the counter on Temple Road.', timing: 'Your chosen slot', who: 'Riders / counter', status: 'On the way', tone: 'cool' },
  { stage: 'Celebrate & feedback', detail: 'You cut the cake. A day later a short survey lands — taste, packaging, delivery — and your rating is what the next customer reads before ordering.', timing: '24 h after delivery', who: 'You', status: 'Optional', tone: 'soft' },
];

const RT_HERO_SLIDES = [
  { image: 'images/photos/hero-1.jpg', alt: 'Relish Torte celebration cake finished in warm light' },
  { image: 'images/photos/hero-2.jpg', alt: 'Rich chocolate cake layered and glazed by Relish Torte' },
  { image: 'images/photos/hero-3.jpg', alt: 'Fresh celebration cake baked daily in Jos' },
];

const RT_GALLERY = [
  { id: 'g1', title: 'Three-tier wedding cake', caption: 'Fondant finish with gold leaf detail', image: 'images/photos/design-1.jpg' },
  { id: 'g2', title: 'Birthday centrepiece', caption: 'Buttercream swirls, custom inscription', image: 'images/photos/design-2.jpg' },
  { id: 'g3', title: 'Red velvet drip cake', caption: 'Cream cheese frosting with berry crown', image: 'images/photos/design-3.jpg' },
  { id: 'g4', title: 'Chocolate ganache art', caption: 'Smooth pour with hand-piped rosettes', image: 'images/photos/design-4.jpg' },
  { id: 'g5', title: 'Cupcake towers', caption: 'Party-ready boxes in every flavour', image: 'images/photos/design-5.jpg' },
  { id: 'g6', title: 'Cookie favours', caption: 'Boxed gifts for events and guests', image: 'images/photos/design-6.jpg' },
];

const RT_SPACE = [
  { id: 's1', caption: 'Our counter on Temple Road', image: 'images/photos/space-1.jpg' },
  { id: 's2', caption: 'Where the celebration cakes take shape', image: 'images/photos/space-2.jpg' },
  { id: 's3', caption: 'Fresh from the oven, all day', image: 'images/photos/space-3.jpg' },
  { id: 's4', caption: 'Seating for a quick bite', image: 'images/photos/space-4.jpg' },
  { id: 's5', caption: 'The pastry case, restocked around the clock', image: 'images/photos/space-5.jpg' },
];
