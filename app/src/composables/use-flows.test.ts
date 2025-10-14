import { describe, beforeEach, expect, test, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { useFlows } from './use-flows';
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
	resetState();
});

function resetState() {
	const { resetConfirm } = useFlows(useFlowsOptions);
	resetConfirm();
}

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
		test('confirmRunFlow is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, isConfirmButtonDisabled } = useFlows(useFlowsOptions);

			confirmRunFlow.value = null;

			expect(isConfirmButtonDisabled.value).toEqual(true);
		});

		test('when confirmDialogDetails has required fields', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, isConfirmButtonDisabled } = useFlows(useFlowsOptions);

			confirmRunFlow.value = mockFlows[0]!.id;

			expect(isConfirmButtonDisabled.value).toEqual(true);
		});
	});

	describe('false', () => {
		test('when confirmDialogDetails has required fields', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[1]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, isConfirmButtonDisabled } = useFlows(useFlowsOptions);

			confirmRunFlow.value = mockFlows[1]!.id;

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

		const { confirmRunFlow, displayUnsavedChangesDialog } = useFlows(useFlowsOptions);

		confirmRunFlow.value = mockFlows[0]!.id;

		expect(displayUnsavedChangesDialog.value).toEqual(true);
	});

	describe('false', () => {
		test('confirmRunFlow.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, displayUnsavedChangesDialog } = useFlows(useFlowsOptions);

			confirmRunFlow.value = null;

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

			const { confirmRunFlow, displayUnsavedChangesDialog } = useFlows(testUseFlowsOptions);

			confirmRunFlow.value = mockFlows[0]!.id;

			expect(displayUnsavedChangesDialog.value).toEqual(false);
		});

		test('confirmedUnsavedChanges is truthy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, displayUnsavedChangesDialog, confirmedUnsavedChanges } = useFlows(useFlowsOptions);

			confirmedUnsavedChanges.value = true;
			confirmRunFlow.value = mockFlows[0]!.id;

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

		const { confirmRunFlow, displayCustomConfirmDialog, confirmedUnsavedChanges } = useFlows(useFlowsOptions);

		confirmedUnsavedChanges.value = true;
		confirmRunFlow.value = mockFlows[0]!.id;

		expect(displayCustomConfirmDialog.value).toEqual(true);
	});

	describe('false', () => {
		test('confirmRunFlow.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[0]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, displayCustomConfirmDialog } = useFlows(useFlowsOptions);

			confirmRunFlow.value = null;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(confirmRunFlow.value).toBeFalsy();
		});

		test('confirmDialogDetails.value is falsy', () => {
			const mockFlowsStore = {
				getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[2]]),
			};

			vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

			const { confirmRunFlow, confirmDialogDetails, displayCustomConfirmDialog } = useFlows(useFlowsOptions);

			confirmRunFlow.value = mockFlows[1]!.id;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(confirmRunFlow.value).toBeTruthy();
			expect(confirmDialogDetails.value).toBeFalsy();
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

			const { confirmRunFlow, confirmDialogDetails, displayCustomConfirmDialog } = useFlows(testUseFlowsOptions);

			confirmRunFlow.value = mockFlows[0]!.id;

			expect(displayCustomConfirmDialog.value).toEqual(true);
			expect(confirmRunFlow.value).toBeTruthy();
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

			const { confirmRunFlow, confirmDialogDetails, displayCustomConfirmDialog, confirmedUnsavedChanges } =
				useFlows(testUseFlowsOptions);

			confirmRunFlow.value = mockFlows[0]!.id;
			confirmedUnsavedChanges.value = false;

			expect(displayCustomConfirmDialog.value).toEqual(false);
			expect(confirmRunFlow.value).toBeTruthy();
			expect(confirmDialogDetails.value).toBeTruthy();
		});
	});
});

describe('checkFlowDisabled', () => {
	describe('false', () => {
		test('location is "item"', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				location: ref('item' as const),
			};

			const { checkFlowDisabled } = useFlows(testUseFlowsOptions);

			expect(checkFlowDisabled({} as any)).toEqual(false);
		});

		test('manualFlow.options.requireSelection is false', () => {
			const { checkFlowDisabled } = useFlows(useFlowsOptions);

			expect(checkFlowDisabled({ options: { requireSelection: false } } as any)).toEqual(false);
		});

		test('location is "collection" but has primaryKey', () => {
			const { checkFlowDisabled } = useFlows(useFlowsOptions);

			expect(checkFlowDisabled({ options: {} } as any)).toEqual(false);
		});
	});

	describe('true', () => {
		test('location is "collection", no primaryKey, no selection, requireSelection not false', () => {
			const testUseFlowsOptions = {
				...useFlowsOptions,
				primaryKey: undefined,
				selection: ref([]),
			};

			const { checkFlowDisabled } = useFlows(testUseFlowsOptions);

			expect(checkFlowDisabled({ options: { requireSelection: true } } as any)).toEqual(true);
		});
	});
});

