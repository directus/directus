import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VIcon from '@/components/v-icon/';
import DrawerButton from './drawer-button.vue';
import { useAppStore } from '@/stores';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Views / Private / Components / Drawer Button', () => {
	it('Does not render the title when the drawer is closed', () => {
		const appStore = useAppStore();

		appStore.state.drawerOpen = false;
		const component = shallowMount(DrawerButton, {
			localVue,
		});

		expect(component.find('.title').exists()).toBe(false);
	});
});
