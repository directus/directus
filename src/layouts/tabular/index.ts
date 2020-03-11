import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';

export default defineLayout({
	id: 'tabular',
	register: ({ i18n }) => ({
		name: i18n.t('layouts.tabular.tabular'),
		icon: 'table',
		component: TabularLayout
	})
});
