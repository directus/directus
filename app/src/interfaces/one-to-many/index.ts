import { defineInterface } from '../define';
import InterfaceOneToMany from './one-to-many.vue';

export default defineInterface(({ i18n }) => ({
	id: 'one-to-many',
	name: i18n.t('one_to_many'),
	icon: 'arrow_right_alt',
	component: InterfaceOneToMany,
	types: ['alias'],
	options: [],
}));
