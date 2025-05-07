import type { Knex } from 'knex';
import type { Accountability } from './accountability.js';
import type { PromiseCallback } from './misc.js';
import type { SchemaOverview } from './schema.js';
import type { CustomContext, NestedPath } from './items.js';

export type EventContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
	nested?: NestedPath
	customContext?: CustomContext
};

export type FilterHandler<T = unknown> = (
	payload: T,
	meta: Record<string, any>,
	context: EventContext,
) => T | Promise<T>;
export type ActionHandler = (meta: Record<string, any>, context: EventContext) => void;
export type InitHandler = (meta: Record<string, any>) => void;
export type ScheduleHandler = PromiseCallback;
export type EmbedHandler = () => string;
