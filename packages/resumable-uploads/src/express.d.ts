/**
 * Custom properties on the req object in express
 */

import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { CancellationContext } from '@tus/utils';

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

			cancel?: CancellationContext;
		}
	}
}
