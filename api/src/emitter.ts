import type { ActionHandler, EventContext, FilterHandler, InitHandler } from '@directus/shared/types';
import { EventEmitter2 } from 'eventemitter2';
import logger from './logger';

export class Emitter {
	private filterEmitter;
	private actionEmitter;
	private initEmitter;

	constructor() {
		const emitterOptions = {
			wildcard: true,
			verboseMemoryLeak: true,
			delimiter: '.',

			// This will ignore the "unspecified event" error
			ignoreErrors: true,
		};

		this.filterEmitter = new EventEmitter2(emitterOptions);
		this.actionEmitter = new EventEmitter2(emitterOptions);
		this.initEmitter = new EventEmitter2(emitterOptions);
	}

	public async emitFilter<T>(
		event: string | string[],
		payload: T,
		meta: Record<string, any>,
		context: EventContext
	): Promise<T> {
		const events = Array.isArray(event) ? event : [event];
		const eventListeners = events.map((event) => ({
			event,
			listeners: this.filterEmitter.listeners(event) as FilterHandler<T>[],
		}));

		let updatedPayload = payload;
		for (const { event, listeners } of eventListeners) {
			for (const listener of listeners) {
				const result = await listener(updatedPayload, { event, ...meta }, context);

				if (result !== undefined) {
					updatedPayload = result;
				}
			}
		}

		return updatedPayload;
	}

	public emitAction(event: string | string[], meta: Record<string, any>, context: EventContext): void {
		const events = Array.isArray(event) ? event : [event];

		for (const event of events) {
			this.actionEmitter.emitAsync(event, { event, ...meta }, context).catch((err) => {
				logger.warn(`An error was thrown while executing action "${event}"`);
				logger.warn(err);
			});
		}
	}

	public async emitInit(event: string, meta: Record<string, any>): Promise<void> {
		try {
			await this.initEmitter.emitAsync(event, { event, ...meta });
		} catch (err: any) {
			logger.warn(`An error was thrown while executing init "${event}"`);
			logger.warn(err);
		}
	}

	public onFilter(event: string, handler: FilterHandler): void {
		this.filterEmitter.on(event, handler);
	}

	public onAction(event: string, handler: ActionHandler): void {
		this.actionEmitter.on(event, handler);
	}

	public onInit(event: string, handler: InitHandler): void {
		this.initEmitter.on(event, handler);
	}

	public offFilter(event: string, handler: FilterHandler): void {
		this.filterEmitter.off(event, handler);
	}

	public offAction(event: string, handler: ActionHandler): void {
		this.actionEmitter.off(event, handler);
	}

	public offInit(event: string, handler: InitHandler): void {
		this.initEmitter.off(event, handler);
	}

	public offAll(): void {
		this.filterEmitter.removeAllListeners();
		this.actionEmitter.removeAllListeners();
		this.initEmitter.removeAllListeners();
	}
}

const emitter = new Emitter();

export default emitter;
