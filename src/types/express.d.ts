/**
 * Custom properties on the req object in express
 */

declare namespace Express {
	export interface Request {
		token?: string;
		user?: string;
		role?: string;
	}
}
