import type { Panel } from '@directus/extensions';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useInsightsStore } from './insights';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';

const { apiPost, apiPatch, apiDelete } = vi.hoisted(() => ({
	apiPost: vi.fn(),
	apiPatch: vi.fn(),
	apiDelete: vi.fn(),
}));

vi.mock('@/api', () => {
	return {
		default: {
			post: apiPost,
			patch: apiPatch,
			delete: apiDelete,
		},
	};
});

vi.mock('@/stores/permissions', () => {
	return {
		usePermissionsStore: () => ({
			hasPermission: () => true,
		}),
	};
});

vi.mock('@/extensions', () => {
	return {
		useExtensions: () => ({
			panels: ref([]),
		}),
	};
});

vi.mock('@/utils/fetch-all', () => {
	return {
		fetchAll: vi.fn(),
	};
});

vi.mock('@/utils/unexpected-error', () => {
	return {
		unexpectedError: vi.fn(),
	};
});

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('saveChanges action', () => {
	test('should persist edits, refresh data, and clear staged changes', async () => {
		const insightsStore = useInsightsStore();

		const createdPanel = {
			id: '_temp-panel',
			width: 4,
			height: 4,
			position_x: 0,
			position_y: 0,
			type: 'table',
			options: {},
		} as Panel;

		const updatedPanel = { id: 'panel-1', name: 'Updated panel' } as Partial<Panel>;
		const deletedPanels = ['panel-2'];

		insightsStore.edits.create = [createdPanel];
		insightsStore.edits.update = [updatedPanel];
		insightsStore.edits.delete = deletedPanels;
		insightsStore.data = { '_temp-panel': { existing: true } };

		apiPost.mockResolvedValue({ data: {} });
		apiPatch.mockResolvedValue({ data: {} });
		apiDelete.mockResolvedValue({ data: {} });

		(fetchAll as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

		await insightsStore.saveChanges();

		expect(apiPost).toHaveBeenCalledWith('/panels', [expect.objectContaining({ type: 'table' })]);
		// @ts-ignore
		expect(apiPost.mock.calls[0][1][0].id).toBeUndefined();
		expect(apiPatch).toHaveBeenCalledWith('/panels', [updatedPanel]);
		expect(apiDelete).toHaveBeenCalledWith('/panels', { data: deletedPanels });
		expect(fetchAll).toHaveBeenCalledTimes(2);
		expect(insightsStore.data).not.toHaveProperty('_temp-panel');
		expect(insightsStore.edits.create).toEqual([]);
		expect(insightsStore.edits.update).toEqual([]);
		expect(insightsStore.edits.delete).toEqual([]);
		expect(insightsStore.saving).toBe(false);
	});

	test('should report errors and keep edits when persistence fails', async () => {
		const insightsStore = useInsightsStore();
		const error = new Error('fail');

		insightsStore.edits.create = [
			{
				id: '_temp-panel',
				width: 4,
				height: 4,
				position_x: 0,
				position_y: 0,
				type: 'table',
				options: {},
			} as Panel,
		];

		apiPost.mockRejectedValue(error);

		await insightsStore.saveChanges();

		expect(unexpectedError).toHaveBeenCalledWith(error);
		expect(insightsStore.edits.create).toHaveLength(1);
		expect(insightsStore.saving).toBe(false);
		expect(apiPatch).not.toHaveBeenCalled();
		expect(apiDelete).not.toHaveBeenCalled();
	});

	test('should only call POST /panels if only create edits exist', async () => {
		const insightsStore = useInsightsStore();
		const createdPanel = { id: '_temp-panel', type: 'table' } as Panel;
		insightsStore.edits.create = [createdPanel];
		apiPost.mockResolvedValue({ data: {} });
		(fetchAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		await insightsStore.saveChanges();

		expect(apiPost).toHaveBeenCalled();
		expect(apiPatch).not.toHaveBeenCalled();
		expect(apiDelete).not.toHaveBeenCalled();
	});

	test('should only call PATCH /panels if only update edits exist', async () => {
		const insightsStore = useInsightsStore();
		const updatedPanel = { id: 'panel-1', name: 'Updated panel' } as Partial<Panel>;
		insightsStore.edits.update = [updatedPanel];
		apiPatch.mockResolvedValue({ data: {} });
		(fetchAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		await insightsStore.saveChanges();

		expect(apiPost).not.toHaveBeenCalled();
		expect(apiPatch).toHaveBeenCalled();
		expect(apiDelete).not.toHaveBeenCalled();
	});

	test('should only call DELETE /panels if only delete edits exist', async () => {
		const insightsStore = useInsightsStore();
		insightsStore.edits.delete = ['panel-2'];
		apiDelete.mockResolvedValue({ data: {} });
		(fetchAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		await insightsStore.saveChanges();

		expect(apiPost).not.toHaveBeenCalled();
		expect(apiPatch).not.toHaveBeenCalled();
		expect(apiDelete).toHaveBeenCalled();
	});

	test('should not call any API if no edits exist', async () => {
		const insightsStore = useInsightsStore();
		(fetchAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		await insightsStore.saveChanges();

		expect(apiPost).not.toHaveBeenCalled();
		expect(apiPatch).not.toHaveBeenCalled();
		expect(apiDelete).not.toHaveBeenCalled();
	});
});
