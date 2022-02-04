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
				name: '$t:interfaces.tags-m2m.reference-field',
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
				name: '$t:display',
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
				field: 'closeOnSelect',
				name: '$t:interfaces.tags-m2m.close-on-select',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'toggle',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'alphabetize',
				name: '$t:interfaces.tags.alphabetize',
				type: 'boolean',
				meta: {
					width: 'half-left',
					interface: 'toggle',
					options: {
						label: '$t:interfaces.tags.alphabetize_label',
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
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconRight',
				name: '$t:icon_right',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
				schema: {
					default_value: 'local_offer',
				},
			},
		];
	},
});
