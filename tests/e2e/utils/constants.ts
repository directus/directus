import type { Database } from '@directus/sandbox';

export const database = process.env['DATABASE'] as Database;
export const port = process.env['PORT']!;
