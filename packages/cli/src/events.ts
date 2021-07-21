import { Command } from './command';
import { IOutput } from './output';

export type Listener<T extends any = any, P extends any = any, R = any> =
	| ((...args: P[]) => Promise<R>)
	| ((...args: P[]) => R)
	| ((this: T, ...args: P[]) => Promise<R>)
	| ((this: T, ...args: P[]) => R);

export type EventTypes = {
	'command.initialize.before': (command: Command) => void | Promise<void>;
	'command.initialize.after': (command: Command) => void | Promise<void>;

	'command.execute.before': (command: Command, options: any) => void | Promise<void>;
	'command.execute.after': (command: Command) => void | Promise<void>;

	'command.options.register': (command: Command) => void;

	'output.formats.register': (output: IOutput) => void;
};

export interface IEvents {
	on<E extends keyof EventTypes>(event: E, listener: EventTypes[E]): void;
	emit<E extends keyof EventTypes>(event: E, ...args: Parameters<EventTypes[E]>): Promise<void>;
}
