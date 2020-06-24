/**
 * Custom properties on the req object in express
 */

import createSystemLoaders from '../loaders';

declare global {
	namespace Express {
		export interface Request {
			token?: string;
			user?: string;
			role?: string;
			collection?: string;
			loaders?: ReturnType<typeof createSystemLoaders>;
		}
	}
}
