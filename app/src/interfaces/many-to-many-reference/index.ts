import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many-reference.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many-reference',
	name: i18n.t('interfaces.many-to-many-reference.many-to-many-reference'),
	description: i18n.t('interfaces.many-to-many-reference.description'),
	icon: 'label_important',
	component: InterfaceManyToMany,
	relationship: 'm2m',
	types: ['alias'],
	localTypes: ['m2m'],
	options: Options,
	recommendedDisplays: ['related-values'],
}));
