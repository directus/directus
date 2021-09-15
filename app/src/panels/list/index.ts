import { definePanel } from '@directus/shared/utils';
import PanelList from './list.vue';

export default definePanel({
	id: 'list',
	name: '$t:panels.list.name',
	description: '$t:panels.list.description',
	icon: 'functions',
	component: PanelList,
	options: [
		{
			field: 'collection',
			type: 'string',
			name: '$t:collection',
			meta: {
				interface: 'system-collection',
				options: {
					includeSystem: true,
				},
				width: 'half',
			},
		},
		{
			field: 'sortField',
			type: 'string',
			name: '$t:sort_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					allowPrimaryKey: true,
					placeholder: '$t:primary_key',
				},
				width: 'half',
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
				interface: 'code',
				note: '[Learn More: Filter Rules](/admin/docs/reference/filter-rules)',
				options: {
					language: 'json',
					placeholder: '{\n\t<field>: {\n\t\t<operator>: <value>\n\t}\n}',
				},
			},
		},
		{
			field: 'styleDivider',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				options: {
					icon: 'style',
					title: 'Style & Format',
				},
				special: ['alias', 'no-data'],
			},
		},
		{
			field: 'abbreviate',
			type: 'boolean',
			name: '$t:abbreviate_value',
			schema: {
				default_value: false,
			},
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
		{
			field: 'decimals',
			type: 'integer',
			name: '$t:decimals',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:decimals_placeholder',
				},
			},
			schema: {
				default_value: 0,
			},
		},
		{
			field: 'prefix',
			type: 'string',
			name: '$t:prefix',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:prefix_placeholder',
					trim: false,
				},
			},
		},
		{
			field: 'suffix',
			type: 'string',
			name: '$t:suffix',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:suffix_placeholder',
					trim: false,
				},
			},
		},
		{
			field: 'conditionalFormatting',
			type: 'json',
			name: '$t:conditional_styles',
			meta: {
				interface: 'list',
				width: 'full',
				options: {
					template: '{{color}} {{operator}} {{value}}',
					fields: [
						{
							field: 'operator',
							name: '$t:operator',
							type: 'string',
							schema: {
								default_value: '>=',
							},
							meta: {
								interface: 'select-dropdown',
								options: {
									choices: [
										{
											text: '$t:operators.eq',
											value: '=',
										},
										{
											text: '$t:operators.neq',
											value: '!=',
										},
										{
											text: '$t:operators.gt',
											value: '>',
										},
										{
											text: '$t:operators.gte',
											value: '>=',
										},
										{
											text: '$t:operators.lt',
											value: '<',
										},
										{
											text: '$t:operators.lte',
											value: '<=',
										},
									],
								},
								width: 'half',
							},
						},
						{
							field: 'value',
							name: '$t:value',
							type: 'integer',
							schema: {
								default_value: 0,
							},
							meta: {
								interface: 'input',
								width: 'half',
							},
						},
						{
							field: 'color',
							name: '$t:color',
							type: 'string',
							schema: {
								default_value: '#00C897',
							},
							meta: {
								interface: 'select-color',
								display: 'color',
							},
						},
					],
				},
			},
		},
	],
	minWidth: 8,
	minHeight: 6,
});
