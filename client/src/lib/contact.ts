export const PHONE_DISPLAY = '08166899379';
export const PHONE_INTL = '2348166899379';
export const INSTAGRAM_URL = 'https://www.instagram.com/Relish_Torte/';
export const INSTAGRAM_HANDLE = '@Relish_Torte';
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Jos%2C%20Plateau%20State%2C%20Nigeria';

export function waLink(message: string): string {
  return `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_WA_MESSAGE =
  'Hello Relish Torte! I would like to place an order.';
