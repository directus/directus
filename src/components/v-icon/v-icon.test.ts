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

	it('Renders the correct markup for a Material Icon', async () => {
		component.setProps({
			color: '--blue-grey',
			name: 'person'
		});

		await component.vm.$nextTick();

		expect(component.html()).toContain(
			'<span class="v-icon" style="color: currentColor;"><i class="">person</i></span>'
		);
	});

	it('Renders custom icons as inline <svg>', async () => {
		component.setProps({
			name: 'box'
		});

		await component.vm.$nextTick();

		expect(component.contains('svg')).toBe(true);
	});

	it('Allows Hex/RGB/other CSS for color', async () => {
		component.setProps({
			color: 'papayawhip'
		});

		await component.vm.$nextTick();

		expect((component.vm as any).colorStyle).toBe('papayawhip');
	});

	it('Passes custom size as px value', async () => {
		component.setProps({
			size: 120
		});

		await component.vm.$nextTick();

		expect((component.vm as any).customSize).toBe('120px');
	});

	describe('Sizes', () => {
		test('Superscript', async () => {
			component.setProps({
				sup: true,
				xSmall: false,
				small: false,
				large: false,
				xLarge: false
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('sup');
		});

		test('Extra Small', async () => {
			component.setProps({
				sup: false,
				xSmall: true,
				small: false,
				large: false,
				xLarge: false
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('x-small');
		});

		test('Small', async () => {
			component.setProps({
				sup: false,
				xSmall: false,
				small: true,
				large: false,
				xLarge: false
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('small');
		});

		test('Large', async () => {
			component.setProps({
				sup: false,
				xSmall: false,
				small: false,
				large: true,
				xLarge: false
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('large');
		});

		test('Extra Large', async () => {
			component.setProps({
				sup: false,
				xSmall: false,
				small: false,
				large: false,
				xLarge: true
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('x-large');
		});

		it('Uses the smallest size prop provided (sup)', async () => {
			component.setProps({
				sup: true,
				xSmall: false,
				small: true,
				large: false,
				xLarge: true
			});
			await component.vm.$nextTick();
			expect(component.classes()).toContain('sup');
		});
	});

	it('Adds the has-click class if a click event is passed', async () => {
		const component = mount(VIcon, {
			localVue,
			propsData: {
				name: 'person'
			},
			listeners: {
				click: () => {}
			}
		});

		expect(component.classes()).toContain('has-click');
	});

	it('Emits the click event on click of the icon', () => {
		component.find('span').trigger('click');
		expect(component.emitted('click')).toBeTruthy();
	});
});
