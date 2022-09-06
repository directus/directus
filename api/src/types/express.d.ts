/**
 * Custom properties on the req object in express
 */

import { Accountability, Query } from '@directus/shared/types';
import { SchemaOverview } from './schema.js';

export {};

declare global {
	namespace Express {
		export interface Request {
			token: string | null;
			collection: string;
			sanitizedQuery: Query;
			schema: SchemaOverview;

			accountability?: Accountability;
			singleton?: boolean;
		}
	}
}
