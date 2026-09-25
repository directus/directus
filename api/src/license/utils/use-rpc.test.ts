import { beforeEach, expect, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import { createMockBus } from '../../test-utils/bus.js';
import { useRPC } from './use-rpc.js';

vi.mock('../../bus/index.js');

const warn = vi.fn();

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({ warn }),
}));

let testBus: ReturnType<typeof createMockBus>;

beforeEach(() => {
	warn.mockReset();
	testBus = createMockBus();
	vi.mocked(useBus).mockReturnValue(testBus.bus as any);
});

test('awaiting the returned proxy resolves rather than hanging on a `then` call', async () => {
	const rpc = await useRPC({ syncState: vi.fn() }, 'license');

	expect((rpc as Record<string, unknown>)['then']).toBeUndefined();
	expect(testBus.bus.publish).not.toHaveBeenCalled();
});

test('calling a method on the proxy publishes it to the channel with its arguments', async () => {
	const rpc = await useRPC({ syncState: vi.fn<(scope: string, retries: number) => Promise<void>>() }, 'license');

	await rpc.syncState('entitlements', 2);

	expect(testBus.bus.publish).toHaveBeenCalledWith('license', {
		uid: expect.any(String),
		method: 'syncState',
		args: ['entitlements', 2],
	});
});

test('a call reaches every other instance on the channel but not the one that made it', async () => {
	const caller = vi.fn();
	const other = vi.fn();

	const rpc = await useRPC({ syncState: caller }, 'license');
	await useRPC({ syncState: other }, 'license');

	await rpc.syncState('entitlements');

	expect(other).toHaveBeenCalledWith('entitlements');
	expect(caller).not.toHaveBeenCalled();
});

test('a call on another channel is not delivered', async () => {
	const other = vi.fn();

	const rpc = await useRPC({ syncState: vi.fn() }, 'license');
	await useRPC({ syncState: other }, 'entitlements');

	await rpc.syncState();

	expect(other).not.toHaveBeenCalled();
});

test('a call naming a method the receiving instance does not have warns instead of throwing', async () => {
	const rpc = await useRPC({ syncState: vi.fn() }, 'license');
	await useRPC({}, 'license');

	await expect(rpc.syncState()).resolves.toBeUndefined();

	await vi.waitFor(() => {
		expect(warn).toHaveBeenCalledWith('Ignoring unknown RPC method "syncState" on "license"');
	});
});

test('a method that rejects on the receiving instance is reported rather than left unhandled', async () => {
	const failure = new Error('could not reach the license server');

	const rpc = await useRPC({ syncState: vi.fn() }, 'license');
	await useRPC({ syncState: vi.fn().mockRejectedValue(failure) }, 'license');

	await expect(rpc.syncState()).resolves.toBeUndefined();

	await vi.waitFor(() => {
		expect(warn).toHaveBeenCalledWith(failure, 'RPC "syncState" on "license" failed');
	});
});
