import { EventEmitter2, ListenerFn } from 'eventemitter2';
import logger from './logger';

class Emitter {
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

	public async emitFilter(event: string, ...args: any[]): Promise<any[]> {
		return await this.filterEmitter.emitAsync(event, ...args);
	}

	public emitAction(event: string, ...args: any[]): void {
		this.actionEmitter.emitAsync(event, ...args).catch((err) => {
			logger.warn(`An error was thrown while executing action "${event}"`);
			logger.warn(err);
		});
	}

	public async emitInit(event: string, ...args: any[]): Promise<void> {
		try {
			await this.initEmitter.emitAsync(event, ...args);
		} catch (err: any) {
			logger.warn(`An error was thrown while executing init "${event}"`);
			logger.warn(err);
		}
	}

	public onFilter(event: string, listener: ListenerFn): void {
		this.filterEmitter.on(event, listener);
	}

	public onAction(event: string, listener: ListenerFn): void {
		this.actionEmitter.on(event, listener);
	}

	public onInit(event: string, listener: ListenerFn): void {
		this.initEmitter.on(event, listener);
	}

	public offFilter(event: string, listener: ListenerFn): void {
		this.filterEmitter.off(event, listener);
	}

	public offAction(event: string, listener: ListenerFn): void {
		this.actionEmitter.off(event, listener);
	}

	public offInit(event: string, listener: ListenerFn): void {
		this.initEmitter.off(event, listener);
	}
}

const emitter = new Emitter();

export default emitter;
