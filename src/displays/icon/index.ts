import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('displays.icon.icon'),
	icon: 'box',
	handler: DisplayIcon,
}));
