/**
 * Custom properties on the req object in express
 */

import { Permission } from './permissions';
import { Query } from './query';
import { Accountability } from './accountability';
import { SchemaOverview } from '@directus/schema/dist/types/overview';

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
			permissions?: Permission;
		}
	}
}
