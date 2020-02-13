import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VSpinner from './v-spinner.vue';

describe('Spinner', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => (component = mount(VSpinner, { localVue })));

	it('Renders', () => {
		expect(component.exists()).toBe(true);
	});
});
