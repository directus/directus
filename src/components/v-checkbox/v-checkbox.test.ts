import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VIcon from '../v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

import VCheckbox from './v-checkbox.vue';

describe('Checkbox', () => {
	it('Renders passed label', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				label: 'Turn me on',
			},
		});

		expect(component.find('span[class="label type-text"]').text()).toContain('Turn me on');
	});

	it('Renders as checked when inputValue `true` is given', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				inputValue: true,
			},
		});

		expect((component.vm as any).isChecked).toBe(true);
	});

	it('Calculates check for array inputValue', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['red'],
			},
		});

		expect((component.vm as any).isChecked).toBe(true);
	});

	it('Emits true when state is false', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				inputValue: false,
			},
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted()?.change?.[0][0]).toBe(true);
	});

	it('Disables the button when disabled prop is set', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				disabled: true,
			},
		});

		const button = component.find('button');
		expect(Object.keys(button.attributes())).toContain('disabled');
	});

	it('Appends value to array', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['blue', 'green'],
			},
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted()?.change?.[0][0]).toEqual(['blue', 'green', 'red']);
	});

	it('Removes value from array', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['blue', 'green', 'red'],
			},
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted()?.change?.[0][0]).toEqual(['blue', 'green']);
	});

	it('Renders the correct icon for state', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				inputValue: false,
			},
		});

		expect((component.vm as any).icon).toBe('check_box_outline_blank');

		component.setProps({ inputValue: true });

		expect((component.vm as any).icon).toBe('check_box');

		component.setProps({ indeterminate: true });

		expect((component.vm as any).icon).toBe('indeterminate_check_box');
	});

	it('Emits the update:indeterminate event when the checkbox is toggled when indeterminate', () => {
		const component = mount(VCheckbox, {
			localVue,
			propsData: {
				indeterminate: true,
			},
		});

		component.find('button').trigger('click');

		expect(component.emitted('update:indeterminate')?.[0]).toEqual([false]);
	});
});
