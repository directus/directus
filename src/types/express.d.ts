/**
 * Custom properties on the req object in express
 */

export {};

declare global {
	namespace Express {
		export interface Request {
			token?: string;
			user?: string;
			role?: string;
			collection?: string;
			sanitizedQuery?: Record<string, any>;
		}
	}
}
