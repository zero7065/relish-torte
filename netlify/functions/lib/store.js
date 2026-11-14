// Shared Netlify Blobs access for the Relish Torte API.
// One durable key-value store backs the whole site: content, menu, images,
// orders, reviews, ratings, feedback and the admin account.
import { getStore } from '@netlify/blobs';

const STORE_NAME = 'relish-torte';

/** The Lambda runtime hands short-lived credentials to connectLambda(), which
 *  stores them as a base64 blob in the environment (refreshed each call). */
function blobsContext() {
  try {
    const raw = process.env.NETLIFY_BLOBS_CONTEXT;
    if (!raw) return {};
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

/** Build a store for the CURRENT invocation.
 *
 *  This must NOT be cached at module scope: a warm Lambda container keeps the
 *  old client, whose connectLambda token expires within minutes, and every
 *  later call fails with "Token expired". Reading the context on each call
 *  guarantees we always use the fresh credentials from this event. */
export function store() {
  const ctx = blobsContext();
  const uncached = ctx.uncachedEdgeURL || ctx.edgeURL;
  // getStore must be called with an options object: the string form
  // (getStore(name, options)) silently discards the options in v8.
  return uncached
    ? getStore({ name: STORE_NAME, consistency: 'strong', uncachedEdgeURL: uncached })
    : getStore({ name: STORE_NAME });
}

/** Lenient read for public pages: any failure falls back to the default. */
export async function readJSON(key, fallback = null) {
  try {
    const value = await store().get(key, { type: 'json' });
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

/** Strict read for read-modify-write handlers. If the read fails we throw so
 *  the caller aborts instead of writing back a partial object and silently
 *  destroying the rest of the collection. */
export async function mustReadJSON(key, fallback = null) {
  const value = await store().get(key, { type: 'json' });
  return value == null ? fallback : value;
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
