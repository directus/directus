import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import ComparisonModal from './comparison-modal.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import type { Revision } from '@/types/revisions';

vi.mock('./use-comparison', () => ({
	useComparison: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

const { useComparison } = await import('./use-comparison');

const mockUseComparison = (overrides = {}) => {
	const defaultReturn = {
		comparisonData: ref({
			base: {},
			incoming: {},
			fields: new Set(['field1']),
			comparisonType: 'revision' as const,
		}),
		selectedComparisonFields: ref([]),
		userUpdated: ref(null),
		baseUserUpdated: ref(null),
		mainHash: computed(() => ''),
		allFieldsSelected: computed(() => false),
		someFieldsSelected: computed(() => false),
		availableFieldsCount: computed(() => 1),
		comparisonFields: computed(() => new Set(['field1'])),
		userLoading: ref(false),
		baseUserLoading: ref(false),
		baseDisplayName: computed(() => 'Base'),
		deltaDisplayName: computed(() => 'Incoming'),
		normalizedData: computed(() => null),
		toggleSelectAll: vi.fn(),
		toggleComparisonField: vi.fn(),
		fetchComparisonData: vi.fn().mockResolvedValue(undefined),
		fetchUserUpdated: vi.fn().mockResolvedValue(undefined),
		fetchBaseItemUserUpdated: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};

	vi.mocked(useComparison).mockReturnValue(defaultReturn);
	return defaultReturn;
};

const defaultProps = {
	deleteVersionsAllowed: false,
	collection: 'test_collection',
	primaryKey: '1',
	mode: 'revision' as const,
	currentVersion: null,
	revisions: [
		{
			id: 1,
			data: {},
			delta: {},
			collection: 'test_collection',
			item: '1',
			activity: {
				action: 'update',
				ip: '127.0.0.1',
				user_agent: 'test',
				origin: 'test',
				timestamp: '2024-01-01T00:00:00Z',
				user: '1',
			},
			timestampFormatted: '2024-01-01',
			timeRelative: '1 day ago',
			status: 'resolve' as const,
		},
		{
			id: 2,
			data: {},
			delta: {},
			collection: 'test_collection',
			item: '1',
			activity: {
				action: 'update',
				ip: '127.0.0.1',
				user_agent: 'test',
				origin: 'test',
				timestamp: '2024-01-02T00:00:00Z',
				user: '1',
			},
			timestampFormatted: '2024-01-02',
			timeRelative: '2 days ago',
			status: 'resolve' as const,
		},
	] as Revision[],
};

const global: GlobalMountOptions = {
	stubs: {
		'v-dialog': {
			template: '<div class="v-dialog"><slot /></div>',
		},
		'v-form': {
			name: 'VForm',
			props: ['comparison', 'collection', 'primaryKey', 'initialValues', 'nonEditable'],
			template: '<div class="v-form"></div>',
		},
		'comparison-header': {
			template: '<div class="comparison-header"></div>',
		},
		'comparison-toggle': {
			name: 'ComparisonToggle',
			template: '<div class="comparison-toggle">{{ modelValue }}</div>',
			props: ['modelValue', 'disablePrevious'],
			emits: ['update:modelValue'],
		},
		'v-button': {
			template:
				'<button class="v-button" :disabled="disabled !== undefined && disabled !== false" v-bind="$attrs"><slot /></button>',
			props: ['disabled', 'loading'],
		},
		'v-checkbox': {
			template: '<div class="v-checkbox"><slot /></div>',
			props: ['modelValue', 'indeterminate'],
		},
		'v-icon': {
			template: '<span class="v-icon"></span>',
		},
		'v-skeleton-loader': {
			template: '<div class="v-skeleton-loader"></div>',
		},
	},
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
	directives: {
		tooltip: Tooltip,
	},
};

describe('comparison-modal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Revision mode - Compare to Previous', () => {
		it('should default to Previous mode on mount', async () => {
			mockUseComparison();

			const wrapper = mount(ComparisonModal, {
				props: {
					...defaultProps,
					modelValue: true,
				},
				global,
			});

			const toggle = wrapper.findComponent({ name: 'ComparisonToggle' });
			expect(toggle.exists()).toBe(true);
			expect(toggle.props('modelValue')).toBe('Previous');
		});

		it('should hide "Select all Differences" checkbox when Previous is selected', async () => {
			mockUseComparison();

			const wrapper = mount(ComparisonModal, {
				props: {
					...defaultProps,
					modelValue: true,
				},
				global,
			});

			const selectAllContainer = wrapper.find('.select-all-container');
			expect(selectAllContainer.exists()).toBe(false);
		});

		it('should disable Apply button when Previous is selected', async () => {
			mockUseComparison();

			const wrapper = mount(ComparisonModal, {
				props: {
					...defaultProps,
					modelValue: true,
				},
				global,
			});

			const applyButton = wrapper.find('[data-test="comparison-modal_apply-button"]');
			expect(applyButton.exists()).toBe(true);
			expect(applyButton.attributes('disabled')).toBeDefined();
		});
	});

	describe('Revision mode - Compare to Latest', () => {
		it('should show "Select all Differences" checkbox when Latest is selected', async () => {
			mockUseComparison();

			const wrapper = mount(ComparisonModal, {
				props: {
					...defaultProps,
					modelValue: true,
				},
				global,
			});

			const toggle = wrapper.findComponent({ name: 'ComparisonToggle' });
			await toggle.vm.$emit('update:modelValue', 'Latest');

			const selectAllContainer = wrapper.find('.select-all-container');
			expect(selectAllContainer.exists()).toBe(true);
		});

		it('should enable Apply button when Latest is selected and fields are selected', async () => {
			mockUseComparison({
				selectedComparisonFields: ref(['field1']),
			});

			const wrapper = mount(ComparisonModal, {
				props: {
					...defaultProps,
					modelValue: true,
				},
				global,
			});

			const toggle = wrapper.findComponent({ name: 'ComparisonToggle' });
			await toggle.vm.$emit('update:modelValue', 'Latest');

			const applyButton = wrapper.find('[data-test="comparison-modal_apply-button"]');
			expect(applyButton.exists()).toBe(true);
			// When in Latest mode with fields selected, button should NOT be disabled
			expect(applyButton.attributes('disabled')).toBeUndefined();
		});
	});
});
