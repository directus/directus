import { useCollectionsStore } from '@/stores/collections';
import { getGroups } from '@/utils/get-groups';
import { definePanel } from '@directus/extensions';
import { Filter } from '@directus/types';
import PanelTimeSeries from './panel-time-series.vue';
import PreviewSVG from './preview.svg?raw';

export default definePanel({
	id: 'time-series',
	name: '$t:panels.time_series.name',
	description: '$t:panels.time_series.description',
	icon: 'show_chart',
	preview: PreviewSVG,
	query(options) {
		if (!options?.function || !options.valueField || !options.dateField) {
			return;
		}

		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(options.collection);

		if (!collectionInfo) return;
		if (collectionInfo?.meta?.singleton) return;

		const filter: Filter = {
			_and: [getParsedOptionsFilter(options.filter)],
		};

		if (options.range !== 'auto') {
			filter._and.push(
				{
					[options.dateField]: {
						_gte: `$NOW(-${options.range || '1 week'})`,
					},
				},
				{
					[options.dateField]: {
						_lte: `$NOW`,
					},
				}
			);
		}

		return {
			collection: options.collection,
			query: {
				group: getGroups(options.precision, options.dateField),
				aggregate: {
					[options.function]: [options.valueField],
				},
				filter,
				limit: -1,
			},
		};

		function getParsedOptionsFilter(filter: string | undefined) {
			if (!filter) return {};

			try {
				return JSON.parse(filter);
			} catch {
				return filter;
			}
		}
	},
	component: PanelTimeSeries,
	options: [
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
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
		{
			field: 'function',
			type: 'string',
			name: '$t:group_aggregation',
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
							value: 'countDistinct',
						},
						{
							text: 'Average',
							value: 'avg',
						},
						{
							text: 'Average (Distinct)',
							value: 'avgDistinct',
						},
						{
							text: 'Sum',
							value: 'sum',
						},
						{
							text: 'Sum (Distinct)',
							value: 'sumDistinct',
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
			field: 'precision',
			type: 'string',
			name: '$t:group_precision',
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
							text: 'Week',
							value: 'week',
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
			field: 'dateField',
			type: 'string',
			name: '$t:panels.time_series.date_field',
			meta: {
				interface: 'system-field',
				options: {
					collectionField: 'collection',
					typeAllowList: ['date', 'dateTime', 'timestamp'],
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
							text: 'Automatic (Based on data)',
							value: 'auto',
						},
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
			field: 'valueField',
			type: 'string',
			name: '$t:panels.time_series.value_field',
			meta: {
				interface: 'system-field',
				width: 'half',
				options: {
					allowForeignKeys: false,
					collectionField: 'collection',
					typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
				},
				conditions: [
					{
						rule: {
							function: {
								_in: ['count', 'countDistinct'],
							},
						},
						options: {
							allowPrimaryKey: true,
							allowForeignKeys: true,
							typeAllowList: ['integer', 'bigInteger', 'uuid', 'string'],
						},
					},
				],
			},
		},
		{
			field: 'decimals',
			type: 'integer',
			name: '$t:value_decimals',
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
			field: 'min',
			type: 'integer',
			name: '$t:min_value',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:automatic',
				},
			},
		},
		{
			field: 'max',
			type: 'integer',
			name: '$t:max_value',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					placeholder: '$t:automatic',
				},
			},
		},
		{
			field: 'curveType',
			type: 'string',
			name: '$t:panels.time_series.curve_type',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{
							text: 'Smooth',
							value: 'smooth',
						},
						{
							text: 'Straight',
							value: 'straight',
						},
						{
							text: 'Stepline',
							value: 'stepline',
						},
					],
				},
			},
			schema: {
				default_value: 'smooth',
			},
		},
		{
			field: 'fillType',
			type: 'string',
			name: '$t:panels.time_series.fill_type',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{
							text: 'Gradient',
							value: 'gradient',
						},
						{
							text: 'Solid',
							value: 'solid',
						},
						{
							text: 'Disabled',
							value: 'disabled',
						},
					],
				},
			},
			schema: {
				default_value: 'gradient',
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
		{
			field: 'showXAxis',
			type: 'boolean',
			name: '$t:show_x_axis',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'showYAxis',
			type: 'boolean',
			name: '$t:show_y_axis',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
			schema: {
				default_value: true,
			},
		},
	],
	minWidth: 12,
	minHeight: 6,
});
