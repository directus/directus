import { defineInterface } from '../define';
import InterfaceManyToOne from './many-to-one.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-one',
	name: i18n.t('interfaces.many-to-one.many-to-one'),
	description: i18n.t('interfaces.many-to-one.description'),
	icon: 'arrow_right_alt',
	component: InterfaceManyToOne,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relationship: 'm2o',
	options: [
		{
			field: 'template',
			name: i18n.t('interfaces.many-to-one.display_template'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
			},
		},
	],
	recommendedDisplays: ['related-values'],
}));
