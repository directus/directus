import { type _Agent, agentWithIpValidation } from './agent-with-ip-validation.js';
import { isDeniedIp } from './is-denied-ip.js';
import EventEmitter from 'node:events';
import { type Agent } from 'node:http';
import { afterEach, beforeEach, expect, type Mock, test, vi } from 'vitest';

vi.mock('./is-denied-ip.js');

let mockSocket: EventEmitter & { destroy?: Mock };
let mockAgent: _Agent;

beforeEach(() => {
	mockSocket = new EventEmitter();
	mockSocket.destroy = vi.fn();

	const httpAgent = { createConnection: vi.fn().mockReturnValue(mockSocket) } as unknown as Agent;

	mockAgent = agentWithIpValidation(httpAgent) as _Agent;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Blocks request if host is missing', () => {
	const options = {};

	expect(() => mockAgent.createConnection?.(options, () => {})).toThrowError(
		`Request cannot be verified due to missing host`,
	);
});

test('Does not call IP check on createConnection if host is not an IP', () => {
	const options = { host: 'directus.io' };

	mockAgent.createConnection?.(options, () => {});

	expect(isDeniedIp).not.toHaveBeenCalled();
});

test('Calls IP check on createConnection if host is IP', async () => {
	const options = { host: '127.0.0.1' };

	mockAgent.createConnection?.(options, () => {});

	expect(isDeniedIp).toHaveBeenCalled();
});

test('Blocks on createConnection if IP is denied', async () => {
	vi.mocked(isDeniedIp).mockReturnValue(true);

	const options = { host: '127.0.0.1' };

	expect(() => mockAgent.createConnection?.(options, () => {})).toThrowError(
		`Requested domain "${options.host}" resolves to a denied IP address`,
	);
});

test('Blocks on resolve if IP is denied', async () => {
	vi.mocked(isDeniedIp).mockReturnValue(true);

	const options = { host: 'baddomain' };

	mockAgent.createConnection?.(options, () => {});

	mockSocket.emit('lookup', null, '127.0.0.1');

	expect(mockSocket.destroy).toHaveBeenCalledWith(
		new Error(`Requested domain "${options.host}" resolves to a denied IP address`),
	);
});

test('Does not block on resolve if IP is allowed', async () => {
	vi.mocked(isDeniedIp).mockReturnValue(false);

	const options = { host: 'directus.io' };

	mockAgent.createConnection?.(options, () => {});

	mockSocket.emit('lookup', null, '127.0.0.1');

	expect(mockSocket.destroy).not.toHaveBeenCalled();
});

test('Checks each resolved IP', async () => {
	vi.mocked(isDeniedIp).mockReturnValueOnce(false);
	vi.mocked(isDeniedIp).mockReturnValueOnce(true);

	const options = { host: 'baddomain' };

	mockAgent.createConnection?.(options, () => {});

	mockSocket.emit('lookup', null, '192.158.1.38');
	mockSocket.emit('lookup', null, '127.0.0.1');

	expect(mockSocket.destroy).toHaveBeenCalledWith(
		new Error(`Requested domain "${options.host}" resolves to a denied IP address`),
	);
});
