import { expect, describe, test, vi } from 'vitest';
import { trimUpper, fmtMessage, safeSend } from './message';
import type { WebSocketClient } from '../types';

describe('trimUpper util', () => {
	test('Returns uppercase trimmed "TYPE"', () => {
		expect(trimUpper('TYPE')).toBe('TYPE');
	});
	test('Returns uppercase trimmed "123@ !some"', () => {
		expect(trimUpper('123@ !some')).toBe('123@ !SOME');
	});
	test('Returns uppercase trimmed "FalSe"', () => {
		expect(trimUpper('FalSe')).toBe('FALSE');
	});
	test('Returns uppercase trimmed "  long with spaces"', () => {
		expect(trimUpper('  long with spaces')).toBe('LONG WITH SPACES');
	});
});
describe('fmtMessage util', () => {
	test('Returns formatted message', () => {
		const result = fmtMessage('test', { test: 'abc' });
		expect(result).toStrictEqual('{"type":"test","test":"abc"}');
	});
	test('Returns formatted message with uid', () => {
		const result = fmtMessage('test', { test: 'abc' }, '123');
		expect(result).toStrictEqual('{"type":"test","test":"abc","uid":"123"}');
	});
});

describe('safeSend util', () => {
	test('Ignore for closed connections', async () => {
		const fakeClient = {
			readyState: 3, // closed
			OPEN: 1,
			bufferedAmount: 0,
			send: vi.fn(),
		} as unknown as WebSocketClient;
		const result = await safeSend(fakeClient, 'not used');
		expect(result).toBe(false);
		expect(fakeClient.send).not.toBeCalled();
	});
	test('Wait for buffer', async () => {
		const fakeClient = {
			readyState: 1, // open
			OPEN: 1,
			bufferedAmount: 4,
			send: vi.fn(),
		};
		setTimeout(() => {
			fakeClient.bufferedAmount = 0;
		}, 10);
		const result = await safeSend(fakeClient as unknown as WebSocketClient, 'a message', 20);
		expect(result).toBe(true);
		expect(fakeClient.send).toBeCalledWith('a message');
	});
	test('send message', async () => {
		const fakeClient = {
			readyState: 1, // open
			OPEN: 1,
			bufferedAmount: 0,
			send: vi.fn(),
		} as unknown as WebSocketClient;
		const result = await safeSend(fakeClient as unknown as WebSocketClient, 'a message');
		expect(result).toBe(true);
		expect(fakeClient.send).toBeCalledWith('a message');
	});
});
