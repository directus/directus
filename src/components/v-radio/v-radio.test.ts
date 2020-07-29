import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VRadio from './v-radio.vue';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Components / Radio', () => {
	it('Renders', () => {
		const component = shallowMount(VRadio, { localVue, propsData: { value: 'red' } });
		expect(component.isVueInstance()).toBe(true);
	});

	it('Calculates the checked state correctly', async () => {
		const component = shallowMount(VRadio, { localVue, propsData: { value: 'red' } });

		expect((component.vm as any).isChecked).toBe(false);

		component.setProps({
			value: 'red',
			inputValue: 'red',
		});

		await component.vm.$nextTick();

		expect((component.vm as any).isChecked).toBe(true);

		component.setProps({
			value: 'red',
			inputValue: 'blue',
		});

		await component.vm.$nextTick();

		expect((component.vm as any).isChecked).toBe(false);
	});

	it('Uses the right material icon when checked', async () => {
		const component = shallowMount(VRadio, { localVue, propsData: { value: 'red' } });

		expect((component.vm as any).icon).toBe('radio_button_unchecked');

		component.setProps({
			value: 'red',
			inputValue: 'red',
		});

		await component.vm.$nextTick();

		expect((component.vm as any).icon).toBe('radio_button_checked');
	});

	it('Emits the value on click', () => {
		const component = shallowMount(VRadio, { localVue, propsData: { value: 'red' } });

		component.find('button').trigger('click');

		expect(component.emitted('change')?.[0][0]).toBe('red');
	});
});
