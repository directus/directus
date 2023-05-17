import { defineInterface } from '@directus/utils';
import Options from './options.vue';
import Interface from './table.vue';

export default defineInterface({
	id: 'table',
	name: '$t:interfaces.table.name',
	description: '$t:interfaces.table.description',
	icon: 'table-chart',
	component: Interface,
	types: ['json'],
	options: Options,
});
