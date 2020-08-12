import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';
import { types } from '@/types';

export default defineDisplay(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('displays.icon.icon'),
	icon: 'thumb_up',
	handler: DisplayIcon,
	options: [
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'string',
			system: {
				interface: 'icon',
				width: 'half',
			},
		},
	],
	types: types,
}));
