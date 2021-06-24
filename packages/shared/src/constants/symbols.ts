export const LAYOUT_SYMBOL = process.env.NODE_ENV === 'development' ? Symbol.for('[Directus]: Layout') : Symbol();
