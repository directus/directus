import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import TranslateModal from './translate-modal.vue';
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

function getTranslateButton(wrapper: ReturnType<typeof mount>) {
	return wrapper.findAll('button').find((button) => button.text().includes('Translate'));
}

function mountModal({
	permissions,
	displayItems,
	applyTranslatedFields = vi.fn(),
}: {
	permissions: Record<string, any>;
	displayItems: Record<string, any>[];
	applyTranslatedFields?: ReturnType<typeof vi.fn>;
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
			applyTranslatedFields,
			defaultSourceLanguage: 'en',
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

	test('submits allowed targets with metadata-driven rules and normalizes slug-safe fields', async () => {
		const applyTranslatedFields = vi.fn();

		// Now returns flat fields per language (one call per language)
		vi.mocked(api.post).mockResolvedValue({
			data: {
				data: {
					title: 'Bonjour',
					slug: 'Conseils essentiels pour les acheteurs de maison',
					body: '# Bonjour\n\nTexte',
				},
			},
		} as any);

		const wrapper = mountModal({
			permissions: {
				article_translations: {
					create: { access: 'full' },
					update: { access: 'full' },
				},
			},
			displayItems: [{ title: 'Hello', slug: 'hello-world', body: '# Hello\n\nText', languages_code: { code: 'en' } }],
			applyTranslatedFields,
		});

		await wrapper.setProps({ modelValue: true });
		await flushPromises();

		await getTranslateButton(wrapper)!.trigger('click');
		await flushPromises();

		const requestBody = vi.mocked(api.post).mock.calls[0]?.[1] as any;

		expect(requestBody).toMatchObject({
			provider: 'anthropic',
			model: 'claude-sonnet-4-5',
		});

		expect(requestBody.prompt).toContain('"slug": Generate a localized URL slug');
		expect(requestBody.prompt).toContain('"body": Preserve markdown syntax and structure exactly.');
		expect(requestBody.outputSchema.properties.slug.description).toContain('Localized URL slug');

		expect(applyTranslatedFields).toHaveBeenCalledWith(
			{
				title: 'Bonjour',
				slug: 'conseils-essentiels-pour-les-acheteurs-de-maison',
				body: '# Bonjour\n\nTexte',
			},
			'fr',
		);
	});
});
