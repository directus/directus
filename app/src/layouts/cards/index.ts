import { defineLayout } from '@/layouts/define';
import CardsLayout from './cards.vue';

export default defineLayout({
	id: 'cards',
	name: '$t:layouts.cards.cards',
	icon: 'grid_4',
	component: CardsLayout,
});
