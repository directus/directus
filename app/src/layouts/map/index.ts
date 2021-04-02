import { defineLayout } from '@/layouts/define';
import MapLayout from './maps.vue';

export default defineLayout(({ i18n }) => ({
	id: 'map',
	name: i18n.t('layouts.map.map'),
	icon: 'map',
	component: MapLayout,
	smallHeader: true,
}));
