import { definePanel } from '@directus/utils';
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
				required: true,
				interface: 'input',
				width: 'full',
				options: {
					dbSafe: true,
					font: 'monospace',
					placeholder: '$t:field_name_placeholder',
				},
			},
		},
		{
			field: 'collection',
			type: 'string',
			name: '$t:collection',
			meta: {
				required: true,
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
			name: '$t:panels.relational-variable.multiple',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:panels.relational-variable.multiple-label',
				},
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'limit',
			name: '$t:limit',
			type: 'integer',
			meta: {
				interface: 'input',
				width: 'full',
				hidden: true,
				options: {
					placeholder: '$t:decimals_placeholder',
					min: 0,
				},
				conditions: [
					{
						rule: {
							multiple: { _eq: true },
						},
						hidden: false,
					},
				],
			},
			schema: {
				default_value: 5,
			},
		},
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
					relationalFieldSelectable: false,
				},
			},
		},
	],
	minWidth: 12,
	minHeight: 6,
	skipUndefinedKeys: ['displayTemplate'],
});
