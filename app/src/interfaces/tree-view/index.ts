import { defineInterface } from '../define';
import InterfaceTreeView from './tree-view.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'tree-view',
	name: '$t:tree_view',
	description: '$t:interfaces.tree-view.description',
	icon: 'account_tree',
	types: ['alias'],
	groups: ['o2m'],
	relational: true,
	component: InterfaceTreeView,
	options: Options,
});
