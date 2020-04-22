import { defineInterface } from '@/interfaces/define';
import InterfaceDivider from './divider.vue';

export default defineInterface(({ i18n }) => ({
	id: 'divider',
	name: i18n.t('divider'),
	icon: 'remove',
	component: InterfaceDivider,
	hideLabel: true,
	options: [
		{
			field: 'color',
			name: i18n.t('color'),
			width: 'half',
			interface: 'color',
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			width: 'half',
			interface: 'icon',
		},
		{
			field: 'title',
			name: i18n.t('title'),
			width: 'half',
			interface: 'text-input',
		},
	],
}));
