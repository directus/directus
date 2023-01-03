import { Knex } from 'knex';
import { Accountability } from './accountability';
import { SchemaOverview } from './schema';

export type EventContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
	/**
	 * Contextual info passed with the performed database action.
	 * Allows hook handlers to perform context-aware custom logic.
	 */
	info?: any;
};

export type FilterHandler<T = unknown> = (
	payload: T,
	meta: Record<string, any>,
	context: EventContext
) => T | Promise<T>;
export type ActionHandler = (meta: Record<string, any>, context: EventContext) => void;
export type InitHandler = (meta: Record<string, any>) => void;
export type ScheduleHandler = () => void | Promise<void>;
export type EmbedHandler = () => string;
