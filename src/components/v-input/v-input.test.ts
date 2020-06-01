import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.directive('focus', {});

import VInput from './v-input.vue';

describe('Input', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VInput, { localVue });
	});

	it('Renders content in the correct slots', async () => {
		component = mount(VInput, {
			localVue,
			slots: {
				'prepend-outer': '<div>prepend-outer</div>',
				prepend: '<div>prepend</div>',
				append: '<div>append</div>',
				'append-outer': '<div>append-outer</div>',
			},
		});

		expect(component.find('.v-input > .prepend-outer > div ').html()).toBe('<div>prepend-outer</div>');
		expect(component.find('.v-input > .append-outer > div ').html()).toBe('<div>append-outer</div>');
		expect(component.find('.v-input > .input > .prepend > div ').html()).toBe('<div>prepend</div>');
		expect(component.find('.v-input > .input > .append > div ').html()).toBe('<div>append</div>');
	});

	it('Renders prefix / suffix', async () => {
		component.setProps({
			prefix: 'Prefix',
			suffix: 'Suffix',
		});

		await component.vm.$nextTick();

		expect(component.find('.input .prefix').html()).toBe('<span class="prefix">Prefix</span>');
		expect(component.find('.input .suffix').html()).toBe('<span class="suffix">Suffix</span>');
	});

	it('Sets the correct classes based on props', async () => {
		component.setProps({
			disabled: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.input').classes()).toEqual(['input', 'disabled']);
	});

	it('Emits just the value for the input event', async () => {
		const input = component.find('input');
		(input.element as HTMLInputElement).value = 'The value';
		input.trigger('input');
		expect(component.emitted('input')?.[0]).toEqual(['The value']);
	});
});
