import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { computed, ref } from 'vue';
import TranslateModal from './translate-modal.vue';
import type { TranslationJob } from './use-translation-job';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const mockModels = ref([
	{
		name: 'Claude Sonnet 4.5',
		provider: 'anthropic',
		model: 'claude-sonnet-4-5',
	},
]);

vi.mock('@/ai/stores/use-ai', () => ({
	useAiStore: () => ({
		models: mockModels.value,
	}),
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
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
	{
		field: 'accent_color',
		name: 'Accent Color',
		type: 'string',
		meta: { hidden: false, readonly: false, interface: 'select-color' },
	},
] as any;

const getItemWithLang = (items: Record<string, any>[], lang: string | undefined) =>
	items.find((item) => item.languages_code?.code === lang);

function createMockTranslationJob(): TranslationJob {
	const jobState = ref<'idle' | 'translating' | 'complete'>('idle');
	const langStatuses = ref<Record<string, { status: string; error?: string }>>({});

	return {
		jobState,
		langStatuses,
		isTranslating: computed(() => jobState.value === 'translating'),
		hasErrors: computed(() => Object.values(langStatuses.value).some((entry) => entry.status === 'error')),
		completedCount: computed(
			() =>
				Object.values(langStatuses.value).filter((entry) => entry.status === 'done' || entry.status === 'error').length,
		),
		totalCount: computed(() => Object.keys(langStatuses.value).length),
		pendingLanguages: computed(
			() =>
				new Set(
					Object.entries(langStatuses.value)
						.filter(([, entry]) => ['pending', 'translating', 'retrying'].includes(entry.status))
						.map(([langCode]) => langCode),
				),
		),
		getActiveField: vi.fn(() => null),
		getQueuedFields: vi.fn(() => []),
		getCompletedFields: vi.fn(() => []),
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
	settings = {},
}: {
	permissions: Record<string, any>;
	displayItems: Record<string, any>[];
	translationJob?: TranslationJob;
	settings?: Record<string, any>;
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
					ai_translation_default_model: null,
					ai_translation_glossary: null,
					ai_translation_style_guide: null,
					...settings,
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
		directives: {
			tooltip: () => undefined,
		},
		stubs: {
			VDrawer: {
				props: ['modelValue'],
				template: '<div v-if="modelValue"><slot /><slot name="title" /></div>',
			},
			VDivider: { template: '<div />' },
			VNotice: { template: '<div><slot /></div>' },
			VIcon: true,
			VInput: {
				props: ['modelValue', 'placeholder'],
				emits: ['update:modelValue', 'click', 'keydown:enter', 'keydown:space'],
				template:
					'<label><slot name="prepend" /><input :value="modelValue ?? \'\'" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" @click="$emit(\'click\')" /><slot name="append" /></label>',
			},
			VList: { template: '<div><slot /></div>' },
			VListItem: { template: '<div><slot /></div>', props: ['active', 'clickable'] },
			VListItemContent: { template: '<div><slot /></div>' },
			VListItemIcon: { template: '<div><slot /></div>' },
			VMenu: {
				props: ['modelValue'],
				emits: ['update:modelValue'],
				template: '<div><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
			},
			VProgressLinear: { template: '<div class="progress-linear" />', props: ['value', 'indeterminate'] },
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
			VTextOverflow: {
				props: ['text'],
				template: '<span>{{ text }}</span>',
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

	mockModels.value = [
		{
			name: 'Claude Sonnet 4.5',
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
		},
	];
});

describe('translate-modal', () => {
	test('renders source language and model fields in the drawer when multiple models are available', async () => {
		mockModels.value = [
			{
				name: 'Claude Sonnet 4.5',
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
			{
				name: 'GPT-5',
				provider: 'openai',
				model: 'gpt-5',
			},
		];

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello', body: '# Hello', languages_code: { code: 'en' } }],
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		expect(wrapper.findAll('.field-group')).toHaveLength(2);
		expect(wrapper.text()).toContain('Source Language');
		expect(wrapper.text()).toContain('Model');
	});

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
	});

	test('uses the configured translation default model when translating', async () => {
		mockModels.value = [
			{
				name: 'Claude Sonnet 4.5',
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
			{
				name: 'GPT-5',
				provider: 'openai',
				model: 'gpt-5',
			},
		];

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
			settings: {
				ai_translation_default_model: 'openai:gpt-5',
			},
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		await getTranslateButton(wrapper)!.trigger('click');
		await flushPromises();

		const config = (mockJob.start as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

		expect(config).toMatchObject({
			model: {
				provider: 'openai',
				model: 'gpt-5',
			},
		});
	});

	test('falls back to the first available model when the configured translation default is unavailable', async () => {
		mockModels.value = [
			{
				name: 'Claude Sonnet 4.5',
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
			{
				name: 'GPT-5',
				provider: 'openai',
				model: 'gpt-5',
			},
		];

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
			settings: {
				ai_translation_default_model: 'google:gemini-2.5-pro',
			},
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		await getTranslateButton(wrapper)!.trigger('click');
		await flushPromises();

		const config = (mockJob.start as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

		expect(config).toMatchObject({
			model: {
				provider: 'anthropic',
				model: 'claude-sonnet-4-5',
			},
		});
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

	test('reopens completed failed jobs in the status view so they can be retried', async () => {
		const mockJob = createMockTranslationJob() as any;
		mockJob.jobState.value = 'complete';

		mockJob.langStatuses.value = {
			fr: {
				status: 'error',
				error: 'Provider timeout',
			},
		};

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello', body: '# Hello', languages_code: { code: 'en' } }],
			translationJob: mockJob,
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		expect(wrapper.text()).toContain('French');
		expect(wrapper.text()).toContain('Provider timeout');
		expect(wrapper.text()).toContain('Retry');
		expect(wrapper.text()).not.toContain('Source Language');
	});

	test('renders active status using field and language rows instead of chips', async () => {
		const mockJob = createMockTranslationJob() as any;

		mockJob.start.mockImplementation(() => {
			mockJob.jobState.value = 'translating';

			mockJob.langStatuses.value = {
				fr: {
					status: 'translating',
				},
			};
		});

		mockJob.getActiveField.mockImplementation((langCode: string) => (langCode === 'fr' ? 'slug' : null));
		mockJob.getQueuedFields.mockImplementation((langCode: string) => (langCode === 'fr' ? ['body'] : []));
		mockJob.getCompletedFields.mockImplementation((langCode: string) => (langCode === 'fr' ? ['title'] : []));

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello', body: '# Hello', languages_code: { code: 'en' } }],
			translationJob: mockJob,
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		await getTranslateButton(wrapper)!.trigger('click');
		await flushPromises();

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		expect(wrapper.findAll('.status-field-row')).toHaveLength(3);
		expect(wrapper.findAll('.status-language-row')).toHaveLength(1);
		expect(wrapper.find('.translation-status-active').text()).toContain('Slug');
		expect(wrapper.find('.translation-status-queued').text()).toContain('Body');
		expect(wrapper.find('.translation-status-done').text()).toContain('Title');
		expect(wrapper.findAll('.status-dot.active')).toHaveLength(1);
		expect(wrapper.text()).toContain('French');
		expect(wrapper.findAll('.progress-linear')).toHaveLength(1);
	});

	test('resets completed successful jobs back to the config view', async () => {
		const mockJob = createMockTranslationJob() as any;

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello', body: '# Hello', languages_code: { code: 'en' } }],
			translationJob: mockJob,
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		mockJob.langStatuses.value = {
			fr: {
				status: 'done',
			},
		};

		mockJob.jobState.value = 'complete';
		await wrapper.vm.$nextTick();
		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		expect(mockJob.reset).toHaveBeenCalled();
		expect(wrapper.text()).toContain('Source Language');
		expect(wrapper.text()).not.toContain('Retry');
	});
});
