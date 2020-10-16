import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import SidebarDetailGroup from './sidebar-detail-group.vue';
import VItemGroup from '@/components/v-item-group';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VItemGroup);

describe('Views / Private / Sidebar Detail Group', () => {
	it('Resets the opened child details when the sidebar closes', async () => {
		const component = shallowMount(SidebarDetailGroup, {
			localVue,
			propsData: {
				sidebarOpen: true,
			},
		});

		(component.vm as any).openDetail = ['test'];

		component.setProps({ sidebarOpen: false });
		await component.vm.$nextTick();
		expect((component.vm as any).openDetail).toEqual([]);
	});
});
