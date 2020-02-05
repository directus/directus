import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VSpinner from './v-spinner.vue';

describe('Spinner', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => (component = mount(VSpinner, { localVue })));

	describe('Styles', () => {
		test('Color', async () => {
			component.setProps({ color: '--red' });
			await component.vm.$nextTick();
			expect((component.vm as any).styles['--_v-spinner-color']).toBe('var(--red)');
		});

		test('Background Color', async () => {
			component.setProps({ backgroundColor: '--red' });
			await component.vm.$nextTick();
			expect((component.vm as any).styles['--_v-spinner-background-color']).toBe(
				'var(--red)'
			);
		});

		test('Size', async () => {
			component.setProps({ size: 58 });
			await component.vm.$nextTick();
			expect((component.vm as any).styles['--_v-spinner-size']).toBe('58px');
		});

		test('Line Size', async () => {
			component.setProps({ lineSize: 24 });
			await component.vm.$nextTick();
			expect((component.vm as any).styles['--_v-spinner-line-size']).toBe('24px');
		});

		test('Speed', async () => {
			component.setProps({ speed: '5s' });
			await component.vm.$nextTick();
			expect((component.vm as any).styles['--_v-spinner-speed']).toBe('5s');
		});
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

		it('Uses the smallest size prop provided (small)', () => {
			component.setProps({
				xSmall: false,
				small: true,
				large: false,
				xLarge: true
			});
			component.vm.$nextTick(() => expect(component.classes()).toContain('small'));
		});
	});
});
