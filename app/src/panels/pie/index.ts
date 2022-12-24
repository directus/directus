import { useCollectionsStore } from '@/stores/collections';
import { Filter } from '@directus/shared/types';
import { definePanel } from '@directus/shared/utils';
import PanelPie from './panel-pie.vue';

export default definePanel({
	id: 'pie',
	name: '$t:panels.piechart.name',
	description: '$t:panels.piechart.description',
	icon: 'pie_chart',
	query(options) {
		if (!options?.groupField || !options?.function || !options?.aggregationField) {
			return;
		}

		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(options.collection);

		if (!collectionInfo) return;
		if (collectionInfo?.meta?.singleton) return;

		const filter: Filter = {
			_and: [getParsedOptionsFilter(options.filter)],
		};

		return {
			collection: options.collection,
			query: {
				group: options.groupField,
				aggregate: {
					[options.function]: [options.aggregationField],
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
	component: PanelPie,
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
			field: 'groupField',
			type: 'string',
			name: '$t:panels.piechart.group_field',
			meta: {
				interface: 'system-field',
				width: 'half',
				options: {
					allowForeignKeys: true,
					collectionField: 'collection',
					typeAllowList: ['integer', 'bigInteger', 'uuid', 'string', 'boolean'],
				},
			},
		},
		{
			field: 'aggregationField',
			type: 'string',
			name: '$t:panels.piechart.aggregation_field',
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
			field: 'showPercentage',
			type: 'boolean',
			name: '$t:panels.piechart.show_percentage',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
			schema: {
				default_value: false,
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
			field: 'shadeIntensity',
			name: '$t:panels.piechart.shade_intensity',
			type: 'float',
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					min: 0,
					max: 1,
					placeholder: '0.35',
				},
			},
		},
	],
	minWidth: 12,
	minHeight: 12,
});
