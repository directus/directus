import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import Translations from './translations.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const aiState = {
	models: [] as Array<{ name: string; provider: string; model: string }>,
};

const relationInfo = {
	type: 'm2m',
	junctionCollection: { collection: 'article_translations' },
	junctionField: { field: 'languages_code' },
	reverseJunctionField: { field: 'articles_id' },
	junctionPrimaryKeyField: { field: 'id' },
	relatedPrimaryKeyField: { field: 'code' },
	relatedCollection: { collection: 'languages' },
} as any;

const fields = [
	{ field: 'title', type: 'string', meta: { hidden: false, readonly: false } },
	{ field: 'status', type: 'string', meta: { hidden: false, readonly: false } },
];

const displayItems = ref<Record<string, any>[]>([]);
const fetchedItems = ref<Record<string, any>[]>([]);
const updateSpy = vi.fn();
const createSpy = vi.fn();
const getItemEdits = vi.fn();

vi.mock('@/ai/stores/use-ai', () => ({
	useAiStore: () => aiState,
}));

vi.mock('@/composables/use-nested-validation', () => ({
	useInjectNestedValidation: () => ({
		updateNestedValidationErrors: vi.fn(),
	}),
}));

vi.mock('@/composables/use-relation-m2m', () => ({
	useRelationM2M: () => ({
		relationInfo: computed(() => relationInfo),
	}),
}));

vi.mock('@/composables/use-relation-multiple', () => ({
	useRelationMultiple: () => ({
		create: createSpy,
		update: updateSpy,
		remove: vi.fn(),
		isLocalItem: vi.fn(() => false),
		displayItems,
		loading: ref(false),
		fetchedItems,
		getItemEdits,
	}),
}));

vi.mock('@/composables/use-window-size', () => ({
	useWindowSize: () => ({
		width: ref(1280),
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getFieldsForCollection: () => fields,
		getField: (_collection: string, field: string) => ({ field }),
	}),
}));

vi.mock('@/utils/fetch-all', () => ({
	fetchAll: vi.fn().mockResolvedValue([
		{ code: 'en', direction: 'ltr' },
		{ code: 'fr', direction: 'ltr' },
	]),
}));

vi.mock('./translation-form.vue', () => ({
	default: defineComponent({
		name: 'TranslationFormStub',
		setup(_props, { slots }) {
			return () => h('div', { 'data-testid': 'translation-form' }, slots['split-view']?.({ active: false, toggle: vi.fn() }));
		},
	}),
}));

vi.mock('./translate-modal.vue', () => ({
	default: defineComponent({
		name: 'TranslateModalStub',
		props: {
			modelValue: Boolean,
			applyTranslatedFields: {
				type: Function,
				required: true,
			},
		},
		setup(props) {
			return () =>
				props.modelValue
					? h(
							'button',
							{
								'data-testid': 'apply-translation',
								onClick: () => props.applyTranslatedFields({ title: 'Bonjour' }, 'fr'),
							},
							'apply',
						)
					: null;
		},
	}),
}));

function mountTranslations() {
	const global: GlobalMountOptions = {
		plugins: [
			i18n,
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
				initialState: {
					serverStore: {
						info: {
							ai_enabled: true,
						},
					},
					settingsStore: {
						settings: {
							ai_anthropic_api_key: 'key',
						},
					},
				},
			}),
		],
		stubs: {
			VIcon: defineComponent({
				name: 'VIconStub',
				props: {
					name: {
						type: String,
						required: true,
					},
				},
				setup(props) {
					return () => h('button', { 'data-icon': props.name });
				},
			}),
		},
		directives: {
			tooltip: () => undefined,
		},
	};

	return mount(Translations, {
		props: {
			collection: 'articles',
			field: 'translations',
			primaryKey: 1,
			value: [],
			version: null,
		},
		global,
	});
}

beforeEach(() => {
	aiState.models = [];
	displayItems.value = [];
	fetchedItems.value = [];
	updateSpy.mockReset();
	createSpy.mockReset();
	getItemEdits.mockReset();
});

describe('translations', () => {
	test('hides the AI translate button when no models are available', async () => {
		const wrapper = mountTranslations();
		await wrapper.vm.$nextTick();

		expect(wrapper.find('[data-icon="auto_awesome"]').exists()).toBe(false);
	});

	test('applies AI translations using the existing edit draft', async () => {
		aiState.models = [{ name: 'Claude Sonnet 4.5', provider: 'anthropic', model: 'claude-sonnet-4-5' }];

		displayItems.value = [
			{
				id: 7,
				title: 'Hello',
				status: 'published',
				languages_code: { code: 'fr' },
				$type: 'updated',
				$index: 0,
				$edits: 0,
			},
		];

		fetchedItems.value = displayItems.value;

		getItemEdits.mockReturnValue({
			id: 7,
			$type: 'updated',
			$index: 0,
			slug: 'custom-slug',
		});

		const wrapper = mountTranslations();
		await wrapper.vm.$nextTick();

		await wrapper.find('[data-icon="auto_awesome"]').trigger('click');
		await wrapper.vm.$nextTick();
		await wrapper.find('[data-testid="apply-translation"]').trigger('click');

		expect(updateSpy).toHaveBeenCalledWith({
			id: 7,
			title: 'Bonjour',
			slug: 'custom-slug',
			languages_code: {
				code: 'fr',
			},
			$type: 'updated',
			$index: 0,
			$edits: 0,
		});

		expect(createSpy).not.toHaveBeenCalled();
	});
});
