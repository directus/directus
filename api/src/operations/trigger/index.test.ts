import { afterEach, expect, test, vi } from 'vitest';

const runOperationFlow = vi.fn();

vi.doMock('../../flows.js', () => ({
	getFlowManager: vi.fn().mockReturnValue({
		runOperationFlow,
	}),
}));

const { default: config } = await import('./index.js');

const testFlowId = '00000000-0000-0000-0000-000000000000';

afterEach(() => {
	vi.clearAllMocks();
});

test('runs the target flow one time for payload', async () => {
	const payload = { test: 'payload' };

	await config.handler({ flow: testFlowId, payload }, {} as any);

	expect(runOperationFlow).toHaveBeenCalledOnce();
});

test('runs the target flow N times for number of items in payload array', async () => {
	const payload = [1, 2, 3, 4, 5];

	await config.handler({ flow: testFlowId, payload }, {} as any);

	expect(runOperationFlow).toHaveBeenCalledTimes(payload.length);
});

test.each([
	{ payload: null, expected: null },
	{ payload: { test: 'test' }, expected: { test: 'test' } },
	{ payload: '{ "test": "test" }', expected: { test: 'test' } },
])('payload $payload should be sent as $expected', async ({ payload, expected }) => {
	await config.handler({ flow: testFlowId, payload }, {} as any);

	expect(runOperationFlow).toHaveBeenCalledWith(testFlowId, expected, expect.anything());
});
