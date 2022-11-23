import { afterEach, beforeAll, describe, expect, SpyInstance, test, vi } from 'vitest';

import { getFlowManager } from '../../flows';
import config from './index';

vi.mock('../../flows', () => ({
	getFlowManager: vi.fn().mockReturnValue({
		runOperationFlow: vi.fn(),
	}),
}));

const testFlowId = '00000000-0000-0000-0000-000000000000';

describe('Operations / Trigger', () => {
	let runOperationFlowSpy: SpyInstance;

	beforeAll(() => {
		runOperationFlowSpy = vi.spyOn(getFlowManager(), 'runOperationFlow');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('runs the target flow one time for payload', async () => {
		const payload = { test: 'payload' };

		await config.handler({ flow: testFlowId, payload }, {} as any);

		expect(runOperationFlowSpy).toHaveBeenCalledOnce();
	});

	test('runs the target flow N times for number of items in payload array', async () => {
		const payload = [1, 2, 3, 4, 5];

		await config.handler({ flow: testFlowId, payload }, {} as any);

		expect(runOperationFlowSpy).toHaveBeenCalledTimes(payload.length);
	});

	test.each([
		{ payload: null, expected: null },
		{ payload: { test: 'test' }, expected: { test: 'test' } },
		{ payload: '{ "test": "test" }', expected: { test: 'test' } },
	])('payload $payload should be sent as $expected', async ({ payload, expected }) => {
		await config.handler({ flow: testFlowId, payload }, {} as any);

		expect(runOperationFlowSpy).toHaveBeenCalledWith(testFlowId, expected, expect.anything());
	});
});