describe('onFlowClick', () => {
	test('returns early when flow is not found', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { confirmRunFlow, onFlowClick, runningFlows } = useFlows(useFlowsOptions);

		onFlowClick('non-existent-flow-id');

		expect(confirmRunFlow.value).toBeNull();
		expect(runningFlows.value).toEqual([]);
	});

	test('sets confirmRunFlow when hasEdits is true', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { confirmRunFlow, onFlowClick, runningFlows } = useFlows(useFlowsOptions);

		onFlowClick(mockFlows[0]!.id);

		expect(confirmRunFlow.value).toBe(mockFlows[0]!.id);
		expect(runningFlows.value).toEqual([]);
	});

	test('sets confirmRunFlow when flow requires confirmation', () => {
		const testOptions = {
			...useFlowsOptions,
			hasEdits: ref(false),
		};

		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { confirmRunFlow, onFlowClick, runningFlows } = useFlows(testOptions);

		onFlowClick(mockFlows[0]!.id);

		expect(confirmRunFlow.value).toBe(mockFlows[0]!.id);
		expect(runningFlows.value).toEqual([]);
	});

	test('calls runManualFlow when no edits and no confirmation required', async () => {
		const testOptions = {
			...useFlowsOptions,
			hasEdits: ref(false),
		};

		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[3]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { confirmRunFlow, onFlowClick, runningFlows } = useFlows(testOptions);

		expect(runningFlows.value).toEqual([]);

		onFlowClick(mockFlows[3]!.id);

		expect(confirmRunFlow.value).toBeNull();

		expect(runningFlows.value).toContain(mockFlows[3]!.id);

		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[3]!.id}`, {
			collection: 'test_collection',
			keys: ['item_1'],
		});

		expect(runningFlows.value).toEqual([]);
	});
});

describe('confirmUnsavedChanges', () => {
	test('returns early when confirm button is disabled', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { confirmUnsavedChanges, confirmedUnsavedChanges, confirmRunFlow } = useFlows(useFlowsOptions);

		expect(confirmRunFlow.value).toBeNull();

		confirmUnsavedChanges('flow-1');

		expect(confirmedUnsavedChanges.value).toBe(false);
	});

	test('sets confirmedUnsavedChanges to true when confirm button is enabled', () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[3]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { confirmUnsavedChanges, confirmedUnsavedChanges, confirmRunFlow } = useFlows(useFlowsOptions);

		confirmRunFlow.value = mockFlows[3]!.id;

		confirmUnsavedChanges(mockFlows[3]!.id);

		expect(confirmedUnsavedChanges.value).toBe(true);
	});
});

describe('runManualFlow', () => {
	test('returns early when isActionDisabled is true', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { runManualFlow, runningFlows } = useFlows(useFlowsOptions);

		await runManualFlow('flow-1', true, mockOnRefresh);

		expect(runningFlows.value).toEqual([]);
	});

	test('returns early when selectedFlow is not found', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { runManualFlow, runningFlows } = useFlows(useFlowsOptions);

		await runManualFlow('non-existent-flow', false, mockOnRefresh);

		expect(runningFlows.value).toEqual([]);
	});

	test('returns early when flow is not in manualFlows (filtered out)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue([mockFlows[1]]),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const { runManualFlow, runningFlows } = useFlows(useFlowsOptions);

		await runManualFlow(mockFlows[1]!.id, false, mockOnRefresh);

		expect(runningFlows.value).toEqual([]);
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

		const { runManualFlow, runningFlows, confirmRunFlow, confirmValues } = useFlows(testOptions);

		confirmValues.value = { testField: 'testValue' };

		await runManualFlow(mockFlows[4]!.id, false, mockOnRefresh);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[4]!.id}`, {
			testField: 'testValue',
			collection: 'test_collection',
		});

		expect(confirmRunFlow.value).toBeNull();

		expect(runningFlows.value).toEqual([]);
	});

	test('successfully runs flow with keys (primaryKey or selection)', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow, runningFlows, confirmRunFlow, confirmValues } = useFlows(useFlowsOptions);

		confirmValues.value = { testField: 'testValue' };

		await runManualFlow(mockFlows[0]!.id, false, mockOnRefresh);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[0]!.id}`, {
			testField: 'testValue',
			collection: 'test_collection',
			keys: ['item_1'],
		});

		expect(confirmRunFlow.value).toBeNull();

		expect(runningFlows.value).toEqual([]);
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

		const { runManualFlow } = useFlows(testOptions);

		await runManualFlow(mockFlows[0]!.id, false, mockOnRefresh);

		expect(api.post).toHaveBeenCalledWith(`/flows/trigger/${mockFlows[0]!.id}`, {
			collection: 'test_collection',
			keys: [{ id: 'item1' }, { id: 'item2' }],
		});
	});

	test('calls onRefresh callback when provided', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow } = useFlows(useFlowsOptions);

		await runManualFlow(mockFlows[0]!.id, false, mockOnRefresh);

		expect(mockOnRefresh).toHaveBeenCalledOnce();
	});

	test('handles API errors gracefully', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		const mockError = new Error('API Error');
		vi.mocked(api.post).mockRejectedValue(mockError);

		const { runManualFlow, runningFlows } = useFlows(useFlowsOptions);

		await runManualFlow(mockFlows[0]!.id, false, mockOnRefresh);

		expect(runningFlows.value).toEqual([]);
	});

	test('manages runningFlows state correctly', async () => {
		const mockFlowsStore = {
			getManualFlowsForCollection: vi.fn().mockReturnValue(mockFlows),
		};

		vi.mocked(useFlowsStore).mockReturnValue(mockFlowsStore as any);

		vi.mocked(api.post).mockResolvedValue({});

		const { runManualFlow, runningFlows } = useFlows(useFlowsOptions);

		expect(runningFlows.value).toEqual([]);

		const runPromise = runManualFlow(mockFlows[0]!.id, false, mockOnRefresh);

		expect(runningFlows.value).toContain(mockFlows[0]!.id);

		await runPromise;

		expect(runningFlows.value).toEqual([]);
	});
});
