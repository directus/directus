/**
 * Custom properties on the req object in express
 */

import { Accountability } from '@directus/shared/types';
import { Query } from '@directus/shared/types';
import { SchemaOverview } from './schema';

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
