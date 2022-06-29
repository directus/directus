import { defineInterface } from '@directus/shared/utils';
import InterfaceTagsM2M from './tags-m2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'many-to-many-reference',
	name: '$t:interfaces.tags-m2m.tags-m2m',
	description: '$t:interfaces.tags-m2m.description',
	icon: 'local_offer',
	preview: PreviewSVG,
	component: InterfaceTagsM2M,
	relational: true,
	types: ['alias'],
	localTypes: ['m2m'],
	group: 'relational',
	recommendedDisplays: ['related-values'],
	options: ({ relations }) => {
		return [
			{
				field: 'referencingField',
				name: '$t:interfaces.tags-m2m.reference_field',
				type: 'string',
				required: true,
				collection: relations.m2o?.related_collection,
				meta: {
					width: 'full',
					interface: 'system-field',
					options: {
						typeAllowList: ['string', 'integer', 'bigInteger'],
						allowPrimaryKey: true,
					},
				},
			},
			{
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: relations.m2o?.related_collection ?? null,
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
				field: 'displayTemplate',
				name: '$t:display_template',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'system-display-template',
					options: {
						collectionName: relations.m2o?.related_collection,
					},
				},
			},
			{
				field: 'placeholder',
				name: '$t:placeholder',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'text-input',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
				},
			},
			{
				field: 'sortField',
				type: 'string',
				name: '$t:sort_field',
				collection: relations.m2o?.related_collection,
				meta: {
					width: 'half',
					interface: 'system-field',
					options: {
						allowPrimaryKey: true,
						allowNone: true,
					},
				},
			},
			{
				field: 'sortDirection',
				type: 'string',
				name: '$t:sort_direction',
				schema: {
					default_value: 'desc',
				},
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:sort_asc',
								value: 'asc',
							},
							{
								text: '$t:sort_desc',
								value: 'desc',
							},
						],
					},
				},
			},
			{
				field: 'allowCustom',
				name: '$t:interfaces.select-dropdown.allow_other',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
					options: {
						label: '$t:interfaces.select-dropdown.allow_other_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'iconLeft',
				name: '$t:icon_left',
				type: 'string',
				meta: {
					width: 'half-left',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconRight',
				name: '$t:icon_right',
				type: 'string',
				meta: {
					width: 'half-right',
					interface: 'select-icon',
				},
				schema: {
					default_value: 'local_offer',
				},
			},
		];
	},
});
