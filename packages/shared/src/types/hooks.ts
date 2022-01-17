import { Knex } from 'knex';
import { Accountability } from './accountability';
import { ApiExtensionContext } from './extensions';

type HookContext = {
	database: Knex;
	schema: Record<string, any> | null;
	accountability: Accountability | null;
};

type FilterHandler = (payload: any, meta: Record<string, any>, context: HookContext) => any | Promise<any>;
type ActionHandler = (meta: Record<string, any>, context: HookContext) => void;
type InitHandler = (meta: Record<string, any>) => void;
type ScheduleHandler = () => void;

type RegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
};

type HookConfigFunction = (register: RegisterFunctions, context: ApiExtensionContext) => void;

export type HookConfig = HookConfigFunction;
