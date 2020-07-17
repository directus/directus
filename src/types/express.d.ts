/**
 * Custom properties on the req object in express
 */

import { Permission } from './permissions';
import { Query } from './query';

export {};

declare global {
	namespace Express {
		export interface Request {
			token: string;
			user: string;
			role: string | null;
			admin: boolean;
			collection?: string;
			sanitizedQuery?: Query;
			single?: boolean;
			permissions?: Permission;
		}
	}
}
