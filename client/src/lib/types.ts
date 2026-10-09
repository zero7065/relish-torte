export type Category = 'cupcakes' | 'celebration' | 'loaves' | 'confectioneries';

export interface CakeSize {
  label: string;
  price: number | null;
}

export interface Cake {
  id: number;
  slug: string;
  name: string;
  category: Category;
  description: string;
  price_from: number | null;
  sizes: CakeSize[];
  flavors: string[];
  image: string;
  available: boolean;
  featured: boolean;
}

export interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
}

export type OrderStatus = 'new' | 'confirmed' | 'baking' | 'ready' | 'delivered';

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'baking', label: 'Baking' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
];

export interface AdminOrder {
  id: number;
  ref: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  item: string;
  flavor: string;
  size: string;
  qty: number;
  inscription: string;
  needed_date: string;
  delivery: string;
  area: string;
  address: string;
  notes: string;
  photo: string | null;
  status: OrderStatus;
  created_at: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  cupcakes: 'Cupcakes',
  celebration: 'Celebration Cakes',
  loaves: 'Loaf Cakes',
  confectioneries: 'Confectioneries',
};

export const ORDER_TYPES = [
  'Cupcakes',
  'Celebration cake',
  'Loaf cake',
  'Confectioneries',
  'Custom design',
] as const;

export const PLATEAU_AREAS = [
  'Jos North',
  'Jos South',
  'Jos East',
  'Jos West',
  'Barkin Ladi',
  'Riyom',
  'Bassa',
  'Mangu',
  'Other (specify in notes)',
];
