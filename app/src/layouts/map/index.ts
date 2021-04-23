import { defineLayout } from '@/layouts/define';
import MapLayout from './map.vue';

export default defineLayout({
	id: 'map',
	name: '$t:layouts.map.map',
	icon: 'map',
	component: MapLayout,
	smallHeader: true,
});
