import type { ActionHandler, FilterHandler, InitHandler, ScheduleHandler, EmbedHandler } from './events.js';
import type { ApiExtensionContext } from './extensions.js';

// --- hook ---

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

// --- secure hook ---

export type SecureHookExtensionContext = ApiExtensionContext & {
	emitter: any;
};

type SecureRegisterFunctions = {
	filter: (event: string, handler: FilterHandler) => void;
	action: (event: string, handler: ActionHandler) => void;
	init: (event: string, handler: InitHandler) => void;
	schedule: (cron: string, handler: ScheduleHandler) => void;
	embed: (position: 'head' | 'body', code: string | EmbedHandler) => void;
};

type SecureHookConfigFunction = (register: SecureRegisterFunctions, context: SecureHookExtensionContext) => void;

export type SecureHookConfig = SecureHookConfigFunction;
