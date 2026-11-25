import { afterEach, describe, expect, test, vi } from 'vitest';
import { FlowsService } from '../../../services/flows.js';
import { resolveFlows, restoreFlows } from './flows.js';

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../services/flows.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	return { FlowsService: mockItemsService().ItemsService };
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('resolveFlows', () => {
	test('only deactivates flows that are still active', async () => {
		vi.mocked(FlowsService.prototype.readByQuery).mockResolvedValue([{ id: 'f1' }] as any);

		await expect(resolveFlows(['f1', 'f2'])).resolves.toEqual(['f1']);

		expect(FlowsService.prototype.readByQuery).toHaveBeenCalledWith({
			fields: ['id'],
			filter: { _and: [{ id: { _in: ['f1', 'f2'] } }, { status: { _eq: 'active' } }] },
			limit: -1,
		});

		expect(FlowsService.prototype.updateOne).not.toHaveBeenCalledWith('f2', expect.anything());
	});

	test('returns only ids whose update fulfilled', async () => {
		vi.mocked(FlowsService.prototype.readByQuery).mockResolvedValue([
			{ id: 'f1' },
			{ id: 'broken' },
			{ id: 'f2' },
		] as any);

		vi.mocked(FlowsService.prototype.updateOne).mockImplementation(async (id: any) => {
			if (id === 'broken') throw new Error('fail');
			return id;
		});

		await expect(resolveFlows(['f1', 'broken', 'f2'])).resolves.toEqual(['f1', 'f2']);
		expect(FlowsService.prototype.updateOne).toHaveBeenCalledWith('f1', { status: 'inactive' });
	});
});

describe('restoreFlows', () => {
	test('sets status active and returns fulfilled ids', async () => {
		vi.mocked(FlowsService.prototype.updateOne).mockImplementation(async (id: any) => {
			if (id === 'broken') throw new Error('fail');
			return id;
		});

		await expect(restoreFlows(['f1', 'broken'], { accountability: null })).resolves.toEqual(['f1']);
		expect(FlowsService.prototype.updateOne).toHaveBeenCalledWith('f1', { status: 'active' });
	});
});
