/* Relish Torte — AI configuration
   ---------------------------------------------------------------
   Paste your free Groq API key from https://console.groq.com/keys
   (no card needed — llama-3.1-8b-instant runs on the free tier:
    30 requests/min, 1000/day.)

   While the key is blank/placeholder, Ask Torte still works using
   the built-in rule engine (menu + hours + prices), so nothing
   breaks on file:// or before you sign up.

   SECURITY NOTE: a key in this file is readable by anyone who
   views the site. For production, swap `proxyMode` to true and
   point `proxyUrl` at a serverless function that holds the key
   (e.g. Netlify/Cloudflare function). Everything else stays the
   same — ai.js sends the chat to your proxy instead of Groq.
*/
window.RT_CONFIG = {
  GROQ_KEY: '', // e.g. 'gsk_...'
  GROQ_MODEL: 'llama-3.1-8b-instant', // upgrade: 'llama-3.3-70b-versatile'
  GROQ_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',

  proxyMode: false,
  proxyUrl: '', // e.g. '/api/chat' when deployed

  // guard rails
  MIN_MESSAGE_GAP_MS: 2000,
  MAX_MESSAGES_PER_SESSION: 40,
  TYPING_SPEED_MS: 14,
};
