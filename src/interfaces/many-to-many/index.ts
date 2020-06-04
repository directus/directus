import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many',
	name: i18n.t('many-to-many'),
	icon: 'note_add',
	component: InterfaceManyToMany,
	options: [],
}));
