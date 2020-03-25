import DisplayIcon from './icon.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VIcon from '@/components/v-icon';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Displays / Icon', () => {
	it('Renders the icon component', () => {
		const component = shallowMount(DisplayIcon, {
			localVue,
		});

		expect(component.find(VIcon).exists()).toBe(true);
	});
});
