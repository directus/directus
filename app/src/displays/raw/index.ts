import { defineDisplay } from '@/displays/define';
import { types } from '@/types';

export default defineDisplay(({ i18n }) => ({
	id: 'raw',
	name: i18n.t('displays.raw.raw'),
	icon: 'code',
	handler: (value) => value,
	options: [],
	types: types,
}));
