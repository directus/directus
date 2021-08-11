import { defineInterface } from '@directus/shared/utils';
import Options from './options.vue';
import InterfaceListO2MTreeView from './list-o2m-tree-view.vue';

export default defineInterface({
	id: 'list-o2m-tree-view',
	name: '$t:tree_view',
	description: '$t:interfaces.list-o2m-tree-view.description',
	icon: 'account_tree',
	types: ['alias'],
	groups: ['o2m'],
	relational: true,
	component: InterfaceListO2MTreeView,
	options: Options,
});
