import type { Knex } from 'knex';
import type { Accountability } from './accountability.js';
import type { PromiseCallback } from './misc.js';
import type { SchemaOverview } from './schema.js';

export type EventContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
};

// @see https://directus.io/docs/guides/extensions/api-extensions/hooks#filter-events to build out better types
// export type EventMeta = {
// 	payload: Item | null;
// 	event: string;
// 	collection: string | null;
// };

export type EventMeta = Record<string, any>;

export type FilterHandler<T = unknown> = (payload: T, meta: EventMeta, context: EventContext) => T | Promise<T>;
export type ActionHandler = (meta: EventMeta, context: EventContext) => void;
export type InitHandler = (meta: EventMeta) => void;
export type ScheduleHandler = PromiseCallback;
export type EmbedHandler = () => string;
