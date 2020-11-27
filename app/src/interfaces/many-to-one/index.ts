import { defineInterface } from '../define';
import InterfaceManyToOne from './many-to-one.vue';
import Options from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-one',
	name: i18n.t('interfaces.many-to-one.many-to-one'),
	description: i18n.t('interfaces.many-to-one.description'),
	icon: 'arrow_right_alt',
	component: InterfaceManyToOne,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	groups: ['m2o'],
	options: Options,
	recommendedDisplays: ['related-values'],
}));
