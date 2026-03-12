import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';
import TranslateModal from './translate-modal.vue';
import type { TranslationJob } from './use-translation-job';
import type { GlobalMountOptions } from '@/__utils__/types';
import api from '@/api';
import { i18n } from '@/lang';

vi.mock('@/ai/stores/use-ai', () => ({
	useAiStore: () => ({
		models: [
			{
				name: 'Claude Sonnet 4.5',
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
		],
	}),
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

const relationInfo = {
	junctionCollection: { collection: 'article_translations' },
	junctionField: { field: 'languages_code' },
	reverseJunctionField: { field: 'articles_id' },
	junctionPrimaryKeyField: { field: 'id' },
	relatedPrimaryKeyField: { field: 'code' },
} as any;

const languageOptions = [
	{ text: 'English', value: 'en' },
	{ text: 'French', value: 'fr' },
];

const fields = [
	{ field: 'title', name: 'Title', type: 'string', meta: { hidden: false, readonly: false, interface: 'input' } },
	{
		field: 'slug',
		name: 'Slug',
		type: 'string',
		meta: { hidden: false, readonly: false, interface: 'input', options: { slug: true } },
	},
	{
		field: 'body',
		name: 'Body',
		type: 'text',
		meta: { hidden: false, readonly: false, interface: 'input-rich-text-md' },
	},
	{ field: 'status', name: 'Status', type: 'string', meta: { hidden: true, readonly: false } },
] as any;

const getItemWithLang = (items: Record<string, any>[], lang: string | undefined) =>
	items.find((item) => item.languages_code?.code === lang);

function createMockTranslationJob(): TranslationJob {
	return {
		jobState: ref('idle'),
		langStatuses: ref({}),
		isTranslating: computed(() => false),
		hasErrors: computed(() => false),
		completedCount: computed(() => 0),
		translatedCount: computed(() => 0),
		totalCount: computed(() => 0),
		progressPercent: computed(() => 0),
		progressLabel: computed(() => '0/0'),
		pendingLanguages: computed(() => new Set<string>()),
		pendingFields: computed(() => new Set<string>()),
		start: vi.fn(),
		cancel: vi.fn(),
		retry: vi.fn(),
		reset: vi.fn(),
	} as unknown as TranslationJob;
}

function getTranslateButton(wrapper: ReturnType<typeof mount>) {
	return wrapper.findAll('button').find((button) => button.text().includes('Translate'));
}

function mountModal({
	permissions,
	displayItems,
	translationJob = createMockTranslationJob(),
}: {
	permissions: Record<string, any>;
	displayItems: Record<string, any>[];
	translationJob?: TranslationJob;
}) {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		stubActions: false,
		initialState: {
			permissionsStore: {
				permissions,
			},
			settingsStore: {
				settings: {
					ai_translation_glossary: null,
					ai_translation_style_guide: null,
				},
			},
			userStore: {
				currentUser: {
					id: 'user-1',
					admin_access: false,
					language: 'en-US',
				},
			},
			serverStore: {
				info: {
					project: {
						default_language: 'en-US',
					},
				},
			},
		},
	});

	const global: GlobalMountOptions = {
		plugins: [i18n, pinia],
		stubs: {
			VDrawer: {
				props: ['modelValue'],
				template: '<div v-if="modelValue"><slot /><slot name="title" /></div>',
			},
			VNotice: { template: '<div><slot /></div>' },
			VIcon: true,
			VProgressLinear: { template: '<div />', props: ['value'] },
			VButton: {
				props: ['disabled'],
				emits: ['click'],
				template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
			},
			VCheckbox: {
				props: ['modelValue', 'label', 'disabled'],
				emits: ['update:modelValue'],
				template:
					'<label><input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.checked)" />{{ label }}</label>',
			},
			VSelect: {
				props: ['modelValue', 'items'],
				emits: ['update:modelValue'],
				template:
					'<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.text }}</option></select>',
			},
		},
	};

	return mount(TranslateModal, {
		props: {
			modelValue: false,
			languageOptions,
			displayItems,
			fields,
			relationInfo,
			getItemWithLang,
			defaultSourceLanguage: 'en',
			translationJob,
		},
		global,
	});
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

describe('translate-modal', () => {
	test('disables unauthorized targets before translation', async () => {
		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'none' },
					update: { access: 'none' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello', body: '# Hello', languages_code: { code: 'en' } }],
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		expect(wrapper.text()).toContain("You don't have permission to translate this language.");
		expect(getTranslateButton(wrapper)?.attributes('disabled')).toBeDefined();
		expect(vi.mocked(api.post)).not.toHaveBeenCalled();
	});

	test('calls translationJob.start with correct config when translating', async () => {
		const mockJob = createMockTranslationJob();

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello-world', body: '# Hello\n\nText', languages_code: { code: 'en' } }],
			translationJob: mockJob,
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		await getTranslateButton(wrapper)!.trigger('click');
		await flushPromises();

		expect(mockJob.start).toHaveBeenCalledOnce();

		const config = (mockJob.start as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

		expect(config).toMatchObject({
			sourceLanguage: 'en',
			model: {
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
		});

		expect(config.targetLanguages).toContain('fr');
		expect(config.sourceContent).toHaveProperty('title', 'Hello');
		expect(config.sourceContent).toHaveProperty('slug', 'hello-world');
		expect(config.sourceContent).toHaveProperty('body', '# Hello\n\nText');
	});
});
