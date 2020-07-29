import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import DrawerDetailGroup from './drawer-detail-group.vue';
import VItemGroup from '@/components/v-item-group';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VItemGroup);

describe('Views / Private / Drawer Detail Group', () => {
	it('Resets the opened child details when the drawer closes', async () => {
		const component = shallowMount(DrawerDetailGroup, {
			localVue,
			propsData: {
				drawerOpen: true,
			},
		});

		(component.vm as any).openDetail = ['test'];

		component.setProps({ drawerOpen: false });
		await component.vm.$nextTick();
		expect((component.vm as any).openDetail).toEqual([]);
	});
});
