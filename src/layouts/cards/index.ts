import { defineLayout } from '@/layouts/define';
import CardsLayout from './cards.vue';

export default defineLayout(({ i18n }) => ({
	id: 'cards',
	name: i18n.t('layouts.cards.cards'),
	icon: 'view_module',
	component: CardsLayout,
}));
