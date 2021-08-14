/**
 * Custom properties on the req object in express
 */

import { Accountability, Maintenance } from '@directus/shared/types';
import { Query } from './query';
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
			maintenance?: Maintenance;
			singleton?: boolean;
		}
	}
}
