import { defineInterface } from '@/interfaces/define';
import InterfaceDivider from './divider.vue';

export default defineInterface(({ i18n }) => ({
	id: 'divider',
	name: i18n.t('divider'),
	icon: 'remove',
	component: InterfaceDivider,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	options: [
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			}
		},
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			}
		},
		{
			field: 'title',
			name: i18n.t('title'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
			}
		},
	],
}));
