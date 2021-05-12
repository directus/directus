import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';

export default defineLayout({
	id: 'product_table',
	name: 'Product Table',
	icon: 'reorder',
	component: TabularLayout,
});
