import { defineLayout } from '@/layouts/define';
import TabularLayout from './tabular.vue';

export default defineLayout(({ i18n }) => ({
	id: 'tabular',
	name: i18n.t('layouts.tabular.tabular'),
	icon: 'reorder',
	component: TabularLayout,
}));
