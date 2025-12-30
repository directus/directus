import { useFlows } from './use-flows';
import api from '@/api';
import { useFlowsStore } from '@/stores/flows';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, ref } from 'vue';

vi.mock('@/stores/flows');

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: vi.fn((key: string, params?: any) => {
			if (key === 'run_flow_on_current') return 'Run Flow on Current';
			if (key === 'run_flow_on_selected') return `Run Flow on Selected (${params})`;
			if (key === 'run_flow') return 'Run Flow';
			if (key === 'run_flow_on_current_collection') return 'Run Flow on Current Collection';
			if (key === 'trigger_flow_success') return `Flow ${params?.flow} triggered successfully`;
			return key;
		}),
	}),
	createI18n: vi.fn(() => ({})),
}));

vi.mock('@directus/composables', () => ({
	useCollection: () => ({
		primaryKeyField: ref({ field: 'id', type: 'integer' }),
	}),
}));

vi.mock('@/utils/notify');

vi.mock('@/utils/translate-object-values', () => ({
	translate: vi.fn((obj) => obj),
}));

vi.mock('@/utils/unexpected-error');

vi.mock('@directus/format-title', () => ({
	default: vi.fn((str) => str),
}));

vi.mock('@/api');

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: () => ({
		refreshUnreadCount: vi.fn(),
	}),
}));

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

const mockOnRefresh = vi.fn();

const useFlowsOptions = {
	collection: ref('test_collection'),
	primaryKey: ref('item_1'),
	location: 'collection' as const,
	hasEdits: ref(true),
	onRefreshCallback: mockOnRefresh,
};

const mockFlows = [
	{
		id: 'flow-1',
		name: 'Test Flow 1',
		trigger: 'manual',
		status: 'active',
		options: {
			collections: ['test_collection'],
			location: 'collection',
			requireConfirmation: true,
			confirmationDescription: 'test-description-1',
			fields: [{ name: 'field-1', meta: { required: true } }],
		},
	},
	{
		id: 'flow-2',
		name: 'Test Flow 2',
		trigger: 'manual',
		status: 'active',
		options: {
			collections: ['test_collection'],
			location: 'item',
			requireConfirmation: false,
			requireSelection: false,
		},
	},
	{
		id: 'flow-3',
		name: 'Test Flow 3',
		trigger: 'event',
		status: 'active',
		options: {
			collections: ['test_collection'],
			location: 'item',
			requireConfirmation: true,
			confirmationDescription: 'test-description-3',
			requireSelection: false,
		},
	},
	{
		id: 'flow-4',
		name: 'Test Flow 4',
		trigger: 'event',
		status: 'active',
		options: {
			collections: ['test_collection'],
			location: 'collection',
			requireConfirmation: false,
			fields: [{ name: 'field-1', meta: { required: false } }],
		},
	},
	{
		id: 'flow-5',
		name: 'Test',
		trigger: 'manual',
		status: 'active',
		options: {
			collections: ['test_collection'],
			location: 'collection',
			requireSelection: false,
		},
	},
];

describe('manualFlows', () => {
	test('returns empty array when no manual flows', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { manualFlows } = useFlows(useFlowsOptions);

		expect(manualFlows.value.length).toEqual(0);
		expect(mockFlowsStore.getManualFlowsForCollection).toHaveBeenCalledWith('test_collection');
	});

	test('returns manual flows when some are found', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { manualFlows } = useFlows(useFlowsOptions);

		expect(manualFlows.value.length).toEqual(3);
		expect(mockFlowsStore.getManualFlowsForCollection).toHaveBeenCalledWith('test_collection');
	});

	test('returns collection specific flows when changing collection', async () => {
		const mockGetManualFlows = vi.fn();

		mockGetManualFlows.mockReturnValue(mockFlows);

		const mockFlowsStore = {
			getManualFlowsForCollection: mockGetManualFlows,
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const testCollection = ref('test_collection');

		const { manualFlows } = useFlows({ ...useFlowsOptions, collection: testCollection });

		expect(manualFlows.value.length).toEqual(3);
		expect(mockGetManualFlows).toHaveBeenLastCalledWith('test_collection');

		mockGetManualFlows.mockReturnValue([]);

		testCollection.value = 'test_collection_2';

		await nextTick();

		expect(manualFlows.value.length).toEqual(0);
		expect(mockGetManualFlows).toHaveBeenLastCalledWith('test_collection_2');
		expect(mockGetManualFlows).toHaveBeenCalledTimes(2);
	});
});

