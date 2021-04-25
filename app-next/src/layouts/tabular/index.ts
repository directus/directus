import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';

export default defineLayout({
	id: 'tabular',
	name: '$t:layouts.tabular.tabular',
	icon: 'reorder',
	component: TabularLayout,
});
