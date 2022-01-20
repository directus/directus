import { ActionHandler, FilterHandler, InitHandler, ScheduleHandler } from './events';
import { ApiExtensionContext } from './extensions';

type RegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
};

type HookHandlerFunction = (register: RegisterFunctions, context: ApiExtensionContext) => void;

export type HookConfig = HookHandlerFunction;