describe('manualFlow.isFlowDisabled', () => {
	describe('false', () => {
		test('location is "item"', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				location: 'item' as const,
			};

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { manualFlows } = useFlows(testUseFlowsOptions);

			manualFlows.value.forEach((manualFlow) => {
				expect(manualFlow.isFlowDisabled).toEqual(false);
			});
		});

		test('manualFlow.options.requireSelection is false', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { manualFlows } = useFlows(useFlowsOptions);

			manualFlows.value.forEach((manualFlow) => {
				expect(manualFlow.isFlowDisabled).toEqual(false);
			});
		});

		test('location is "collection" but has primaryKey', () => {
			const mockFlow = { ...mockFlows[0], options: {} };

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlow]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { manualFlows } = useFlows(useFlowsOptions);

			manualFlows.value.forEach((manualFlow) => {
				expect(manualFlow.isFlowDisabled).toEqual(false);
			});
		});
	});

	describe('true', () => {
		test('location is "collection", no primaryKey, no selection, requireSelection not false', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				primaryKey: undefined,
			};

			const mockFlow = { ...mockFlows[0], options: { requireSelection: true } };

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlow]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { manualFlows } = useFlows(testUseFlowsOptions);

			manualFlows.value.forEach((manualFlow) => {
				expect(manualFlow.isFlowDisabled).toEqual(true);
			});
		});
	});
});

describe('runManualFlow', () => {
	test('returns early when selectedFlow is not found', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow('non-existent-flow');

		expect(api.post).not.toHaveBeenCalled();
	});

	test('returns early when flow is not in manualFlows (filtered out)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[1]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow(mockFlows[1]!.id);

		expect(api.post).not.toHaveBeenCalled();
	});

	test('successfully runs flow for collection with requireSelection false', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[4]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow, flowDialogsContext } = useFlows(useFlowsOptions);

		const { currentFlowId, confirmUnsavedChanges } = flowDialogsContext.value;

		confirmUnsavedChanges(mockFlows[4]!.id);

		await runManualFlow(mockFlows[4]!.id);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[4]!.id}`, {
			collection: 'test_collection',
		});

		expect(currentFlowId).toBeNull();
	});

	test('successfully runs flow with keys (primaryKey or selection)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const testOptions = {
			...useFlowsOptions,
			hasEdits: ref(false),
		};

		const { runManualFlow, flowDialogsContext } = useFlows(testOptions);

		const { currentFlowId } = flowDialogsContext.value;

		await runManualFlow(mockFlows[4]!.id);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[4]!.id}`, {
			collection: 'test_collection',
		});

		expect(currentFlowId).toBeNull();
	});

	test('uses selection when no primaryKey is available', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const testOptions = {
			...useFlowsOptions,
			primaryKey: undefined,
			selection: ref([{ id: 'item1' }, { id: 'item2' }]),
			hasEdits: ref(false),
		};

		const { runManualFlow } = useFlows(testOptions);

		await runManualFlow(mockFlows[4]!.id);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[4]!.id}`, {
			collection: 'test_collection',
			keys: [{ id: 'item1' }, { id: 'item2' }],
		});
	});

	test('calls onRefreshCallback', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		const testOptions = {
			...useFlowsOptions,
			hasEdits: ref(false),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow } = useFlows(testOptions);

		await runManualFlow(mockFlows[3]!.id);

		expect(mockOnRefresh).toHaveBeenCalledOnce();
	});

	test('calls runFlow with reactive primaryKey', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		const testOptions = {
			...useFlowsOptions,
			primaryKey: ref('item_1'),
			hasEdits: ref(false),
			location: 'item' as const,
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow } = useFlows(testOptions);

		await runManualFlow(mockFlows[1]!.id);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[1]!.id}`, {
			collection: 'test_collection',
			keys: ['item_1'],
		});

		testOptions.primaryKey.value = 'item_2';

		await runManualFlow(mockFlows[1]!.id);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[1]!.id}`, {
			collection: 'test_collection',
			keys: ['item_2'],
		});
	});
});
