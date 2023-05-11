import { useFieldsStore } from '@/stores/fields';
import { definePanel } from '@directus/utils';
import { computed } from 'vue';
import PanelLineChart from './panel-line-chart.vue';

export default definePanel({
	id: 'line-chart',
	name: '$t:panels.linechart.name',
	description: '$t:panels.linechart.description',
	icon: 'show_chart',
	component: PanelLineChart,
	query: (options) => {
		if (!options['xAxis'] || !options['collection']) return;

		const query: Record<string, any> = {
			fields: [options['yAxis'], options['xAxis']],
			filter: options['filter'] ?? {},
			limit: -1,
		};

		if (options['group']) {
			query['group'] = [options['group']];
			query['aggregate'] = options['function'] ? { [options['function']]: [options['xAxis']] } : {};
		}

		return {
			collection: options['collection'],
			query,
		};
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const isNumberRequired = computed(
			() => !options?.['function'] || !['count', 'last', 'first'].includes(options['function'])
		);

		const yAxisChoices = computed<{ value: string; text: string; disabled?: boolean }[]>(() => {
			if (!options?.['collection']) return [];

			const fields = fieldsStore.getFieldsForCollection(options['collection']);
			if (fields.length === 0) return [];

			return fields.map((field) => {
				return {
					value: field.field,
					text: field.name,
					disabled:
						options['group'] ||
						(isNumberRequired.value && !['integer', 'bigInteger', 'float', 'decimal'].includes(field.type)),
				};
			});
		});

		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
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
				meta: {
					interface: 'system-field',
					width: 'half',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						placeholder: '$t:primary_key',
						typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
					},
				},
			},
			{
				field: 'yAxis',
				name: '$t:y_axis',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					readonly: !!options?.['group'],
					options: {
						allowNone: true,
						placeholder: options?.['group'] ? '$t:panels.linechart.disabled_grouping' : '$t:primary_key',
						choices: yAxisChoices.value,
					},
				},
			},
			{
				field: 'group',
				name: '$t:group_aggregation',
				type: 'string',
				meta: {
					interface: 'system-field',
					width: 'half',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						allowNone: true,
						placeholder: '$t:primary_key',
					},
				},
			},
			{
				field: 'function',
				type: 'string',
				name: '$t:function',
				required: !!options?.['group'],
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					readonly: !options?.['group'],
					options: {
						required: !!options?.['group'],
						allowNone: true,
						placeholder: !options?.['group'] ? '$t:panels.linechart.disabled_no_grouping' : '$t:count',
						choices: [
							{
								text: '$t:count',
								value: 'count',
								disabled: !options?.['group'],
							},
							{
								text: '$t:count_distinct',
								value: 'countDistinct',
								disabled: !options?.['group'],
							},
							{
								text: '$t:avg',
								value: 'avg',
								disabled: !options?.['group'],
							},
							{
								text: '$t:avg_distinct',
								value: 'avgDistinct',
								disabled: !options?.['group'],
							},
							{
								text: '$t:sum',
								value: 'sum',
								disabled: !options?.['group'],
							},
							{
								text: '$t:sum_distinct',
								value: 'sumDistinct',
								disabled: !options?.['group'],
							},
							{
								text: '$t:min',
								value: 'min',
								disabled: !options?.['group'],
							},
							{
								text: '$t:max',
								value: 'max',
								disabled: !options?.['group'],
							},
						],
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
					default_value: 'var(--primary)',
				},
				meta: {
					interface: 'select-color',
					display: 'color',
					width: 'half',
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
								value: 'yOnly',
								text: '$t:show_y_only',
							},
							{
								value: 'xOnly',
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
		];
	},
	minWidth: 12,
	minHeight: 10,
});
