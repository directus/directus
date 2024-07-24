import type { Bus } from '@directus/memory';
import { nanoid } from 'nanoid';
import { Writable } from 'stream';
import { useBus } from '../bus/index.js';

export class LogsStream extends Writable {
	messenger: Bus;
	nodeId: string;

	constructor() {
		super({ objectMode: true });
		this.messenger = useBus();
		this.nodeId = nanoid(8);
	}

	override _write(chunk: string, _encoding: string, callback: (error?: Error | null) => void) {
		this.messenger.publish('logs', `{"log":${chunk},"nodeId":"${this.nodeId}"}`);
		callback();
	}
}
