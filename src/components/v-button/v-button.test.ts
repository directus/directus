import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VButton from './v-button.vue';
import VProgressCircular from '../v-progress/circular/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-progress-circular', VProgressCircular);

describe('Button', () => {
	it('Renders the provided markup in the default slow', () => {
		const component = mount(VButton, {
			localVue,
			slots: {
				default: 'Click me'
			}
		});

		expect(component.text()).toContain('Click me');
	});

	it('Adds the outline class for outline buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				outlined: true
			}
		});

		expect(component.classes()).toContain('outlined');
	});

	it('Adds the block class for block buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				block: true
			}
		});

		expect(component.classes()).toContain('block');
	});

	it('Adds the rounded class for rounded buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				rounded: true
			}
		});

		expect(component.classes()).toContain('rounded');
	});

	it('Adds the icon class for icon buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				icon: true
			}
		});

		expect(component.classes()).toContain('icon');
	});

	it('Adds the loading class for loading buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				loading: true
			}
		});

		expect(component.classes()).toContain('loading');
	});

	it('Emits the click event on click of the button', () => {
		const component = mount(VButton, {
			localVue
		});

		component.find('button').trigger('click');
		expect(component.emitted('click')).toBeTruthy();
	});

	it('Does not emit click event on disabled button', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				disabled: true
			}
		});

		component.find('button').trigger('click');
		expect(component.emitted()).toEqual({});
	});

	it('Does not emit click event on loading button', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				loading: true
			}
		});

		component.find('button').trigger('click');
		expect(component.emitted()).toEqual({});
	});
});
