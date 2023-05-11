import { useFieldsStore } from '@/stores/fields';
import { definePanel } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import PanelMeter from './panel-meter.vue';

export default definePanel({
	id: 'meter',
	name: '$t:panels.meter.name',
	description: '$t:panels.meter.description',
	icon: 'speed',
	component: PanelMeter,
	query: (options) => {
		if (!options.collection || !options.field || !options.fn) return;

		return {
			collection: options.collection,
			query: {
				aggregate: { [options.fn]: [options.field] },
				filter: options.filter,
			},
		};
	},
	options: ({ options }) => {
		const fieldsStore = useFieldsStore();

		let fieldIsANumber = false;

		if (options && options.collection && options.field) {
			const field = fieldsStore.getField(options.collection, options.field);
			fieldIsANumber = ['integer', 'bigInteger', 'float', 'decimal'].includes(field.type);
		}

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
				field: 'field',
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
				field: 'fn',
				type: 'string',
				name: '$t:function',
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
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:avg',
								value: 'avg',
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:avg_distinct',
								value: 'avgDistinct',
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:sum',
								value: 'sum',
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:sum_distinct',
								value: 'sumDistinct',
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:min',
								value: 'min',
								disabled: !fieldIsANumber,
							},
							{
								text: '$t:max',
								value: 'max',
								disabled: !fieldIsANumber,
							},
						],
					},
				},
			},
			{
				field: 'max',
				name: '$t:max',
				type: 'float',
				meta: {
					width: 'half',
					options: {
						placeholder: '100',
						min: 1,
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
						collectionField: 'collection',
					},
				},
			},

			{
				field: 'size',
				type: 'string',
				name: '$t:size',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{
								value: 'full',
								text: '$t:full_circle',
							},
							{
								value: 'half',
								text: '$t:half_circle',
							},
						],
					},
				},
				schema: {
					default_value: 'full',
				},
			},
			{
				field: 'strokeWidth',
				type: 'integer',
				name: '$t:stroke_width',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{
								text: '$t:thin',
								value: 8,
							},
							{
								text: '$t:medium',
								value: 20,
							},
							{
								text: '$t:broad',
								value: 48,
							},
						],
					},
				},
				schema: {
					default_value: 20,
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
				field: 'roundedStroke',
				name: '$t:rounded_stroke',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
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
