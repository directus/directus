import { useFieldsStore } from '@/stores';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { definePanel, getFieldsFromTemplate } from '@directus/shared/utils';
import PanelList from './panel-list.vue';

export default definePanel({
	id: 'list',
	name: '$t:panels.list.name',
	description: '$t:panels.list.description',
	icon: 'list',
	component: PanelList,
	query(options) {
		if (!options?.collection) return;

		const fieldsStore = useFieldsStore();
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(options.collection);
		const displayFields = [primaryKeyField!.field];

		const sort = options.sortField ?? primaryKeyField?.field;

		if (options.displayTemplate) {
			displayFields.push(
				...adjustFieldsForDisplays(getFieldsFromTemplate(options.displayTemplate), options.collection)
			);
		}

		return {
			collection: options.collection,
			query: {
				filter: options.filter ?? {},
				fields: displayFields,
				sort: options.sortDirection === 'desc' ? `-${sort}` : sort,
				limit: options.limit === undefined ? 5 : options.limit,
			},
		};
	},
	options: [
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
			field: 'displayTemplate',
			name: '$t:display_template',
			type: 'string',
			meta: {
				interface: 'system-display-template',
				width: 'full',
				options: {
					collectionField: 'collection',
					placeholder: '{{ field }}',
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
	],
	minWidth: 12,
	minHeight: 6,
	skipUndefinedKeys: ['displayTemplate'],
});
