import { definePanel } from '../define';
import PanelTimeSeries from './time-series.vue';

export default definePanel({
	id: 'time-series',
	name: '$t:panels.time_series.name',
	description: '$t:panels.time_series.description',
	icon: 'show_chart',
	component: PanelTimeSeries,
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
							text: 'Average',
							value: 'avg',
						},
						{
							text: 'Sum',
							value: 'sum',
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
							text: 'Count',
							value: 'count',
						},
					],
				},
			},
		},
		{
			field: 'dateField',
			type: 'string',
			name: '$t:panels.time_series.date_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					typeAllowList: ['date'],
				},
				width: 'half',
			},
		},
		{
			field: 'valueField',
			type: 'string',
			name: '$t:panels.time_series.value_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
				},
				width: 'half',
			},
		},
		{
			field: 'limit',
			type: 'integer',
			name: '$t:limit',
			schema: {
				default_value: 100,
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
				width: 'half',
			},
		},
	],
	minWidth: 16,
	minHeight: 8,
});
