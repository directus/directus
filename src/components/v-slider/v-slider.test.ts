import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VSlider from './v-slider.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Slider', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VSlider, { localVue });
	});

	it('Calculates the correct percentage based on props/value', async () => {
		component.setProps({
			min: 5,
			max: 25,
			value: 10,
		});

		await component.vm.$nextTick();

		expect((component.vm as any).styles['--_v-slider-percentage']).toEqual(25);
	});

	it('Emits just the value on input', async () => {
		const input = component.find('input');
		(input.element as HTMLInputElement).value = '500';
		input.trigger('input');

		expect(component.emitted('input')?.[0]).toEqual([500]);
	});

	it('Emits just the value on change', async () => {
		const input = component.find('input');
		(input.element as HTMLInputElement).value = '500';
		input.trigger('change');

		expect(component.emitted('change')?.[0]).toEqual([500]);
	});

	it('Renders the prepend/append slots', async () => {
		const component = mount(VSlider, {
			localVue,
			slots: {
				prepend: '<div>prepend</div>',
				append: '<div>append</div>',
			},
		});

		expect(component.find('.prepend > div').html()).toBe('<div>prepend</div>');
		expect(component.find('.append > div').html()).toBe('<div>append</div>');
	});
});
