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
			field: 'sortField',
			type: 'string',
			name: '$t:sort_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					allowPrimaryKey: true,
				},
				width: 'half',
			},
		},
		{
			field: 'sortDirection',
			type: 'string',
			name: '$t:sort_direction',
			meta: {
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
				width: 'half',
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
	],
	minWidth: 16,
	minHeight: 6,
});
