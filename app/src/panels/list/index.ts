import { definePanel } from '@directus/shared/utils';
import PanelList from './list.vue';

export default definePanel({
	id: 'list',
	name: '$t:panels.list.name',
	description: '$t:panels.list.description',
	icon: 'list',
	component: PanelList,
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
});
