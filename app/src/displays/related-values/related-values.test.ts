import { STORES_INJECT } from '@directus/constants';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import RelatedValues from './related-values.vue';
import { seedM2A } from './test-fixtures';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key, te: () => false }),
	createI18n: vi.fn(() => ({})),
}));

const RenderTemplateStub = defineComponent({
	props: {
		template: { type: String, required: true },
		item: { type: Object, required: true },
		collection: { type: String, required: true },
	},
	setup: (props) => () =>
		h('span', {
			class: 'render-template',
			'data-collection': props.collection,
			'data-template': props.template,
			'data-item': JSON.stringify(props.item),
		}),
});

const mountOptions = {
	global: {
		plugins: [
			createRouter({
				history: createMemoryHistory(),
				routes: [{ path: '/:path(.*)', component: { render: () => null } }],
			}),
		],
		provide: { [STORES_INJECT]: { useCollectionsStore, useFieldsStore, useRelationsStore } },
		stubs: {
			VMenu: { template: '<div><slot name="activator" :toggle="() => {}" /><slot /></div>' },
			RenderTemplate: RenderTemplateStub,
			VIcon: true,
		},
	},
};

const value = [
	{ id: 1, kind: 'headings', target: { id: 5, text: 'Hello' } },
	{ id: 2, kind: 'texts', target: { uid: 'abc' } },
];

beforeEach(() => {
	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
});

function renderedRows(wrapper: ReturnType<typeof mount>) {
	return wrapper.findAll('.v-list-item').map((row) => {
		const template = row.find('.render-template');

		return {
			text: row.text(),
			collection: template.attributes('data-collection'),
			template: template.attributes('data-template'),
			item: JSON.parse(template.attributes('data-item')!),
			link: row.find('a').attributes('href'),
		};
	});
}

describe('related-values display for an M2A field', () => {
	test('renders each related item with its own collection template when no template is set', () => {
		seedM2A();

		const wrapper = mount(RelatedValues, { props: { collection: 'pages', field: 'blocks', value }, ...mountOptions });

		expect(renderedRows(wrapper)).toEqual([
			{
				text: 'Headings:',
				collection: 'headings',
				template: '{{text}}',
				item: { id: 5, text: 'Hello' },
				link: '/content/headings/5',
			},
			{ text: 'Texts:', collection: 'texts', template: '{{uid}}', item: { uid: 'abc' }, link: '/content/texts/abc' },
		]);
	});

	test('renders the junction item with the display option template', () => {
		seedM2A();

		const wrapper = mount(RelatedValues, {
			props: { collection: 'pages', field: 'blocks', value, template: '{{target:headings.text}}' },
			...mountOptions,
		});

		expect(renderedRows(wrapper)[0]).toMatchObject({
			text: '',
			collection: 'pages_blocks',
			template: '{{target:headings.text}}',
			item: value[0],
			link: '/content/headings/5',
		});
	});
});
