import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { PanelQuery } from '@directus/types';
import { definePanel } from '@directus/utils';
import { computed } from 'vue';
import PanelMetric from './panel-metric.vue';

export default definePanel({
	id: 'metric',
	name: '$t:panels.metric.name',
	description: '$t:panels.metric.description',
	icon: 'functions',
	component: PanelMetric,
	query(options) {
		if (!options || !options.function) return;
		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(options.collection);

		if (!collectionInfo) return;
		if (collectionInfo?.meta?.singleton) return;

		const isRawValue = ['first', 'last'].includes(options.function);

		const sort = options.sortField && `${options.function === 'last' ? '-' : ''}${options.sortField}`;

		const aggregate = isRawValue
			? undefined
			: {
					[options.function]: [options.field || '*'],
			  };

		const panelQuery: PanelQuery = {
			collection: options.collection,
			query: {
				sort,
				limit: 1,
				fields: [options.field],
			},
		};

		if (options.filter && Object.keys(options.filter).length > 0) {
			panelQuery.query.filter = options.filter;
		}

		if (aggregate) {
			panelQuery.query.aggregate = aggregate;
			delete panelQuery.query.fields;
		}

		return panelQuery;
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		const fieldType = computed(() => {
			return options?.collection && options?.field
				? fieldsStore.getField(options.collection, options.field)?.type
				: null;
		});

		const fieldIsNumber = computed(() =>
			fieldType.value ? ['integer', 'bigInteger', 'float', 'decimal'].includes(fieldType.value) : false
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
					selectedCollection: '',
					hasBeenSelected: false,
					width: 'half',
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
						allowPrimaryKey: true,
						allowNone: true,
					},
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
								disabled: false,
							},
							{
								text: 'Count (Distinct)',
								value: 'countDistinct',
								disabled: false,
							},
							{
								text: 'First',
								value: 'first',
								disabled: false,
							},
							{
								text: 'Last',
								value: 'last',
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
							{
								text: 'Minimum',
								value: 'min',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Maximum',
								value: 'max',
								disabled: !fieldIsNumber.value,
							},
						],
					},
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
						placeholder: '$t:primary_key',
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
						relationalFieldSelectable: false,
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
				field: 'abbreviate',
				type: 'boolean',
				name: '$t:abbreviate_value',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
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
					default_value: 0,
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
									default_value: '>=',
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
												disabled: !fieldIsNumber.value,
											},
											{
												text: '$t:operators.gte',
												value: '>=',
												disabled: !fieldIsNumber.value,
											},
											{
												text: '$t:operators.lt',
												value: '<',
												disabled: !fieldIsNumber.value,
											},
											{
												text: '$t:operators.lte',
												value: '<=',
												disabled: !fieldIsNumber.value,
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
	minWidth: 8,
	minHeight: 6,
});
