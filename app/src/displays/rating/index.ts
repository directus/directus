import { defineDisplay } from '@/displays/define';
import DisplayRating from './rating.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'rating',
	name: i18n.t('displays.rating.rating'),
	icon: 'star',
	handler: DisplayRating,
	options: null,
	types: ['integer', 'decimal', 'float'],
}));
