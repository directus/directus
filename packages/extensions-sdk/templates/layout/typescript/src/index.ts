import { ref } from 'vue';
import { defineLayout } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';

export default defineLayout({
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	component: LayoutComponent,
	slots: {
		options: () => null,
		sidebar: () => null,
		actions: () => null,
	},
	setup(props) {
		const name = ref('Custom layout state');

		return { name };
	},
});
