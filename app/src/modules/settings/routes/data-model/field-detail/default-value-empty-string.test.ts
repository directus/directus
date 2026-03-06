import { mount } from '@vue/test-utils';
import { get, merge, set } from 'lodash';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive } from 'vue';
import FieldDetailAdvancedSchema from './field-detail-advanced/field-detail-advanced-schema.vue';
import FieldConfiguration from './field-detail-simple/field-configuration.vue';
import { i18n } from '@/lang';

const mocks = vi.hoisted(() => ({
	store: null as any,
}));

vi.mock('pinia', async (importOriginal) => {
	const actual = await importOriginal<typeof import('pinia')>();
	const { toRefs } = await import('vue');

	return {
		...actual,
		storeToRefs: (store: object) => toRefs(store as Record<string, unknown>),
	};
});

vi.mock('./store', () => ({
	useFieldDetailStore: () => mocks.store,
	syncFieldDetailStoreProperty: (path: string, defaultValue?: any) =>
		computed({
			get: () => get(mocks.store, path, defaultValue),
			set: (value) => {
				mocks.store.update(set({}, path, value));
			},
		}),
}));

vi.mock('@/composables/use-extension', () => ({
	useExtension: () =>
		computed(() => ({
			id: 'input',
			autoKey: false,
			types: ['string'],
			options: null,
		})),
}));

vi.mock('@/extensions', () => ({
	useExtensions: () => ({
		interfaces: computed(() => [{ id: 'input', autoKey: false }]),
	}),
}));

function createMockStore(type: 'string' | 'text' = 'string') {
	const store = reactive({
		field: {
			field: 'title',
			type,
			schema: {
				default_value: 'seed',
				is_nullable: false,
				is_primary_key: false,
				is_generated: false,
			},
			meta: {
				interface: 'input',
				special: [],
			},
		},
		fieldUpdates: {},
		relations: {
			m2o: undefined,
			o2m: undefined,
		},
		localType: 'standard',
		readyToSave: true,
		saving: false,
		editing: '+',
		update(updates: Record<string, any>) {
			merge(store, updates);
		},
	});

	return store;
}

function mountSimpleFieldConfiguration(type: 'string' | 'text' = 'string') {
	mocks.store = createMockStore(type);

	return mount(FieldConfiguration, {
		global: {
			plugins: [i18n],
			directives: {
				focus: vi.fn(),
				tooltip: vi.fn(),
			},
			stubs: {
				ExtensionOptions: true,
				RelationshipConfiguration: true,
				VButton: true,
				VCheckbox: true,
				VDivider: true,
				VIcon: true,
				VSelect: true,
			},
		},
	});
}

function mountAdvancedSchema(type: 'string' | 'text' = 'string') {
	mocks.store = createMockStore(type);

	return mount(FieldDetailAdvancedSchema, {
		global: {
			plugins: [i18n],
			directives: {
				focus: vi.fn(),
				tooltip: vi.fn(),
			},
			stubs: {
				InterfaceInputCode: true,
				VCheckbox: true,
				VIcon: true,
				VSelect: true,
			},
		},
	});
}

describe('Field default value editors', () => {
	beforeEach(() => {
		mocks.store = createMockStore();
	});

	it('preserve empty string defaults for string-like fields', async () => {
		let wrapper = mountSimpleFieldConfiguration('string');

		await wrapper.get('input[placeholder="NULL"]').setValue('');

		expect(mocks.store.field.schema.default_value).toBe('');

		wrapper.unmount();

		wrapper = mountAdvancedSchema('string');

		await wrapper.get('input[placeholder="NULL"]').setValue('');

		expect(mocks.store.field.schema.default_value).toBe('');

		wrapper.unmount();

		wrapper = mountSimpleFieldConfiguration('text');

		await wrapper.get('input[placeholder="NULL"]').setValue('');

		expect(mocks.store.field.schema.default_value).toBe('');

		wrapper.unmount();

		wrapper = mountAdvancedSchema('text');

		await wrapper.get('textarea[placeholder="NULL"]').setValue('');

		expect(mocks.store.field.schema.default_value).toBe('');
	});
});
