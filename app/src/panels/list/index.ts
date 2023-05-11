import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { definePanel, getFieldsFromTemplate } from '@directus/utils';
import PanelList from './panel-list.vue';

export default definePanel({
	id: 'list',
	name: '$t:panels.list.name',
	description: '$t:panels.list.description',
	icon: 'list',
	component: PanelList,
	query(options) {
		if (!options?.collection) return;

		const collectionsStore = useCollectionsStore();
		const collectionInfo = collectionsStore.getCollection(options.collection);

		if (!collectionInfo) return;
		if (collectionInfo?.meta?.singleton) return;

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
				sort: !options.sortDirection || options.sortDirection === 'desc' ? `-${sort}` : sort,
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
				width: 'half',
				options: {
					collectionField: 'collection',
					placeholder: '{{ field }}',
				},
			},
		},
		{
			field: 'linkToItem',
			name: '$t:list_panel_allow_edit',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				required: true,
			},
			schema: {
				default_value: false,
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
	],
	minWidth: 12,
	minHeight: 6,
	skipUndefinedKeys: ['displayTemplate'],
});
