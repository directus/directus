import { useBus } from '../bus/index.js';
import type { Bus } from '@directus/memory';
import { nanoid } from 'nanoid';
import { Writable } from 'stream';

type PrettyType = 'basic' | 'http' | false;

const nodeId = nanoid(8);

export class LogsStream extends Writable {
	messenger: Bus;
	pretty: PrettyType;

	constructor(pretty: PrettyType) {
		super({ objectMode: true });
		this.messenger = useBus();
		this.pretty = pretty;
	}

	override _write(chunk: string, _encoding: string, callback: (error?: Error | null) => void) {
		if (!this.pretty) {
			// keeping this string interpolation for performance on RAW logs
			this.messenger.publish('logs', `{"log":${chunk},"nodeId":"${nodeId}"}`);
			return callback();
		}

		const log = JSON.parse(chunk);

		if (this.pretty === 'http' && log.req?.method && log.req?.url && log.res?.statusCode && log.responseTime) {
			this.messenger.publish(
				'logs',
				JSON.stringify({
					log: {
						level: log['level'],
						time: log['time'],
						msg: `${log.req.method} ${log.req.url} ${log.res.statusCode} ${log.responseTime}ms`,
					},
					nodeId: nodeId,
				}),
			);

			return callback();
		}

		this.messenger.publish(
			'logs',
			JSON.stringify({
				log: {
					level: log['level'],
					time: log['time'],
					msg: log['msg'],
				},
				nodeId: nodeId,
			}),
		);

		callback();
	}
}
