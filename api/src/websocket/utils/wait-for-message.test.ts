import { expect, describe, test, vi } from 'vitest';
import { waitForAnyMessage, waitForMessageType } from './wait-for-message';
import type { WebSocket, RawData } from 'ws';

function bufferMessage(msg: any): RawData {
	return Buffer.from(JSON.stringify(msg));
}

describe('Wait for messages', () => {
	test('should succeed, 5ms delay, 10ms timeout', async () => {
		const TEST_TIMEOUT = 10;
		const TEST_MSG = { type: 'test', id: 1 };
		const fakeClient = {
			on: vi.fn().mockImplementation((type: string, callback: (event: RawData) => void) => {
				if (type === 'message') {
					setTimeout(() => {
						callback(bufferMessage(TEST_MSG));
					}, 5);
				}
			}),
			off: vi.fn(),
		};
		const msg = await waitForAnyMessage(fakeClient as unknown as WebSocket, TEST_TIMEOUT);

		expect(msg).toStrictEqual(TEST_MSG);
	});
	test('should fail, 10ms delay, 5ms timeout', async () => {
		const TEST_TIMEOUT = 5;
		const TEST_MSG = { type: 'test', id: 1 };
		const fakeClient = {
			on: vi.fn().mockImplementation((type: string, callback: (event: RawData) => void) => {
				if (type === 'message') {
					setTimeout(() => {
						callback(bufferMessage(TEST_MSG));
					}, 10);
				}
			}),
			off: vi.fn(),
		};
		expect(() => waitForAnyMessage(fakeClient as unknown as WebSocket, TEST_TIMEOUT)).rejects.toBe(undefined);
	});
});

describe('Wait for specific types messages', () => {
	const MSG_A = { type: 'test', id: 1 };
	const MSG_B = { type: 'other', id: 2 };
	test('should find the correct message', async () => {
		const fakeClient = {
			on: vi.fn().mockImplementation((type: string, callback: (event: RawData) => void) => {
				if (type === 'message') {
					setTimeout(() => callback(bufferMessage(MSG_B)), 5);
					setTimeout(() => callback(bufferMessage(MSG_A)), 10);
				}
			}),
			off: vi.fn(),
		};
		const msg = await waitForMessageType(fakeClient as unknown as WebSocket, 'test', 15);

		expect(msg).toStrictEqual(MSG_A);
	});
	test('should fail, no matching type', async () => {
		const fakeClient = {
			on: vi.fn().mockImplementation((type: string, callback: (event: RawData) => void) => {
				if (type === 'message') {
					setTimeout(() => {
						callback(bufferMessage(MSG_B));
					}, 5);
				}
			}),
			off: vi.fn(),
		};
		expect(() => waitForMessageType(fakeClient as unknown as WebSocket, 'test', 10)).rejects.toBe(undefined);
	});
});
