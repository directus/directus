/**
 * Custom properties on the req object in express
 */

import { Permission } from './permissions';

export {};

declare global {
	namespace Express {
		export interface Request {
			token: string;
			user: string;
			role: string | null;
			admin: boolean;
			collection?: string;
			sanitizedQuery?: Record<string, any>;
			single?: boolean;
			permissions?: Permission;
		}
	}
}
