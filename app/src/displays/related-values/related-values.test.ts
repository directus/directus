import type { Field } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { computed, defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import RelatedValues from './related-values.vue';
import relatedValuesDisplay from './index';

const collections = [
	{ collection: 'collection_one', name: 'Collection One', meta: { display_template: '{{ name }}' } },
	{ collection: 'collection_two', name: 'Collection Two', meta: { display_template: '{{ title }}' } },
];

const relationInfo = {
	allowedCollections: collections,
	relationPrimaryKeyFields: {
		collection_one: { field: 'id' },
		collection_two: { field: 'id' },
	},
	collectionField: { field: 'collection' },
	junctionField: { field: 'item' },
};

vi.mock('@directus/constants', () => ({ RELATIONAL_TYPES: [] }));
vi.mock('@directus/extensions', () => ({ defineDisplay: (config: unknown) => config }));

vi.mock('@directus/utils', () => ({
	getFieldsFromTemplate: (template: string) =>
		Array.from(template.matchAll(/{{\s*([^}]+?)\s*}}/g), ([, field]) => field!.trim()),
}));

vi.mock('@directus/composables', () => ({
	useCollection: () => ({ primaryKeyField: computed(() => ({ field: 'id' })) }),
}));

vi.mock('@/composables/use-extension', () => ({ useExtension: () => computed(() => null) }));

vi.mock('@/composables/use-relation-m2a', () => ({
	useRelationM2A: () => ({ relationInfo: computed(() => relationInfo) }),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getField: (collection: string, field: string) =>
			collection === 'collection_three' && field === 'blocks' ? ({ meta: { special: ['m2a'] } } as Field) : null,
		getPrimaryKeyFieldForCollection: () => ({ field: 'id' }),
	}),
}));

vi.mock('@/utils/get-local-type', () => ({ getLocalTypeForField: () => 'm2a' }));

vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: () => ({ relatedCollection: 'collection_three_blocks' }),
}));

vi.mock('@/views/private/components/render-template.vue', () => ({
	default: defineComponent({
		props: {
			collection: { type: String, default: '' },
			template: { type: String, required: true },
			item: { type: Object, default: () => ({}) },
		},
		setup(props) {
			return () => h('span', `${props.collection}|${props.template}|${Object.values(props.item ?? {}).join('')}`);
		},
	}),
}));

const SlotStub = defineComponent({
	setup(_, { slots }) {
		return () => h('div', slots.default?.());
	},
});

const MenuStub = defineComponent({
	setup(_, { slots }) {
		return () => h('div', slots.default?.());
	},
});

const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	messages: { 'en-US': { item: 'item', items: 'items' } },
});

describe('related-values M2A display', () => {
	test('uses each related collection template and requests its fields', () => {
		const getFields = relatedValuesDisplay.fields as (
			value: unknown,
			options: { collection: string; field: string },
		) => string[];

		const wrapper = mount(RelatedValues, {
			props: {
				collection: 'collection_three',
				field: 'blocks',
				value: [
					{ id: 1, collection: 'collection_one', item: { id: 11, name: 'Ahmed' } },
					{ id: 2, collection: 'collection_two', item: { id: 22, title: 'Admin' } },
				],
			},
			global: {
				plugins: [i18n],
				stubs: {
					VMenu: MenuStub,
					VList: SlotStub,
					VListItem: SlotStub,
					VListItemContent: SlotStub,
					VListItemIcon: SlotStub,
					VIcon: true,
					RouterLink: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Collection One:');
		expect(wrapper.text()).toContain('collection_one|{{ name }}|11Ahmed');
		expect(wrapper.text()).toContain('Collection Two:');
		expect(wrapper.text()).toContain('collection_two|{{ title }}|22Admin');

		expect(getFields(null, { collection: 'collection_three', field: 'blocks' })).toEqual(
			expect.arrayContaining([
				'id',
				'collection',
				'item:collection_one.id',
				'item:collection_one.name',
				'item:collection_two.id',
				'item:collection_two.title',
			]),
		);
	});
});
