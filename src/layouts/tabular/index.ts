import { createLayout } from '@/layouts/create';
import TabularLayout from './tabular.vue';

export default createLayout({
	id: 'tabular',
	register: ({ i18n }) => ({
		name: i18n.t('layouts.tabular.tabular'),
		icon: 'table',
		component: TabularLayout
	})
});
