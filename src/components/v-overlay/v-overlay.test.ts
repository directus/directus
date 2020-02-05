import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VOverlay from './v-overlay.vue';

describe('Overlay', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VOverlay, {
			localVue
		});
	});

	it('Is invisible when active prop is false', () => {
		expect(component.isVisible()).toBe(false);
	});

	it('Is visible when active is true', async () => {
		component.setProps({ active: true });
		await component.vm.$nextTick();
		expect(component.isVisible()).toBe(true);
	});

	it('Sets position absolute based on absolute prop', async () => {
		component.setProps({ active: true, absolute: true });
		await component.vm.$nextTick();
		expect(component.classes()).toContain('absolute');
	});

	it('Sets the inline styles based on props', async () => {
		component.setProps({
			active: true,
			absolute: true,
			color: '--red',
			zIndex: 50,
			opacity: 0.2
		});
		await component.vm.$nextTick();
		expect((component.vm as any).styles['--_v-overlay-color']).toEqual('var(--red)');
		expect((component.vm as any).styles['--_v-overlay-z-index']).toEqual(50);
		expect((component.vm as any).styles['--_v-overlay-opacity']).toEqual(0.2);
	});

	it('Adds the has-click class when click event is passed', async () => {
		const component = mount(VOverlay, {
			localVue,
			listeners: {
				click: () => {}
			}
		});
		expect(component.classes()).toContain('has-click');
	});

	it('Emits click event', async () => {
		component.find('.v-overlay').trigger('click');
		expect(component.emitted('click')[0]).toBeTruthy();
	});
});
