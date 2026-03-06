import type { Field, Relation } from '@directus/types';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, unref } from 'vue';
import { createI18n } from 'vue-i18n';
import RelatedValues from './related-values.vue';
import relatedValuesDisplay from './index';

vi.mock('@directus/utils', () => ({
	getFieldsFromTemplate: (template: string) =>
		Array.from(template.matchAll(/{{\s*([^}]+?)\s*}}/g)).map(([, field]) => field.trim()),
}));

vi.mock('@/composables/use-extension', () => ({
	useExtension: () => computed(() => null),
}));

vi.mock('@/views/private/components/render-template.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			props: {
				collection: {
					type: String,
					default: '',
				},
				template: {
					type: String,
					required: true,
				},
				item: {
					type: Object,
					default: () => ({}),
				},
			},
			setup(props) {
				return () => {
					const displayValue = Object.values(props.item).find((value) => typeof value === 'string') ?? '';
					return h('span', `${props.collection}|${props.template}|${displayValue}`);
				};
			},
		}),
	};
});

vi.mock('@/components/v-icon/v-icon.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup() {
				return () => h('span');
			},
		}),
	};
});

vi.mock('@/components/v-list-item-content.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup(_, { slots }) {
				return () => h('div', slots.default?.());
			},
		}),
	};
});

vi.mock('@/components/v-list-item-icon.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup(_, { slots }) {
				return () => h('div', slots.default?.());
			},
		}),
	};
});

vi.mock('@/components/v-list-item.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup(_, { slots }) {
				return () => h('div', slots.default?.());
			},
		}),
	};
});

vi.mock('@/components/v-list.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup(_, { slots }) {
				return () => h('div', slots.default?.());
			},
		}),
	};
});

vi.mock('@/components/v-menu.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup(_, { slots }) {
				return () =>
					h('div', [
						slots.activator?.({ toggle: () => undefined }),
						slots.default?.(),
					]);
			},
		}),
	};
});

vi.mock('@/views/private/components/value-null.vue', async () => {
	const { defineComponent, h } = await import('vue');

	return {
		default: defineComponent({
			setup() {
				return () => h('span', 'null');
			},
		}),
	};
});

const collections = {
	collection_one: {
		collection: 'collection_one',
		name: 'Collection One',
		meta: { display_template: '{{ name }}' },
	},
	collection_two: {
		collection: 'collection_two',
		name: 'Collection Two',
		meta: { display_template: '{{ title }}' },
	},
	collection_three_blocks: {
		collection: 'collection_three_blocks',
		name: 'Collection Three Blocks',
		meta: null,
	},
};

const fieldsByCollection: Record<string, Record<string, Field>> = {
	collection_three: {
		blocks: {
			collection: 'collection_three',
			field: 'blocks',
			type: 'alias',
			name: 'Blocks',
			schema: null,
			meta: {
				id: 1,
				collection: 'collection_three',
				field: 'blocks',
				special: ['m2a'],
				interface: 'list-m2a',
			},
		} as Field,
	},
	collection_three_blocks: {
		id: { collection: 'collection_three_blocks', field: 'id', type: 'integer', name: 'ID', schema: null, meta: null } as Field,
		collection: {
			collection: 'collection_three_blocks',
			field: 'collection',
			type: 'string',
			name: 'Collection',
			schema: null,
			meta: null,
		} as Field,
		item: { collection: 'collection_three_blocks', field: 'item', type: 'json', name: 'Item', schema: null, meta: null } as Field,
	},
	collection_one: {
		id: { collection: 'collection_one', field: 'id', type: 'integer', name: 'ID', schema: null, meta: null } as Field,
		name: { collection: 'collection_one', field: 'name', type: 'string', name: 'Name', schema: null, meta: null } as Field,
	},
	collection_two: {
		id: { collection: 'collection_two', field: 'id', type: 'integer', name: 'ID', schema: null, meta: null } as Field,
		title: {
			collection: 'collection_two',
			field: 'title',
			type: 'string',
			name: 'Title',
			schema: null,
			meta: null,
		} as Field,
	},
};

const relations: Relation[] = [
	{
		collection: 'collection_three_blocks',
		field: 'collection_three_id',
		related_collection: 'collection_three',
		schema: null,
		meta: {
			id: 1,
			many_collection: 'collection_three_blocks',
			many_field: 'collection_three_id',
			one_collection: 'collection_three',
			one_field: 'blocks',
			one_collection_field: null,
			one_allowed_collections: null,
			junction_field: 'item',
			sort_field: null,
			one_deselect_action: 'nullify',
		},
	} as Relation,
	{
		collection: 'collection_three_blocks',
		field: 'item',
		related_collection: null,
		schema: null,
		meta: {
			id: 2,
			many_collection: 'collection_three_blocks',
			many_field: 'item',
			one_collection: null,
			one_field: null,
			one_collection_field: 'collection',
			one_allowed_collections: ['collection_one', 'collection_two'],
			junction_field: 'collection_three_id',
			sort_field: null,
			one_deselect_action: 'nullify',
		},
	} as Relation,
];

const getCollection = vi.fn((collection: string) => collections[collection as keyof typeof collections] ?? null);
const getField = vi.fn((collection: string, field: string) => fieldsByCollection[collection]?.[field] ?? null);
const getPrimaryKeyFieldForCollection = vi.fn((collection: string) => fieldsByCollection[collection]?.id ?? null);

const getRelationsForField = vi.fn((collection: string, field: string) => {
	if (collection === 'collection_three' && field === 'blocks') return relations;
	return [];
});

vi.mock('@directus/composables', () => ({
	useCollection: (collection: string) => ({
		primaryKeyField: computed(() => getPrimaryKeyFieldForCollection(unref(collection))),
	}),
}));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		getCollection,
	}),
}));

vi.mock('@/stores/fields', () => ({
	useFieldsStore: () => ({
		getField,
		getPrimaryKeyFieldForCollection,
	}),
}));

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationsForField,
	}),
}));

vi.mock('@/utils/get-local-type', () => ({
	getLocalTypeForField: () => 'm2a',
}));

vi.mock('@/utils/get-related-collection', () => ({
	getRelatedCollection: () => ({
		relatedCollection: 'collection_three_blocks',
	}),
}));

const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	missingWarn: false,
	messages: {
		'en-US': {
			item: 'item',
			items: 'items',
		},
	},
});

const RouterLinkStub = defineComponent({
	props: {
		to: {
			type: String,
			required: true,
		},
	},
	template: '<a :href="to"><slot /></a>',
});

describe('related-values m2a display', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders default M2A entries with each related collection display template and fetches the needed fields', () => {
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
					RouterLink: RouterLinkStub,
				},
			},
		});

		expect(wrapper.text()).toContain('Collection One:');
		expect(wrapper.text()).toContain('collection_one|{{ name }}|Ahmed');
		expect(wrapper.text()).toContain('Collection Two:');
		expect(wrapper.text()).toContain('collection_two|{{ title }}|Admin');

		expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
			'/content/collection_one/11',
			'/content/collection_two/22',
		]);

		expect(relatedValuesDisplay.fields(null, { collection: 'collection_three', field: 'blocks' })).toEqual(
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
