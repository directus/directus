import { defineInterface } from '../define';
import InterfaceManyToManyReferences from './many-to-many-references.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many-reference',
	name: i18n.t('interfaces.many-to-many-references.many-to-many-references'),
	description: i18n.t('interfaces.many-to-many-references.description'),
	icon: 'local_offer',
	component: InterfaceManyToManyReferences,
	relational: true,
	types: ['alias'],
	groups: ['m2m'],
	options: Options,
	recommendedDisplays: ['related-values'],
}));
