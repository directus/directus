import { definePanel } from '../define';
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
					],
				},
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
				},
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
				default_value: 2,
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
			field: 'prefix',
			type: 'string',
			name: '$t:prefix',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:prefix_placeholder',
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
				},
			},
		},
		{
			field: 'abbreviate',
			type: 'boolean',
			name: '$t:abbreviate_value',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
		{
			field: 'conditionalFormatting',
			type: 'json',
			name: '[TBD] Conditional Format (styling?)',
			meta: {
				interface: 'list',
				width: 'full',
				options: {
					template: '{{operator}} {{value}}',
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
											text: '=',
											value: '=',
										},
										{
											text: '!=',
											value: '!=',
										},
										{
											text: '>',
											value: '>',
										},
										{
											text: '>=',
											value: '>=',
										},
										{
											text: '<',
											value: '<',
										},
										{
											text: '<=',
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
							meta: {
								interface: 'select-color',
							},
						},
					],
				},
			},
		},
	],
	minWidth: 16,
	minHeight: 6,
});
