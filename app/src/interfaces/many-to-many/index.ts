import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many',
	name: i18n.t('interfaces.many-to-many.many-to-many'),
	description: i18n.t('interfaces.many-to-many.description'),
	icon: 'note_add',
	component: InterfaceManyToMany,
	relationship: 'm2m',
	types: ['alias'],
	options: Options,
	recommendedDisplays: ['related-values'],
}));
