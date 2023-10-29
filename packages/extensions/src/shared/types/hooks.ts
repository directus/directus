import type { ActionHandler, EmbedHandler, FilterHandler, InitHandler, ScheduleHandler } from '@directus/types';
import type { ApiExtensionContext } from './api-extension-context.js';

export type HookExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type RegisterFunctions = {
	filter: <T = unknown>(event: string, handler: FilterHandler<T>) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
	embed: (position: 'head' | 'body', code: string | EmbedHandler) => void;
};

type HookConfigFunction = (register: RegisterFunctions, context: HookExtensionContext) => void;

export type HookConfig = HookConfigFunction;
