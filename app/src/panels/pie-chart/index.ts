import { useFieldsStore } from '@/stores/fields';
import { definePanel } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import { computed } from 'vue';
import PanelPieChart from './panel-pie-chart.vue';

export default definePanel({
	id: 'pie-chart',
	name: '$t:panels.piechart.name',
	icon: 'pie_chart',
	description: '$t:panels.piechart.description',
	component: PanelPieChart,
	query(options) {
		if (!options.column) return;

		return {
			collection: options.collection,
			query: {
				group: [options.column],
				aggregate: {
					[options.function ?? 'count']: [options.column],
				},
				filter: options.filter ?? {},
				limit: -1,
			},
		};
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const isNumberColumn = computed(() => {
			if (!options?.collection || !options?.column) return false;
			const field = fieldsStore.getField(options.collection, options.column);
			if (!field?.type) return false;
			return ['integer', 'bigInteger', 'float', 'decimal'].includes(field.type);
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
					width: 'half',
				},
			},
			{
				field: 'column',
				name: '$t:field',
				type: 'string',
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
				field: 'function',
				type: 'string',
				name: '$t:function',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						allowNone: false,
						allowPrimaryKey: true,
						placeholder: '$t:count',
						choices: [
							{
								text: '$t:count',
								value: 'count',
							},
							{
								text: '$t:avg',
								value: 'avg',
								disabled: !isNumberColumn.value,
							},
							{
								text: '$t:sum',
								value: 'sum',
								disabled: !isNumberColumn.value,
							},
							{
								text: '$t:min',
								value: 'min',
								disabled: !isNumberColumn.value,
							},
							{
								text: '$t:max',
								value: 'max',
								disabled: !isNumberColumn.value,
							},
						],
					},
				},
				schema: { default_value: 'count' },
			},
			{
				field: 'donut',
				name: '$t:donut',
				type: 'boolean',
				meta: {
					width: 'half',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'showLabels',
				name: '$t:show_labels',
				type: 'boolean',
				meta: {
					width: 'half',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'legend',
				type: 'string',
				name: '$t:show_legend',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						allowNone: false,
						allowPrimaryKey: false,
						placeholder: '$t:none',
						choices: [
							{
								text: '$t:none',
								value: 'none',
							},
							{
								text: '$t:right',
								value: 'right',
							},
							{
								text: '$t:bottom',
								value: 'bottom',
							},
						],
					},
				},
				schema: { default_value: 'none' },
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
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'string',
				schema: {
					default_value: cssVar('--primary'),
				},
				meta: {
					interface: 'select-color',
					width: 'half',
				},
			},
			{
				field: 'conditionalFill',
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
								name: 'operators',
								type: 'string',
								schema: {
									default_value: '=',
								},
								meta: {
									interface: 'select-dropdown',
									width: 'half',
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
												text: '$t:operators.contains',
												value: 'contains',
												disabled: !isNumberColumn.value,
											},
											{
												text: '$t:operators.ncontains',
												value: 'ncontains',
												disabled: !isNumberColumn.value,
											},
											{
												text: '$t:operators.starts_with',
												value: 'starts_with',
												disabled: !isNumberColumn.value,
											},
											{
												text: '$t:operators.ends_with',
												value: 'ncontains',
												disabled: !isNumberColumn.value,
											},
											{
												text: '$t:operators.gt',
												value: '>',
												disabled: isNumberColumn.value,
											},
											{
												text: '$t:operators.gte',
												value: '>=',
												disabled: isNumberColumn.value,
											},
											{
												text: '$t:operators.lt',
												value: '<',
												disabled: isNumberColumn.value,
											},
											{
												text: '$t:operators.lte',
												value: '<=',
												disabled: isNumberColumn.value,
											},
										],
									},
								},
							},
							{
								field: 'value',
								name: '$t:value',
								type: 'string',
								meta: {
									interface: 'input',
									width: 'half',
								},
							},
							{
								field: 'color',
								name: '$t:color',
								type: 'integer',
								schema: {
									default_value: cssVar('--primary'),
								},
								meta: {
									interface: 'select-color',
									display: 'color',
									width: 'half',
								},
							},
						],
					},
				},
			},
		];
	},
	minWidth: 10,
	minHeight: 10,
});
