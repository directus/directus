import type { OperationRaw } from '@directus/types';
import { describe, expect, type MockedFunction, test, vi } from 'vitest';
import type { ItemsService } from '../../../services/items.js';
import { layoutFlow, relayoutFlow } from './position.js';

const reload = vi.hoisted(() => vi.fn());

vi.mock('../../../flows.js', () => ({ getFlowManager: () => ({ reload }) }));
vi.mock('../../../logger/index.js', () => ({ useLogger: () => ({ warn: vi.fn() }) }));

interface MockOperation {
	id: string;
	resolve?: string | null;
	reject?: string | null;
	position_x: number;
	position_y: number;
}

function mockService(operations: MockOperation[]) {
	return {
		readByQuery: vi
			.fn()
			.mockResolvedValue(operations.map((operation) => ({ resolve: null, reject: null, ...operation }))),
		updateBatch: vi.fn().mockResolvedValue([]),
	} as unknown as ItemsService<OperationRaw> & { readByQuery: MockedFunction<any>; updateBatch: MockedFunction<any> };
}

describe('layoutFlow', () => {
	test('reads only the target flow and writes nothing when the layout is already correct', async () => {
		const service = mockService([
			{ id: 'a', resolve: 'b', position_x: 19, position_y: 1 },
			{ id: 'b', position_x: 37, position_y: 1 },
		]);

		await layoutFlow(service, 'flow-1', null);

		expect(service.readByQuery).toHaveBeenCalledWith({
			filter: { flow: { _eq: 'flow-1' } },
			fields: ['id', 'resolve', 'reject', 'position_x', 'position_y'],
			limit: -1,
		});

		expect(service.updateBatch).not.toHaveBeenCalled();
	});

	test('re-derives a scrambled graph into one column per hop with reject branches on a fresh row', async () => {
		const service = mockService([
			{ id: 'read', resolve: 'condition', position_x: 1, position_y: 1 },
			{ id: 'condition', resolve: 'success', reject: 'failure', position_x: 1, position_y: 1 },
			{ id: 'success', position_x: 42, position_y: 10 },
			{ id: 'failure', position_x: 1, position_y: 1 },
		]);

		await layoutFlow(service, 'flow-1', null);

		expect(service.updateBatch).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ id: 'read', position_x: 19, position_y: 1 },
				{ id: 'condition', position_x: 37, position_y: 1 },
				{ id: 'success', position_x: 55, position_y: 1 },
				{ id: 'failure', position_x: 55, position_y: 17 },
			]),
		);
	});

	test('puts the entry operation first and stacks other fragments in their own row bands', async () => {
		const service = mockService([
			{ id: 'stray', position_x: 1, position_y: 1 },
			{ id: 'entry', resolve: 'next', position_x: 1, position_y: 1 },
			{ id: 'next', position_x: 1, position_y: 1 },
		]);

		await layoutFlow(service, 'flow-1', 'entry');

		expect(service.updateBatch).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ id: 'entry', position_x: 19, position_y: 1 },
				{ id: 'next', position_x: 37, position_y: 1 },
				{ id: 'stray', position_x: 19, position_y: 17 },
			]),
		);
	});

	test('parks cyclic operations in a row of their own without hanging', async () => {
		const service = mockService([
			{ id: 'a', resolve: 'b', position_x: 1, position_y: 1 },
			{ id: 'b', resolve: 'a', position_x: 1, position_y: 1 },
		]);

		await layoutFlow(service, 'flow-1', null);

		expect(service.updateBatch).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ id: 'a', position_x: 19, position_y: 17 },
				{ id: 'b', position_x: 37, position_y: 17 },
			]),
		);
	});
});

describe('relayoutFlow', () => {
	test('anchors the layout on the configured entry and reloads the flow engine after writes', async () => {
		const service = mockService([
			{ id: 'stray', position_x: 19, position_y: 1 },
			{ id: 'entry', position_x: 37, position_y: 1 },
		]);

		const flowsService = { readOne: vi.fn().mockResolvedValue({ operation: 'entry' }) } as any;

		await relayoutFlow(service, flowsService, 'flow-1');

		expect(flowsService.readOne).toHaveBeenCalledWith('flow-1', { fields: ['operation'] });

		expect(service.updateBatch).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ id: 'entry', position_x: 19, position_y: 1 },
				{ id: 'stray', position_x: 19, position_y: 17 },
			]),
		);

		expect(reload).toHaveBeenCalled();
	});

	test('never fails the data operation when layout errors', async () => {
		const service = mockService([]);
		const flowsService = { readOne: vi.fn().mockRejectedValue(new Error('boom')) } as any;

		await expect(relayoutFlow(service, flowsService, 'flow-1')).resolves.toBeUndefined();
	});
});
