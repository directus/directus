import { defineInterface } from '../define';
import InterfaceManyToAny from './m2a-builder.vue';

export default defineInterface(({ i18n }) => ({
	id: 'm2a-builder',
	name: i18n.t('m2a_builder'),
	icon: 'note_add',
	component: InterfaceManyToAny,
	relationship: 'm2a',
	types: ['alias'],
	localTypes: ['m2a'],
	options: [],
}));
