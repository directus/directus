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
			field: 'dateField',
			type: 'string',
			name: '$t:panels.time_series.date_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					typeAllowList: ['date', 'datetime', 'timestamp'],
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
			field: 'range',
			type: 'dropdown',
			name: '$t:date_range',
			schema: {
				default_value: '1 week',
			},
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{
							text: 'Past 5 Minutes',
							value: '5 minutes',
						},
						{
							text: 'Past 15 Minutes',
							value: '15 minutes',
						},
						{
							text: 'Past 30 Minutes',
							value: '30 minutes',
						},
						{
							text: 'Past 1 Hour',
							value: '1 hour',
						},
						{
							text: 'Past 4 Hours',
							value: '4 hours',
						},
						{
							text: 'Past 1 Day',
							value: '1 day',
						},
						{
							text: 'Past 2 Days',
							value: '2 days',
						},
						{
							text: 'Past 1 Week',
							value: '1 week',
						},
						{
							text: 'Past 1 Month',
							value: '1 month',
						},
						{
							text: 'Past 3 Months',
							value: '3 months',
						},
					],
					allowOther: true,
				},
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
			field: 'precision',
			type: 'string',
			name: '$t:precision',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{
							text: 'Second',
							value: 'second',
						},
						{
							text: 'Minute',
							value: 'minute',
						},
						{
							text: 'Hour',
							value: 'hour',
						},
						{
							text: 'Day',
							value: 'day',
						},
						{
							text: 'Month',
							value: 'month',
						},
						{
							text: 'Year',
							value: 'year',
						},
					],
				},
			},
			schema: {
				default_value: 'hour',
			},
		},
		{
			field: 'showZero',
			name: '$t:showZero',
			type: 'boolean',
			meta: {
				interface: 'boolean',
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
