import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import Overview from './overview.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const settingsFields = ref([
	{ field: 'ai_group', meta: null },
	{
		field: 'ai_openai_api_key',
		meta: { group: 'ai_group', options: {} },
	},
	{
		field: 'ai_openai_allowed_models',
		meta: { group: 'ai_group', options: {} },
	},
	{
		field: 'ai_anthropic_api_key',
		meta: { group: 'ai_group', options: {} },
	},
	{
		field: 'ai_anthropic_allowed_models',
		meta: { group: 'ai_group', options: {} },
	},
	{
		field: 'ai_translation_default_model',
		meta: { group: 'ai_group', options: { choices: [] } },
	},
	{
		field: 'mcp_group',
		meta: null,
	},
]) as any;

const VFormStub = defineComponent({
	name: 'VForm',
	props: {
		modelValue: {
			type: Object,
			default: null,
		},
		fields: {
			type: Array,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	template: '<div class="v-form-stub" />',
});

vi.mock('@directus/composables', () => ({
	useCollection: () => ({
		fields: settingsFields,
	}),
	useShortcut: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-router')>();

	return {
		...actual,
		useRouter: () => ({
			push: vi.fn(),
		}),
	};
});

vi.mock('@/composables/use-edits-guard', () => ({
	useEditsGuard: () => ({
		confirmLeave: ref(false),
		leaveTo: ref(null),
	}),
}));

vi.mock('@/composables/use-shortcut', () => ({
	useShortcut: vi.fn(),
}));

function mountOverview() {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		stubActions: false,
		initialState: {
			settingsStore: {
				settings: {
					ai_openai_api_key: null,
					ai_openai_allowed_models: null,
					ai_anthropic_api_key: 'anthropic-key',
					ai_anthropic_allowed_models: ['claude-sonnet-4-5'],
					ai_google_api_key: null,
					ai_google_allowed_models: null,
					ai_openai_compatible_api_key: null,
					ai_openai_compatible_base_url: null,
					ai_openai_compatible_models: null,
					ai_translation_default_model: 'anthropic:claude-sonnet-4-5',
				},
			},
			serverStore: {
				info: {
					ai_enabled: true,
					mcp_enabled: true,
				},
			},
		},
	});

	const global: GlobalMountOptions = {
		plugins: [i18n, pinia],
		stubs: {
			SettingsNavigation: true,
			VBreadcrumb: true,
			VButton: true,
			VCardActions: true,
			VCardText: true,
			VCardTitle: true,
			VCard: true,
			VDialog: true,
			VNotice: true,
			PrivateViewHeaderBarActionButton: true,
			PrivateView: {
				template: '<div><slot name="headline" /><slot name="actions" /><slot name="navigation" /><slot /></div>',
			},
			VForm: VFormStub,
		},
	};

	return mount(Overview, { global });
}

function getTranslationDefaultField(wrapper: ReturnType<typeof mount>) {
	const aiForm = wrapper.findAllComponents(VFormStub)[0]!;
	const fields = aiForm.props('fields') as any[];
	return fields.find((field) => field.field === 'ai_translation_default_model');
}

describe('settings ai overview', () => {
	test('computes translation default model choices from saved and unsaved settings', async () => {
		const wrapper = mountOverview();

		expect(getTranslationDefaultField(wrapper)?.meta?.options?.choices).toEqual([
			{
				text: 'Claude Sonnet 4.5',
				value: 'anthropic:claude-sonnet-4-5',
				icon: 'logo_anthropic',
			},
		]);

		await wrapper.findAllComponents(VFormStub)[0]!.vm.$emit('update:modelValue', {
			ai_openai_api_key: 'openai-key',
			ai_openai_allowed_models: ['gpt-5'],
		});

		await wrapper.vm.$nextTick();

		expect(getTranslationDefaultField(wrapper)?.meta?.options?.choices).toEqual([
			{
				text: 'GPT-5',
				value: 'openai:gpt-5',
				icon: 'logo_openai',
			},
			{
				text: 'Claude Sonnet 4.5',
				value: 'anthropic:claude-sonnet-4-5',
				icon: 'logo_anthropic',
			},
		]);
	});
});
