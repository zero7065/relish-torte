// Shared Netlify Blobs access for the Relish Torte API.
// One durable key-value store backs the whole site: content, menu, images,
// orders, reviews, ratings, feedback and the admin account.
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'relish-torte';
let cached = null;

/** The Lambda runtime hands credentials to connectLambda(), which stores them
 *  as a base64 blob in the environment. Read it back so we can ask for strong
 *  (read-your-own-writes) consistency when the platform provides a URL that
 *  can serve it. Without that URL the SDK throws, so we simply drop down to
 *  the default eventual consistency — a few seconds of lag, never an outage. */
function blobsContext() {
  try {
    const raw = process.env.NETLIFY_BLOBS_CONTEXT;
    if (!raw) return {};
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

export function store() {
  if (!cached) {
    const ctx = blobsContext();
    const uncached = ctx.uncachedEdgeURL || ctx.edgeURL;
    // getStore must be called with an options object: the string form
    // (getStore(name, options)) silently discards the options in v8.
    cached = uncached
      ? getStore({ name: STORE_NAME, consistency: 'strong', uncachedEdgeURL: uncached })
      : getStore({ name: STORE_NAME });
  }
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
