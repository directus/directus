import type { Bus } from '@directus/memory';
import { Writable } from 'stream';
import { useBus } from '../bus/index.js';

export class LogsStream extends Writable {
	messenger: Bus;

	constructor() {
		super({ objectMode: true });
		this.messenger = useBus();
	}

	override _write(chunk: any, _encoding: string, callback: (error?: Error | null) => void) {
		this.messenger.publish('logs', chunk);
		callback();
	}
}
