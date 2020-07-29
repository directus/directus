import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import InterfaceIcon from './icon.vue';
import ClickOutside from '@/directives/click-outside/';
import Tooltip from '@/directives/tooltip/tooltip';
import Focus from '@/directives/focus/focus';
import TransitionExpand from '@/components/transition/expand';

import VInput from '@/components/v-input';
import VIcon from '@/components/v-icon';
import VMenu from '@/components/v-menu';
import VDivider from '@/components/v-divider';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);
localVue.component('v-input', VInput);
localVue.component('v-menu', VMenu);
localVue.directive('click-outside', ClickOutside);
localVue.directive('tooltip', Tooltip);
localVue.directive('focus', Focus);
localVue.component('transition-expand', TransitionExpand);
localVue.component('v-divider', VDivider);

describe('Interfaces / Icon', () => {
	it('Renders a v-icon', async () => {
		const component = mount(InterfaceIcon, {
			localVue,
			mocks: {
				$t: jest.fn(),
			},
		});
		expect(component.find(VMenu).exists()).toBe(true);
		component.find(VInput).find('input').setValue('search');
		await component.vm.$nextTick();
		expect(component.find(VIcon).text()).toBe('search');
	});
});
