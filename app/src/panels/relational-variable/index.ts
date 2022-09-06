import { definePanel } from '@directus/shared/utils';
import PanelRelationalVariable from './panel-relational-variable.vue';

export default definePanel({
	id: 'relational-variable',
	name: '$t:panels.relational-variable.name',
	description: '$t:panels.relational-variable.description',
	icon: 'science',
	component: PanelRelationalVariable,
	variable: true,
	options: [
		{
			name: '$t:panels.relational-variable.variable_key',
			field: 'field',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
				options: {
					dbSafe: true,
					font: 'monospace',
					placeholder: '$t:interfaces.list.field_name_placeholder',
				},
			},
			schema: null,
		},
		{
			field: 'collection',
			type: 'string',
			name: '$t:collection',
			meta: {
				interface: 'system-collection',
				options: {
					includeSystem: true,
					includeSingleton: false,
				},
				width: 'half',
			},
		},
		{
			field: 'multiple',
			name: '$t:multiple',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:multiple',
				},
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		// {
		// 	field: 'sortField',
		// 	type: 'string',
		// 	name: '$t:sort_field',
		// 	meta: {
		// 		interface: 'system-field',
		// 		options: {
		// 			collectionField: 'collection',
		// 			allowPrimaryKey: true,
		// 			placeholder: '$t:primary_key',
		// 		},
		// 		width: 'half',
		// 	},
		// },
		// {
		// 	field: 'sortDirection',
		// 	type: 'string',
		// 	name: '$t:sort_direction',
		// 	schema: {
		// 		default_value: 'desc',
		// 	},
		// 	meta: {
		// 		interface: 'select-dropdown',
		// 		options: {
		// 			choices: [
		// 				{
		// 					text: '$t:sort_asc',
		// 					value: 'asc',
		// 				},
		// 				{
		// 					text: '$t:sort_desc',
		// 					value: 'desc',
		// 				},
		// 			],
		// 		},
		// 		width: 'half',
		// 	},
		// },
		{
			field: 'displayTemplate',
			name: '$t:display_template',
			type: 'string',
			meta: {
				interface: 'system-display-template',
				width: 'full',
				options: {
					collectionField: 'collection',
					placeholder: '{{ field }}',
				},
			},
		},
		{
			field: 'filter',
			type: 'json',
			name: '$t:filter',
			meta: {
				interface: 'system-filter',
				options: {
					collectionField: 'collection',
				},
			},
		},
	],
	minWidth: 12,
	minHeight: 6,
});
