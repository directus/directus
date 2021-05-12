import { defineInterface } from '@/interfaces/define';
import Interface from './interface.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'many-to-one-dropdown',
	name: 'Many To One Dropdown',
	description: 'My Custom Interface!',
	icon: 'box',
	component: Interface,
	options: Options,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	groups: ['m2o'],
});
