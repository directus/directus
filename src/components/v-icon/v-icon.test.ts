import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VIcon from './v-icon.vue';

describe('Icon', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VIcon, { localVue, propsData: { name: 'person' } });
	});

	it('Renders custom icons as inline <svg>', async () => {
		component.setProps({
			name: 'box',
		});

		await component.vm.$nextTick();

		expect(component.contains('svg')).toBe(true);
	});

	it('Supports superscript size class', async () => {
		component.setProps({
			sup: true,
			xSmall: false,
			small: false,
			large: false,
			xLarge: false,
		});
		await component.vm.$nextTick();
		expect(component.classes()).toContain('sup');
	});

	it('Adds the has-click class if a click event is passed', async () => {
		const component = mount(VIcon, {
			localVue,
			propsData: {
				name: 'person',
			},
			listeners: {
				click: () => {},
			},
		});

		expect(component.classes()).toContain('has-click');
	});

	it('Sets the left / right classes if props are given', async () => {
		component.setProps({
			left: true,
		});
		await component.vm.$nextTick();
		expect(component.classes()).toContain('left');

		component.setProps({
			left: false,
			right: true,
		});
		await component.vm.$nextTick();
		expect(component.classes()).toContain('right');
	});

	it('Emits the click event on click of the icon', () => {
		component.find('span').trigger('click');
		expect(component.emitted('click')).toBeTruthy();
	});
});
