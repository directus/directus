import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { definePanel, type PanelQuery } from '@directus/extensions';
import { computed } from 'vue';
import PanelMetricList from './panel-metric-list.vue';
import PreviewSVG from './preview.svg?raw';

export default definePanel({
	id: 'metric-list',
	name: '$t:panels.metric_list.name',
	icon: 'format_list_numbered_rtl',
	preview: PreviewSVG,
	description: '$t:panels.metric_list.description',
	component: PanelMetricList,
	query(options) {
		if (!options?.collection) return;

		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(options.collection);

		if (!collectionInfo) return;
		if (collectionInfo?.meta?.singleton) return;

		// sort by the aggregate field
		const sort =
			options.sortDirection == 'asc'
				? [`${options.aggregateFunction}.${options.aggregateField}`]
				: ['-' + `${options.aggregateFunction}.${options.aggregateField}`];

		const aggregate = {
			[options.aggregateFunction]: [options.aggregateField || '*'],
		};

		const group = [options.groupByField];

		const panelQuery: PanelQuery = {
			collection: options.collection,
			query: {
				sort,
				limit: options.limit ?? 5,
				aggregate,
				group,
			},
		};

		if (options.filter && Object.keys(options.filter).length > 0) {
			panelQuery.query.filter = options.filter;
		}

		return panelQuery;
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const fieldType = computed(() => {
			return options?.collection && options?.aggregateField
				? fieldsStore.getField(options.collection, options.aggregateField)?.type
				: null;
		});

		const fieldIsNumber = computed(() =>
			fieldType.value ? ['integer', 'bigInteger', 'float', 'decimal'].includes(fieldType.value) : false,
		);

		return [
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
				field: 'limit',
				type: 'integer',
				name: '$t:limit',
				schema: {
					default_value: 5,
				},
				meta: {
					interface: 'input',
					width: 'half',
				},
			},

			{
				field: 'groupByField',
				type: 'string',
				name: 'GroupBy Field',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'aggregateField',
				type: 'string',
				name: 'Aggregated Field',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'aggregateFunction',
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
								disabled: false,
							},
							{
								text: 'Count (Distinct)',
								value: 'countDistinct',
								disabled: false,
							},
							{
								divider: true,
							},
							{
								text: 'Average',
								value: 'avg',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Average (Distinct)',
								value: 'avgDistinct',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Sum',
								value: 'sum',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Sum (Distinct)',
								value: 'sumDistinct',
								disabled: !fieldIsNumber.value,
							},
						],
					},
				},
			},
			{
				field: 'sortDirection',
				type: 'string',
				name: '$t:sort_direction',
				schema: {
					default_value: 'desc',
				},
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
				field: 'numberStyle',
				type: 'string',
				name: '$t:style',
				schema: {
					default_value: 'decimal',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:decimal',
								value: 'decimal',
							},
							{
								text: '$t:currency',
								value: 'currency',
							},
							{
								text: '$t:percent',
								value: 'percent',
							},
							{
								text: '$t:unit',
								value: 'unit',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'notation',
				type: 'string',
				name: '$t:notation',
				schema: {
					default_value: 'standard',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:standard',
								value: 'standard',
							},
							{
								text: '$t:scientific',
								value: 'scientific',
							},
							{
								text: '$t:engineering',
								value: 'engineering',
							},
							{
								text: '$t:compact',
								value: 'compact',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'unit',
				type: 'string',
				name: '$t:unit',
				schema: {
					default_value: '',
				},
				meta: {
					interface: 'input',
					hidden: options?.numberStyle !== 'unit' && options?.numberStyle !== 'currency',
				},
			},
			{
				field: 'minimumFractionDigits',
				type: 'integer',
				name: '$t:minimum_fraction_digits',
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
				field: 'maximumFractionDigits',
				type: 'integer',
				name: '$t:maximum_fraction_digits',
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
									default_value: '=',
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
								type: 'string',
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
									display: 'color',
								},
							},
						],
					},
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 6,
});
