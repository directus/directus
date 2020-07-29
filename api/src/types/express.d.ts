/**
 * Custom properties on the req object in express
 */

import { Permission } from './permissions';
import { Query } from './query';
import { Accountability } from './accountability';

export {};

declare global {
	namespace Express {
		export interface Request {
			accountability?: Accountability;
			token: string | null;
			collection: string;
			sanitizedQuery: Query;
			singleton?: boolean;
			permissions?: Permission;
		}
	}
}
