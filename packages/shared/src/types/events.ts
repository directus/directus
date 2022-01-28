import { Knex } from 'knex';
import { Accountability } from './accountability';
import { SchemaOverview } from './schema';

export type EventContext = {
	database: Knex;
	schema: SchemaOverview | null;
	accountability: Accountability | null;
};

export type FilterHandler = (payload: any, meta: Record<string, any>, context: EventContext) => any | Promise<any>;
export type ActionHandler = (meta: Record<string, any>, context: EventContext) => void;
export type InitHandler = (meta: Record<string, any>) => void;
export type ScheduleHandler = () => void;
