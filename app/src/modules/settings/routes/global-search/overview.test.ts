import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import Overview from './overview.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { useSettingsStore } from '@/stores/settings';

const settingsFields = ref([
	{ field: 'global_search_group', meta: null },
	{
		field: 'global_search_notice',
		meta: { group: 'global_search_group' },
	},
	{
		field: 'global_search_config',
		meta: {
			group: 'global_search_group',
			options: {
				fields: [
					{ field: 'collection', meta: {} },
					{ field: 'fields', meta: {} },
					{ field: 'limit', meta: { options: {} } },
				],
			},
		},
	},
	{
		field: 'project_name',
		meta: { group: 'project_group' },
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
	useSizeClass: () => ref(null),
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

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

function mountOverview() {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		stubActions: true,
		initialState: {
			settingsStore: {
				settings: {
					global_search_config: [
						{
							collection: 'articles',
							fields: ['title'],
						},
					],
				},
			},
		},
	});

	const global: GlobalMountOptions = {
		plugins: [i18n, pinia],
		stubs: {
			SettingsNavigation: true,
			VButton: true,
			VCardActions: true,
			VCardText: true,
			VCardTitle: true,
			VCard: true,
			VDialog: true,
			PrivateViewHeaderBarActionButton: true,
			PrivateView: {
				template: '<div><slot name="actions:primary" /><slot name="navigation" /><slot /></div>',
			},
			VForm: VFormStub,
		},
	};

	const wrapper = mount(Overview, { global });
	const settingsStore = useSettingsStore();

	return { wrapper, settingsStore };
}

describe('settings global search overview', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders global search config field with validation metadata', () => {
		const { wrapper } = mountOverview();
		const form = wrapper.findComponent(VFormStub);
		const fields = form.props('fields') as any[];
		const configField = fields[0];
		const nestedFields = configField.meta.options.fields;

		expect(fields.map((field) => field.field)).toEqual(['global_search_config']);
		expect(nestedFields.find((field: any) => field.field === 'collection').meta.required).toBe(true);
		expect(nestedFields.find((field: any) => field.field === 'fields').meta.required).toBe(true);

		expect(nestedFields.find((field: any) => field.field === 'limit').meta.options).toMatchObject({
			min: 1,
			max: 25,
			placeholder: '5',
		});
	});

	test('saves global search edits through the settings store', async () => {
		const { wrapper, settingsStore } = mountOverview();

		await wrapper.findComponent(VFormStub).vm.$emit('update:modelValue', {
			global_search_config: [
				{
					collection: 'articles',
					fields: ['title', 'summary'],
				},
			],
		});

		await wrapper.vm.$nextTick();
		await wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' }).trigger('click');

		expect(settingsStore.updateSettings).toHaveBeenCalledWith({
			global_search_config: [
				{
					collection: 'articles',
					fields: ['title', 'summary'],
				},
			],
		});
	});

	test('blocks saving config entries without search fields', async () => {
		const { notify } = await import('@/utils/notify');
		const { wrapper, settingsStore } = mountOverview();

		await wrapper.findComponent(VFormStub).vm.$emit('update:modelValue', {
			global_search_config: [
				{
					collection: 'articles',
					fields: [],
				},
			],
		});

		await wrapper.vm.$nextTick();
		await wrapper.findComponent({ name: 'PrivateViewHeaderBarActionButton' }).trigger('click');

		expect(settingsStore.updateSettings).not.toHaveBeenCalled();

		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
			}),
		);
	});
});
