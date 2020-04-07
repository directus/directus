import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import HeaderBar from './header-bar.vue';
import PortalVue from 'portal-vue';

import VButton from '@/components/v-button';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(PortalVue);
localVue.component('v-button', VButton);
localVue.component('v-icon', VIcon);

describe('Views / Private / Header Bar', () => {
	const observeMock = {
		observe: () => null,
		disconnect: () => null, // maybe not needed
	};

	beforeEach(() => {
		(window as any).IntersectionObserver = jest.fn(() => observeMock);
	});

	it('Emits toggle event when toggle buttons are clicked', () => {
		const component = mount(HeaderBar, {
			localVue,
			propsData: {
				title: 'Title',
			},
		});

		const navToggle = component.find('.nav-toggle > .button');
		navToggle.trigger('click');

		expect(component.emitted('toggle:nav')?.[0]).toBeTruthy();

		const drawerToggle = component.find('.drawer-toggle > .button');
		drawerToggle.trigger('click');

		expect(component.emitted('toggle:drawer')?.[0]).toBeTruthy();
	});
});
