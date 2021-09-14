import { ApiExtensionContext } from './extensions';

type FilterFunction = (event: string, handler: (...values: any[]) => any[]) => void;
type ActionFunction = (event: string, handler: (...values: any[]) => void) => void;
type InitFunction = (event: string, handler: (...values: any[]) => void) => void;
type ScheduleFunction = (cron: string, handler: () => void) => void;

type RegisterFunctions = {
	filter: FilterFunction;
	action: ActionFunction;
	init: InitFunction;
	schedule: ScheduleFunction;
};

type HookHandlerFunction = (register: RegisterFunctions, context: ApiExtensionContext) => void;

export type HookConfig = HookHandlerFunction;
