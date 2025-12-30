import { LogsStream } from './logs-stream.js';
import { useBus } from '../bus/index.js';
import { omit } from 'lodash-es';
import { randomUUID } from 'node:crypto';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../bus/index.js', () => ({
	useBus: vi.fn().mockReturnValue({
		publish: vi.fn(),
	}),
}));

vi.mock('nanoid', () => ({
	nanoid: () => {
		return 'a-nanoid';
	},
}));

afterEach(() => {
	vi.clearAllMocks();
});

const sample = {
	log: {
		level: 30,
		time: new Date().getTime(),
		msg: `This is a ${randomUUID()} log`,
	},
	httpLog: {
		level: 30,
		time: new Date().getTime(),
		msg: `This is a ${randomUUID()} log`,
		req: {
			method: randomUUID(),
			url: randomUUID(),
		},
		res: {
			statusCode: randomUUID(),
		},
		responseTime: randomUUID(),
	},
};

test('Publishes raw log when pretty is false', () => {
	const messenger = useBus();
	const logStream = new LogsStream(false);
	const logString = JSON.stringify(sample.log);

	logStream._write(logString, '', () => {});

	expect(messenger.publish).toBeCalledWith(
		'logs',
		JSON.stringify({
			log: sample.log,
			nodeId: 'a-nanoid',
		}),
	);
});

test('Publishes http log when pretty is false', () => {
	const messenger = useBus();
	const logStream = new LogsStream(false);
	const logString = JSON.stringify(sample.httpLog);

	logStream._write(logString, '', () => {});

	expect(messenger.publish).toBeCalledWith(
		'logs',
		JSON.stringify({
			log: sample.httpLog,
			nodeId: 'a-nanoid',
		}),
	);
});

test('Publishes prettified log when pretty is basic', () => {
	const messenger = useBus();
	const logStream = new LogsStream('basic');
	const logString = JSON.stringify(sample.log);

	logStream._write(logString, '', () => {});

	expect(messenger.publish).toBeCalledWith(
		'logs',
		JSON.stringify({
			log: sample.log,
			nodeId: 'a-nanoid',
		}),
	);
});

test('Publishes prettified http log when pretty is http', () => {
	const messenger = useBus();
	const logStream = new LogsStream('http');
	const logString = JSON.stringify(omit(sample.httpLog, ['req', 'res', 'responseTime']));

	logStream._write(logString, '', () => {});

	expect(messenger.publish).toBeCalledWith(
		'logs',
		JSON.stringify({
			log: {
				level: sample.httpLog.level,
				time: sample.httpLog.time,
				msg: sample.httpLog.msg,
			},
			nodeId: 'a-nanoid',
		}),
	);
});

test('Escapes quotes in error messages', () => {
	const messenger = useBus();
	const logStream = new LogsStream('basic');

	const log = {
		level: 30,
		time: new Date().getTime(),
		msg: `Am I "'escaped'"=?`,
	};

	logStream._write(JSON.stringify(log), '', () => {});

	expect(messenger.publish).toBeCalledWith('logs', JSON.stringify({ log, nodeId: 'a-nanoid' }));
});
