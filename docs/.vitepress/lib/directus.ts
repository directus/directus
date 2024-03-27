import { createDirectus, rest } from '@directus/sdk';
import type { Schema } from '../types/schema.js';

export const client = createDirectus<Schema>('https://marketing.directus.app').with(rest());
