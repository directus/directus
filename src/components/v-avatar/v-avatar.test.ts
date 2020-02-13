import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VAvatar from './v-avatar.vue';

describe('Avatar', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => (component = mount(VAvatar, { localVue })));

	it('Sets the tile class if tile prop is passed', async () => {
		component.setProps({ tile: true });
		await component.vm.$nextTick();
		expect(component.classes()).toContain('tile');
	});

	describe('Sizes', () => {
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
	});
});
