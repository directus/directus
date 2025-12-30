import { useAliasFields } from './use-alias-fields';
import { mount } from '@vue/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';

vi.mock('@/utils/adjust-fields-for-displays', () => {
	return {
		adjustFieldsForDisplays: (fields: string[], _collection: string) => {
			if (fields.includes('image')) {
				return ['image.url.file', 'image.alt'];
			}

			return fields;
		},
	};
});

const TestComponent = defineComponent({
	props: ['fields', 'collection'], // eslint-disable-line  vue/require-prop-types
	setup(props) {
		return useAliasFields(props.fields, props.collection);
	},
	render: () => '',
});

describe('useAliasFields', () => {
	test('aliasing no collisions', () => {
		const fields = ['id', 'image.url'];

		const wrapper = mount(TestComponent, {
			props: {
				fields,
				collection: 'articles',
			},
		});

		expect(wrapper.vm.aliasedFields).toEqual({
			id: {
				aliased: false,
				fieldName: 'id',
				fields: ['id'],
				key: 'id',
			},
			'image.url': {
				aliased: false,
				fieldName: 'image',
				fields: ['image.url'],
				key: 'image.url',
			},
		});

		expect(wrapper.vm.aliasQuery).toEqual({});

		expect(wrapper.vm.aliasedKeys).toEqual([]);

		expect(
			wrapper.vm.getFromAliasedItem(
				{
					id: 1,
					image: {
						url: 'https://example.com',
					},
				},
				'image.url',
			),
		).toEqual('https://example.com');
	});

	test('aliasing with collisions', () => {
		const fields = ['id', 'image', 'image.url'];

		const wrapper = mount(TestComponent, {
			props: {
				fields,
				collection: 'articles',
			},
		});

		expect(wrapper.vm.aliasedFields).toEqual({
			id: {
				key: 'id',
				fieldName: 'id',
				fields: ['id'],
				aliased: false,
			},
			'5faa95b': {
				key: 'image',
				fieldName: 'image',
				fieldAlias: '5faa95b',
				fields: ['5faa95b.url.file', '5faa95b.alt'],
				aliased: true,
			},
			'3468cda4': {
				key: 'image.url',
				fieldName: 'image',
				fieldAlias: '3468cda4',
				fields: ['3468cda4.url'],
				aliased: true,
			},
		});

		expect(wrapper.vm.aliasQuery).toEqual({
			'5faa95b': 'image',
			'3468cda4': 'image',
		});

		expect(wrapper.vm.aliasedKeys).toEqual(['5faa95b', '3468cda4']);

		const item = {
			id: 1,
			'5faa95b': {
				url: {
					file: 'https://example.com',
				},
				alt: 'Example',
			},
			'3468cda4': {
				url: 'https://example.com',
			},
		};

		expect(wrapper.vm.getFromAliasedItem(item, 'image.url')).toEqual('https://example.com');

		expect(wrapper.vm.getFromAliasedItem(item, 'image')).toEqual({
			url: {
				file: 'https://example.com',
			},
			alt: 'Example',
		});
	});
});
