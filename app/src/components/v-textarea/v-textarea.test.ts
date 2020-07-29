import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.directive('focus', {});

import VTextarea from './v-textarea.vue';

describe('Textarea', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VTextarea, { localVue });
	});

	it('Sets the correct classes based on props', async () => {
		component.setProps({
			disabled: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.v-textarea').classes()).toEqual(['v-textarea', 'disabled', 'full-width']);
	});

	it('Emits just the value for the input event', async () => {
		const input = component.find('textarea');
		(input.element as HTMLInputElement).value = 'The value';
		input.trigger('input');
		expect(component.emitted('input')?.[0]).toEqual(['The value']);
	});
});
