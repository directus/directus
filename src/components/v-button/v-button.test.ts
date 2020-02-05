import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-spinner', VSpinner);

import VButton from './v-button.vue';
import VSpinner from '../v-spinner/';

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

	it('Sets the correct CSS variables for custom colors', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				color: '--red',
				hoverColor: '--blue',
				backgroundColor: '--green',
				hoverBackgroundColor: '--yellow'
			}
		});

		expect((component.vm as any).styles['--_v-button-color']).toBe('var(--red)');
		expect((component.vm as any).styles['--_v-button-hover-color']).toBe('var(--blue)');
		expect((component.vm as any).styles['--_v-button-background-color']).toBe('var(--green)');
		expect((component.vm as any).styles['--_v-button-hover-background-color']).toBe(
			'var(--yellow)'
		);
	});

	describe('Sizes', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				color: '--blue-grey',
				name: 'person'
			}
		});

		test('Extra Small', () => {
			component.setProps({
				xSmall: true,
				small: false,
				large: false,
				xLarge: false
			});
			component.vm.$nextTick(() => expect(component.classes()).toContain('x-small'));
		});

		test('Small', () => {
			component.setProps({
				xSmall: false,
				small: true,
				large: false,
				xLarge: false
			});
			component.vm.$nextTick(() => expect(component.classes()).toContain('small'));
		});

		test('Large', () => {
			component.setProps({
				xSmall: false,
				small: false,
				large: true,
				xLarge: false
			});
			component.vm.$nextTick(() => expect(component.classes()).toContain('large'));
		});

		test('Extra Large', () => {
			component.setProps({
				xSmall: false,
				small: false,
				large: false,
				xLarge: true
			});
			component.vm.$nextTick(() => expect(component.classes()).toContain('x-large'));
		});

		it('Sets the correct custom width', () => {
			const component = mount(VButton, {
				localVue,
				propsData: {
					width: 56
				}
			});

			expect((component.vm as any).styles.width).toBe('56px');
		});
	});
});
