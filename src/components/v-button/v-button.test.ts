import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import router from '@/router';
import VButton from './v-button.vue';
import VProgressCircular from '../v-progress/circular/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(VueRouter);
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

	it('Adds the full-width class for full-width buttons', () => {
		const component = mount(VButton, {
			localVue,
			propsData: {
				fullWidth: true
			}
		});

		expect(component.classes()).toContain('full-width');
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

	it('Renders as a router-link if the to prop is set', () => {
		const component = mount(VButton, {
			localVue,
			router: router,
			propsData: {
				to: '/'
			}
		});

		expect((component.vm as any).component).toBe('router-link');
	});
});
