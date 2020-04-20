import InterfaceDivider from './divider.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'divider',
	name: i18n.t('divider'),
	icon: 'remove',
	component: InterfaceDivider,
	options: [
		{
			field: 'color',
			name: i18n.t('color'),
			width: 'half',
			interface: 'text-input',
		},
	],
}));
