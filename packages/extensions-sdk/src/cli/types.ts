import { EXTENSION_LANGUAGES } from '@directus/shared/constants';

export type Language = typeof EXTENSION_LANGUAGES[number];
export type LanguageShort = 'js' | 'ts';
