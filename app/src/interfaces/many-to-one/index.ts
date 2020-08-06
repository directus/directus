import { defineInterface } from '../define';
import InterfaceManyToOne from './many-to-one.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-one',
	name: i18n.t('many_to_one'),
	icon: 'arrow_right_alt',
	component: InterfaceManyToOne,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relationship: 'm2o',
	options: [
		{
			field: 'template',
			name: i18n.t('display_template'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
			}
		},
	],
}));
