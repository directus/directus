import { describe, beforeEach, expect, test, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { injectRunManualFlow, useFlows } from './use-flows';
import { computed, ref } from 'vue';
import { useFlowsStore } from '@/stores/flows';
import api from '@/api';

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
	primaryKey: computed(() => 'item_1'),
	location: ref('collection' as const),
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
});

describe('isConfirmButtonDisabled', () => {
	describe('true', () => {
		test('flowToConfirm is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, isConfirmButtonDisabled } = flowDialogsContext.value;

			flowToConfirm.value = null;

			expect(isConfirmButtonDisabled.value).toEqual(true);
		});

		test('when confirmDialogDetails has required fields', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, isConfirmButtonDisabled } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[0]!.id;

			expect(isConfirmButtonDisabled.value).toEqual(true);
		});
	});

	describe('false', () => {
		test('when confirmDialogDetails has required fields', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[1]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, isConfirmButtonDisabled } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[1]!.id;

			expect(isConfirmButtonDisabled.value).toEqual(false);
		});
	});
});

describe('displayUnsavedChangesDialog', () => {
	test('true', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { flowDialogsContext } = useFlows(useFlowsOptions);

		const { flowToConfirm, displayUnsavedChangesDialog } = flowDialogsContext.value;

		flowToConfirm.value = mockFlows[0]!.id;

		expect(displayUnsavedChangesDialog.value).toEqual(true);
	});

	describe('false', () => {
		test('flowToConfirm.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, displayUnsavedChangesDialog } = flowDialogsContext.value;

			flowToConfirm.value = null;

			expect(displayUnsavedChangesDialog.value).toEqual(false);
		});

		test('hasEdits is falsy', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				hasEdits: ref(false),
			};

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(testUseFlowsOptions);

			const { flowToConfirm, displayUnsavedChangesDialog } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[0]!.id;

			expect(displayUnsavedChangesDialog.value).toEqual(false);
		});
	});
});

describe('displayCustomConfirmDialog', () => {
	test('true', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { flowDialogsContext } = useFlows(useFlowsOptions);

		const { flowToConfirm, confirmUnsavedChanges, displayCustomConfirmDialog } = flowDialogsContext.value;

		flowToConfirm.value = mockFlows[0]!.id;
		confirmUnsavedChanges(mockFlows[0]!.id);

		expect(displayCustomConfirmDialog.value).toEqual(true);
	});

	describe('false', () => {
		test('flowToConfirm.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, displayCustomConfirmDialog } = flowDialogsContext.value;

			flowToConfirm.value = null;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(flowToConfirm.value).toBeFalsy();
		});

		test('confirmDialogDetails.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[2]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(useFlowsOptions);

			const { flowToConfirm, displayCustomConfirmDialog } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[1]!.id;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(flowToConfirm.value).toBeTruthy();
		});

		test('hasEdits is falsy', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				hasEdits: ref(false),
			};

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(testUseFlowsOptions);

			const { flowToConfirm, confirmDialogDetails, displayCustomConfirmDialog } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[0]!.id;

			expect(displayCustomConfirmDialog.value).toEqual(true);
			expect(flowToConfirm.value).toBeTruthy();
			expect(confirmDialogDetails.value).toBeTruthy();
		});

		test('hasEdits is truthy and confirmedUnsavedChanges is falsy', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				hasEdits: ref(true),
			};

			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { flowDialogsContext } = useFlows(testUseFlowsOptions);

			const { flowToConfirm, confirmDialogDetails, displayCustomConfirmDialog } = flowDialogsContext.value;

			flowToConfirm.value = mockFlows[0]!.id;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(flowToConfirm.value).toBeTruthy();
			expect(confirmDialogDetails.value).toBeTruthy();
		});
	});
});

describe('manualFlow.isFlowDisabled', () => {
	describe('false', () => {
		test('location is "item"', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				location: ref('item' as const),
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
	test('returns early when isActionDisabled is true', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { manualFlows, runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow('flow-1', true);

		expect(api.post).not.toHaveBeenCalled();
		expect(manualFlows.value[0]!.isFlowRunning).toEqual(false);
	});

	test('returns early when selectedFlow is not found', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { manualFlows, runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow('non-existent-flow', false);

		expect(api.post).not.toHaveBeenCalled();

		manualFlows.value.forEach((manualFlow) => {
			expect(manualFlow.isFlowRunning).toEqual(false);
		});
	});

	test('returns early when flow is not in manualFlows (filtered out)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[1]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { manualFlows, runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow(mockFlows[1]!.id, false);

		expect(api.post).not.toHaveBeenCalled();

		manualFlows.value.forEach((manualFlow) => {
			expect(manualFlow.isFlowRunning).toEqual(false);
		});
	});

	test('successfully runs flow for collection with requireSelection false', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[4]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const testOptions = {
			...useFlowsOptions,
			selection: ref([]),
		};

		const { runManualFlow, flowDialogsContext } = useFlows(testOptions);

		const { confirmValues, flowToConfirm, confirmUnsavedChanges } = flowDialogsContext.value;

		confirmValues.value = { testField: 'testValue' };

		confirmUnsavedChanges(mockFlows[4]!.id);

		await runManualFlow(mockFlows[4]!.id, false);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[4]!.id}`, {
			testField: 'testValue',
			collection: 'test_collection',
		});

		expect(flowToConfirm.value).toBeNull();
	});

	test('successfully runs flow with keys (primaryKey or selection)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow, flowDialogsContext } = useFlows(useFlowsOptions);

		const { confirmValues, flowToConfirm, confirmUnsavedChanges } = flowDialogsContext.value;

		confirmValues.value = { testField: 'testValue' };

		confirmUnsavedChanges(mockFlows[0]!.id);

		await runManualFlow(mockFlows[0]!.id, false);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[0]!.id}`, {
			testField: 'testValue',
			collection: 'test_collection',
			keys: ['item_1'],
		});

		expect(flowToConfirm.value).toBeNull();
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
		};

		const { runManualFlow, flowDialogsContext } = useFlows(testOptions);

		const { confirmUnsavedChanges } = flowDialogsContext.value;

		confirmUnsavedChanges(mockFlows[0]!.id);

		await runManualFlow(mockFlows[0]!.id, false);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[0]!.id}`, {
			collection: 'test_collection',
			keys: [{ id: 'item1' }, { id: 'item2' }],
		});
	});

	test('calls onRefreshCallback', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow, flowDialogsContext } = useFlows(useFlowsOptions);

		const { confirmUnsavedChanges } = flowDialogsContext.value;

		confirmUnsavedChanges(mockFlows[0]!.id);

		await runManualFlow(mockFlows[0]!.id, false);

		expect(mockOnRefresh).toHaveBeenCalledOnce();
	});
});
