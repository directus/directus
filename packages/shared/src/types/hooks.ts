import { ActionHandler, FilterHandler, InitHandler, ScheduleHandler, EmbedHandler } from './events';
import { ApiExtensionContext } from './extensions';

export type HookExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type RegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
	embed: (position: 'head' | 'body', code: string | EmbedHandler) => void;
};

type HookConfigFunction = (register: RegisterFunctions, context: HookExtensionContext) => void;

export type HookConfig = HookConfigFunction;
