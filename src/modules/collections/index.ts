import Collections from './collections.vue';
import { createModule } from '@/modules/create';

export default createModule({
	id: 'collections',
	register: ({ i18n }) => ({
		name: i18n.tc('collection', 2),
		routes: [
			{
				path: '/',
				component: Collections
			}
		],
		icon: 'box'
	})
});
