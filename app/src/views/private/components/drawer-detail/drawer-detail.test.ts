import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI, { ref } from '@vue/composition-api';
import DrawerDetail from './drawer-detail.vue';
import * as GroupableComposable from '@/composables/groupable/groupable';
import VIcon from '@/components/v-icon';
import VDivider from '@/components/v-divider';
import TransitionExpand from '@/components/transition/expand';
import VBadge from '@/components/v-badge/';
import { useAppStore } from '@/stores';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);
localVue.component('transition-expand', TransitionExpand);
localVue.component('v-divider', VDivider);
localVue.component('v-badge', VBadge);

describe('Drawer Detail', () => {
	it('Uses the useGroupable composition', () => {
		jest.spyOn(GroupableComposable, 'useGroupable');

		const appStore = useAppStore({});
		appStore.state.drawerOpen = false;

		mount(DrawerDetail, {
			localVue,
			propsData: {
				icon: 'person',
				title: 'Users',
			},
			provide: {
				'item-group': {
					register: () => {},
					unregister: () => {},
					toggle: () => {},
				},
			},
		});
		expect(GroupableComposable.useGroupable).toHaveBeenCalled();
	});

	it('Passes the title prop as selection value', () => {
		jest.spyOn(GroupableComposable, 'useGroupable');

		const appStore = useAppStore({});
		appStore.state.drawerOpen = false;

		mount(DrawerDetail, {
			localVue,
			propsData: {
				icon: 'person',
				title: 'Users',
			},
			provide: {
				'item-group': {
					register: () => {},
					unregister: () => {},
					toggle: () => {},
				},
			},
		});
		expect(GroupableComposable.useGroupable).toHaveBeenCalledWith('Users', 'drawer-detail');
	});
});
