import { z } from 'zod';

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

export type OrderStatus = 'new' | 'confirmed' | 'baking' | 'ready' | 'delivered';

export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'baking', 'ready', 'delivered'];

export interface Order {
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
  delivery: 'Pickup' | 'Delivery';
  area: string;
  address: string;
  notes: string;
  photo: string | null;
  status: OrderStatus;
  created_at: string;
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

export const CATEGORY_LABELS: Record<Category, string> = {
  cupcakes: 'Cupcakes',
  celebration: 'Celebration Cakes',
  loaves: 'Loaf Cakes',
  confectioneries: 'Confectioneries',
};

const emailRe = /^\S+@\S+\.\S+$/;
const phoneRe = /^[0-9+\-\s()]{7,20}$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const orderSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  phone: z.string().trim().regex(phoneRe, 'Enter a valid phone number'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || emailRe.test(v), 'Enter a valid email')
    .default(''),
  type: z.enum(['Cupcakes', 'Celebration cake', 'Loaf cake', 'Confectioneries', 'Custom design']),
  item: z.string().trim().max(120).default(''),
  flavor: z.string().trim().max(60).default(''),
  size: z.string().trim().max(80).default(''),
  qty: z.coerce.number().int().min(1, 'Minimum 1').max(100, 'Maximum 100'),
  inscription: z.string().trim().max(200).default(''),
  neededDate: z
    .string()
    .trim()
    .regex(dateRe, 'Choose a valid date')
    .refine((v) => v >= addDays(2), 'We need at least 2 days notice'),
  delivery: z.enum(['Pickup', 'Delivery']),
  area: z.string().trim().max(60).default(''),
  address: z.string().trim().max(300).default(''),
  notes: z.string().trim().max(1000).default(''),
  photo: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]*$/, 'Invalid file name')
    .default(''),
});

export const reviewSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  location: z.string().trim().max(60).default(''),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10, 'Tell us a little more').max(600),
});

export const loginSchema = z.object({
  email: z.string().trim().min(3),
  password: z.string().min(1),
});

export const statusSchema = z.object({
  status: z.enum(['new', 'confirmed', 'baking', 'ready', 'delivered']),
});

export const menuWriteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and dashes only')
    .optional()
    .default(''),
  category: z.enum(['cupcakes', 'celebration', 'loaves', 'confectioneries']),
  description: z.string().trim().max(600).default(''),
  price_from: z.coerce.number().int().min(0).nullable().default(null),
  flavors: z.string().trim().max(300).default(''),
  image: z.string().trim().max(200).default('/images/cake-custom.svg'),
  sizes: z
    .array(z.object({ label: z.string().trim().min(1).max(80), price: z.coerce.number().int().min(0).nullable() }))
    .default([]),
});

export const menuPatchSchema = z.object({
  price_from: z.coerce.number().int().min(0).nullable().optional(),
  available: z.coerce.number().int().min(0).max(1).optional(),
  featured: z.coerce.number().int().min(0).max(1).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(600).optional(),
});

export const reviewPatchSchema = z.object({
  approved: z.union([z.literal(0), z.literal(1), z.coerce.number().int().min(0).max(1)]),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
