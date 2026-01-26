import { definePanel } from '@directus/extensions';
import { computed } from 'vue';
import PanelLineChart from './panel-line-chart.vue';
import PreviewSVG from './preview.svg?raw';
import { useFieldsStore } from '@/stores/fields';
import { getGroups } from '@/utils/get-groups';

export default definePanel({
	id: 'line-chart',
	name: '$t:panels.linechart.name',
	description: '$t:panels.linechart.description',
	icon: 'show_chart',
	preview: PreviewSVG,
	component: PanelLineChart,
	query: (options) => {
		if (!options['yAxis'] || !options['xAxis'] || !options['collection']) return;

		const query: Record<string, any> = {
			fields: [options['yAxis'], options['xAxis']],
			filter: options['filter'] ?? {},
			limit: -1,
			aggregate: {
				[options?.aggregation]: [options?.yAxis],
			},
			group: [],
		};

		if (options['datePrecision']) {
			query['group'].push(...getGroups(options['datePrecision'], options['xAxis']));
		} else {
			query['group'].push(options['xAxis']);
		}

		if (options['grouping']) {
			query['group'].push(options['grouping']);
		}

		return {
			collection: options['collection'],
			query,
		};
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const yAxisChoices = computed<{ value: string; text: string; disabled?: boolean }[]>(() => {
			if (!options?.['collection']) return [];

			const fields = fieldsStore.getFieldsForCollection(options['collection']);
			if (fields.length === 0) return [];

			return fields.map((field) => {
				return {
					value: field.field,
					text: field.name,
				};
			});
		});

		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
				required: true,
				meta: {
					interface: 'system-collection',
					options: {
						includeSystem: true,
					},
					width: 'half-left',
				},
			},
			{
				field: 'xAxis',
				name: '$t:x_axis',
				type: 'string',
				required: true,
				meta: {
					interface: 'system-field',
					width: 'half',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						placeholder: '$t:primary_key',
					},
				},
			},
			{
				field: 'yAxis',
				name: '$t:y_axis',
				type: 'string',
				required: true,
				meta: {
					interface: 'system-field',
					width: 'half',
					options: {
						collectionField: 'collection',
						typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
					},
				},
			},
			{
				field: 'aggregation',
				type: 'string',
				name: '$t:aggregation',
				required: true,
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:count',
								value: 'count',
							},
							{
								text: '$t:count_distinct',
								value: 'countDistinct',
							},
							{
								text: '$t:avg',
								value: 'avg',
							},
							{
								text: '$t:avg_distinct',
								value: 'avgDistinct',
							},
							{
								text: '$t:sum',
								value: 'sum',
							},
							{
								text: '$t:sum_distinct',
								value: 'sumDistinct',
							},
							{
								text: '$t:min',
								value: 'min',
							},
							{
								text: '$t:max',
								value: 'max',
							},
						],
					},
				},
			},
			{
				field: 'grouping',
				type: 'string',
				name: '$t:series_grouping',
				required: true,
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: yAxisChoices,
						allowNone: true,
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
						collectionName: options?.['collection'],
					},
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
					default_value: 2,
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'integer',
				schema: {
					default_value: 'var(--theme--primary)',
				},
				meta: {
					interface: 'select-color',
					display: 'color',
					width: 'half',
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
				name: '$t:panels.linechart.curve_type',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{
								text: '$t:panels.linechart.smooth',
								value: 'smooth',
							},
							{
								text: '$t:panels.linechart.straight',
								value: 'straight',
							},
							{
								text: '$t:panels.linechart.step_line',
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
				field: 'showAxisLabels',
				type: 'string',
				name: '$t:show_axis_labels',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								value: 'both',
								text: '$t:both',
							},
							{
								value: 'yAxis',
								text: '$t:show_y_only',
							},
							{
								value: 'xAxis',
								text: '$t:show_x_only',
							},
							{
								value: 'none',
								text: '$t:none',
							},
						],
					},
					width: 'half',
				},
				schema: {
					default_value: 'both',
				},
			},
			{
				field: 'showMarker',
				name: '$t:panels.linechart.show_marker',
				type: 'boolean',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'showLegend',
				type: 'boolean',
				name: '$t:panels.linechart.show_legend',
				meta: {
					interface: 'boolean',
					width: 'half',
				},
				schema: {
					default_value: false,
				},
			},
		];
	},
	minWidth: 6,
	minHeight: 6,
});
