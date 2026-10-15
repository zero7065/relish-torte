// Shared Netlify Blobs access for the Relish Torte API.
// One durable key-value store backs the whole site: content, menu, images,
// orders, reviews, ratings, feedback and the admin account.
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'relish-torte';
let cached = null;

export function store() {
  if (!cached) cached = getStore(STORE_NAME, { consistency: 'strong' });
  return cached;
}

export async function readJSON(key, fallback = null) {
  try {
    const value = await store().get(key, { type: 'json' });
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

export async function writeJSON(key, value) {
  await store().setJSON(key, value);
}

export async function readBytes(key) {
  try {
    return await store().get(key, { type: 'arrayBuffer' });
  } catch {
    return null;
  }
}

export async function writeBytes(key, bytes) {
  await store().set(key, bytes);
}

export async function removeKey(key) {
  try {
    await store().delete(key);
  } catch {
    /* already gone — fine */
  }
}
