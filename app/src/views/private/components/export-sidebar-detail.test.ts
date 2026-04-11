import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import ExportSidebarDetail from './export-sidebar-detail.vue';

const collectionState = vi.hoisted(() => ({
	fields: [] as Array<{ field: string; type: string }>,
}));

vi.mock('@directus/composables', async () => {
	const { ref } = await import('vue');

	return {
		useCollection: () => ({
			primaryKeyField: ref({ field: 'id' }),
			fields: ref(collectionState.fields),
			info: ref({ name: 'Files' }),
		}),
	};
});

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: () => ({
		createAllowed: false,
	}),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({
		info: {
			queryLimit: {
				max: 5000,
			},
		},
	}),
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		getUri: vi.fn(() => ''),
	},
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

const InterfaceSystemFieldsStub = defineComponent({
	name: 'InterfaceSystemFields',
	props: {
		value: {
			type: Array,
			required: false,
			default: () => [],
		},
		fieldFilter: {
			type: Function,
			required: false,
			default: undefined,
		},
	},
	template: '<div class="interface-system-fields-stub" />',
});

function mountComponent(props: Record<string, unknown> = {}) {
	return shallowMount(ExportSidebarDetail, {
		props: {
			collection: 'directus_files',
			...props,
		},
		global: {
			plugins: [i18n],
			directives: {
				tooltip: () => undefined,
			},
			stubs: {
				SidebarDetail: {
					template: '<div><slot /></div>',
				},
				VDrawer: {
					template: '<div><slot /><slot name="actions" /></div>',
				},
				VInput: {
					template: '<div />',
				},
				InterfaceSystemFields: InterfaceSystemFieldsStub,
			},
		},
	});
}

describe('export-sidebar-detail default export fields', () => {
	beforeEach(() => {
		collectionState.fields = [
			{ field: 'id', type: 'uuid' },
			{ field: '$thumbnail', type: 'string' },
			{ field: 'description', type: 'alias' },
			{ field: 'title', type: 'string' },
		];
	});

	test('excludes synthetic and alias fields by default', async () => {
		const wrapper = mountComponent();

		await wrapper.vm.$nextTick();

		const selectedFields = wrapper.findComponent(InterfaceSystemFieldsStub).props('value');

		expect(selectedFields).toEqual(['id', 'title']);
	});

	test('excludes synthetic fields from layout query defaults', async () => {
		const wrapper = mountComponent({
			layoutQuery: {
				fields: ['id', '$thumbnail'],
			},
		});

		await wrapper.vm.$nextTick();

		const selectedFields = wrapper.findComponent(InterfaceSystemFieldsStub).props('value');

		expect(selectedFields).toEqual(['id']);
	});

	test('passes picker filter that excludes synthetic fields', async () => {
		const wrapper = mountComponent();

		await wrapper.vm.$nextTick();

		const fieldFilter = wrapper.findComponent(InterfaceSystemFieldsStub).props('fieldFilter') as
			| ((field: { field: string }) => boolean)
			| undefined;

		expect(typeof fieldFilter).toBe('function');
		expect(fieldFilter?.({ field: '$thumbnail' })).toBe(false);
		expect(fieldFilter?.({ field: 'thumbnail' })).toBe(true);
		expect(fieldFilter?.({ field: 'id' })).toBe(true);
	});
});
