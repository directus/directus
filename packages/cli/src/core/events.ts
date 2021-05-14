import { EventEmitter2 } from 'eventemitter2';
import { IEvents, Listener } from '../events';

export class Events implements IEvents {
	private events: EventEmitter2;

	constructor() {
		this.events = new EventEmitter2({
			ignoreErrors: true,
			wildcard: true,
		});
	}

	on(event: string, listener: Listener): void {
		this.events.on(event, listener);
	}

	async emit(event: string, ...args: any[]): Promise<void> {
		await this.events.emitAsync(event, ...args);
	}
}
