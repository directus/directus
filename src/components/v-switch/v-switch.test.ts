import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VSwitch from './v-switch.vue';

describe('Switch', () => {
	it('Renders passed label', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				label: 'Turn me on'
			}
		});

		expect(component.find('span[class="label"]').text()).toContain('Turn me on');
	});

	it('Uses the correct inline styles for custom colors', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				color: '#123123'
			}
		});

		expect((component.vm as any).colorStyle['--_v-switch-color']).toBe('#123123');
	});

	it('Renders as checked when inputValue `true` is given', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				inputValue: true
			}
		});

		expect((component.vm as any).isChecked).toBe(true);
	});

	it('Calculates check for array inputValue', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['red']
			}
		});

		expect((component.vm as any).isChecked).toBe(true);
	});

	it('Emits true when state is false', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				inputValue: false
			}
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted().change[0][0]).toBe(true);
	});

	it('Disables the button when disabled prop is set', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				disabled: true
			}
		});

		const button = component.find('button');
		expect(Object.keys(button.attributes())).toContain('disabled');
	});

	it('Appends value to array', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['blue', 'green']
			}
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted().change[0][0]).toEqual(['blue', 'green', 'red']);
	});

	it('Removes value from array', () => {
		const component = mount(VSwitch, {
			localVue,
			propsData: {
				value: 'red',
				inputValue: ['blue', 'green', 'red']
			}
		});

		const button = component.find('button');
		button.trigger('click');

		expect(component.emitted().change[0][0]).toEqual(['blue', 'green']);
	});
});
