import { definePanel } from '@directus/utils';
import { computed } from 'vue';
import PanelBarChart from './panel-bar-chart.vue';
import { useFieldsStore } from '@/stores/fields';

export default definePanel({
	id: 'bar-chart',
	name: '$t:panels.barchart.name',
	description: '$t:panels.barchart.description',
	icon: 'bar_chart',
	component: PanelBarChart,
	query: (options) => {
		const requiredFields = ['collection', 'xAxis', 'yAxis'];
		if (requiredFields.some((field) => !(field in options))) return;

		options['function'] = options['function'] ?? 'max';

		return {
			collection: options['collection'],
			query: {
				group: [options['xAxis']],
				aggregate: { [options['function']]: [options['yAxis']] },
				filter: options['filter'] ?? {},
				limit: -1,
			},
		};
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const needsANumber = computed(() => {
			if (!options?.['function'] || !['count', 'last', 'first'].includes(options['function'])) return true;
			return false;
		});

		const usableChoices = computed(() => {
			const fields = fieldsStore.getFieldsForCollection(options?.['collection']);
			const choices: { value: string; text: string; disabled?: boolean }[] = [];

			for (const field of fields) {
				if (needsANumber.value && ['integer', 'bigInteger', 'float', 'decimal'].includes(field.type)) {
					choices.push({ value: field.field, text: field.name });
				} else if (needsANumber.value) {
					choices.push({
						value: field.field,
						text: field.name,
						disabled: true,
					});
				} else {
					choices.push({ value: field.field, text: field.name });
				}
			}

			return choices.filter((choice) => choice !== null && choice !== undefined);
		});

		const xAxisIsntNumber = computed(() => {
			if (options?.['collection'] && options['xAxis']) {
				const field = fieldsStore.getField(options['collection'], options['xAxis']);
				if (field) return !['integer', 'bigInteger', 'float', 'decimal'].includes(field.type);
			}

			return false;
		});

		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
				meta: {
					interface: 'system-collection',
					required: true,
					options: {
						includeSystem: true,
					},
					width: 'half',
				},
			},
			{
				field: 'horizontal',
				type: 'boolean',
				name: '$t:horizontal',
				meta: {
					interface: 'boolean',
					width: 'half',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'xAxis',
				name: '$t:x_axis',
				type: 'string',
				meta: {
					interface: 'system-field',
					required: true,
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
				type: 'integer',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						placeholder: '$t:primary_key',
						choices: usableChoices.value,
					},
				},
			},
			{
				field: 'function',
				type: 'string',
				name: '$t:y_axis_function',
				schema: {
					default_value: 'max',
				},
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						allowNone: true,
						allowPrimaryKey: true,
						placeholder: '$t:count',
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
					conditions: [
						{
							rule: {
								group: {
									_null: true,
								},
							},
							readonly: true,
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
					required: true,
					options: {
						placeholder: '$t:decimals_placeholder',
						min: 0,
					},
				},
				schema: {
					default_value: 2,
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'string',
				schema: {
					default_value: 'var(--primary)',
				},
				meta: {
					interface: 'select-color',
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
				field: 'showDataLabel',
				type: 'boolean',
				name: '$t:show_data_label',
				meta: {
					interface: 'boolean',
					width: 'half',
				},
				schema: {
					default_value: true,
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
						template: '{{color}} {{axis}}-Axis {{operator}} {{value}}',
						fields: [
							{
								field: 'axis',
								name: '$t:axis',
								type: 'string',
								schema: {
									default_value: 'Y',
								},
								meta: {
									interface: 'select-dropdown',
									options: {
										choices: [
											{
												text: 'X-Axis',
												value: 'X',
											},
											{
												text: 'Y-Axis',
												value: 'Y',
											},
										],
									},
									width: 'half',
								},
							},
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
									conditions: [
										{
											name: 'dynamic-dropdown',
											rule: {
												axis: {
													_eq: 'X',
												},
											},

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
														disabled: !xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.ncontains',
														value: 'ncontains',
														disabled: !xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.starts_with',
														value: 'starts_with',
														disabled: !xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.ends_with',
														value: 'ends_with',
														disabled: !xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.gt',
														value: '>',
														disabled: xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.gte',
														value: '>=',
														disabled: xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.lt',
														value: '<',
														disabled: xAxisIsntNumber.value,
													},
													{
														text: '$t:operators.lte',
														value: '<=',
														disabled: xAxisIsntNumber.value,
													},
												],
											},
										},
									],
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
									default_value: 'var(--primary)',
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
	minWidth: 12,
	minHeight: 10,
});
