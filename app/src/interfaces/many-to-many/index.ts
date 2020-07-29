import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many',
	name: i18n.t('many_to_many'),
	icon: 'note_add',
	component: InterfaceManyToMany,
	types: ['alias'],
	options: [],
}));
