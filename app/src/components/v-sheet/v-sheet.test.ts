import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VSheet from './v-sheet.vue';

describe('Sheet', () => {
	it('Renders the passed slot', async () => {
		const component = mount(VSheet, {
			localVue,
			slots: {
				default: '<div>Hello</div>',
			},
		});

		expect(component.find('.v-sheet > *').html()).toBe('<div>Hello</div>');
	});
});
