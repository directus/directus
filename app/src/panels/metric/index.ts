import { definePanel } from '@directus/shared/utils';
import PanelMetric from './metric.vue';

export default definePanel({
	id: 'metric',
	name: '$t:panels.metric.name',
	description: '$t:panels.metric.description',
	icon: 'functions',
	component: PanelMetric,
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
			field: 'field',
			type: 'string',
			name: '$t:panels.metric.field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
					allowPrimaryKey: true,
					allowNone: true,
				},
				width: 'half',
			},
		},
		{
			field: 'function',
			type: 'string',
			name: '$t:aggregate_function',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'Count',
							value: 'count',
						},
						{
							text: 'Count (Distinct)',
							value: 'count_distinct',
						},
						{
							text: 'Average',
							value: 'avg',
						},
						{
							text: 'Average (Distinct)',
							value: 'avg_distinct',
						},
						{
							text: 'Sum',
							value: 'sum',
						},
						{
							text: 'Sum (Distinct)',
							value: 'sum_distinct',
						},
						{
							text: 'Minimum',
							value: 'min',
						},
						{
							text: 'Maximum',
							value: 'max',
						},
						{
							text: 'First',
							value: 'first',
						},
						{
							text: 'Last',
							value: 'last',
						},
					],
				},
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
