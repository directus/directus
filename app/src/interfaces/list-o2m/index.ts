import { DeepPartial, Field } from '@directus/types';
import { defineInterface } from '@directus/utils';
import InterfaceListO2M from './list-o2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-o2m',
	name: '$t:interfaces.list-o2m.one-to-many',
	description: '$t:interfaces.list-o2m.description',
	icon: 'arrow_right_alt',
	component: InterfaceListO2M,
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	options: ({ relations, field: { meta } }) => {
		const collection = relations.o2m?.collection;
		const options = meta?.options ?? {};

		const tableOptions: DeepPartial<Field>[] = [
			{
				field: 'tableSpacing',
				name: '$t:layouts.tabular.spacing',
				schema: {
					default_value: 'cozy',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:layouts.tabular.compact',
								value: 'compact',
							},
							{
								text: '$t:layouts.tabular.cozy',
								value: 'cozy',
							},
							{
								text: '$t:layouts.tabular.comfortable',
								value: 'comfortable',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'fields',
				name: '$t:columns',
				meta: {
					interface: 'system-fields',
					options: {
						collectionName: collection,
					},
					width: 'full',
				},
			},
		];

		const listOptions: DeepPartial<Field>[] = [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
					width: 'full',
				},
			},
		];

		return [
			{
				field: 'layout',
				name: '$t:layout',
				schema: {
					default_value: 'list',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:list',
								value: 'list',
							},
							{
								text: '$t:table',
								value: 'table',
							},
						],
					},
					width: 'half',
				},
			},
			...(options.layout === 'table' ? tableOptions : listOptions),
			{
				field: 'enableCreate',
				name: '$t:creating_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_create_button',
					},
					width: 'half',
				},
			},
			{
				field: 'enableSelect',
				name: '$t:selecting_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_select_button',
					},
					width: 'half',
				},
			},
			{
				field: 'limit',
				name: '$t:per_page',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
				},
				schema: {
					default_value: 15,
				},
			},
			{
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection,
					},
					conditions: [
						{
							rule: {
								enableSelect: {
									_eq: false,
								},
							},
							hidden: true,
						},
					],
				},
			},
			{
				field: 'enableSearchFilter',
				name: '$t:search_filter',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_search_filter',
					},
					width: 'half',
					hidden: true,
					conditions: [
						{
							rule: {
								layout: {
									_eq: 'table',
								},
							},
							hidden: false,
						},
					],
				},
			},
			{
				field: 'enableLink',
				name: '$t:item_link',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:show_link_to_item',
					},
					width: 'half',
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
