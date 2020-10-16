import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VIcon from '@/components/v-icon/';
import SidebarButton from './sidebar-button.vue';
import { useAppStore } from '@/stores';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Views / Private / Components / Sidebar Button', () => {
	it('Does not render the title when the sidebar is closed', () => {
		const appStore = useAppStore();

		appStore.state.sidebarOpen = false;
		const component = shallowMount(SidebarButton, {
			localVue,
		});

		expect(component.find('.title').exists()).toBe(false);
	});
});
