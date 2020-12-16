import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many',
	name: i18n.t('interfaces.many-to-many.many-to-many'),
	description: i18n.t('interfaces.many-to-many.description'),
	icon: 'note_add',
	component: InterfaceManyToMany,
	relational: true,
	types: ['alias'],
	groups: ['m2m'],
	options: Options,
	recommendedDisplays: ['related-values'],
}));
