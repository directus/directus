/**
 * Custom properties on the req object in express
 */

import { Permission } from './permissions';
import { Query } from './query';

export {};

declare global {
	namespace Express {
		export interface Request {
			token: string | null;
			user: string | null;
			role: string | null;
			collection: string;
			admin: boolean;
			sanitizedQuery: Query;
			single?: boolean;
			permissions?: Permission;
		}
	}
}
