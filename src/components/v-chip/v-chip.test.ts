import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VChip from './v-chip.vue';
import VIcon from '@/components/v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Chip', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VChip, { localVue });
	});

	it('Renders the provided markup in the default slow', () => {
		const component = mount(VChip, {
			localVue,
			slots: {
				default: 'Click me',
			},
		});

		expect(component.text()).toContain('Click me');
	});

	it('Hides the whole component', async () => {
		component.setProps({
			active: false,
		});

		await component.vm.$nextTick();

		expect(component.find('span').exists()).toBe(false);
	});

	it('Adds the outline class for outline chips', async () => {
		component.setProps({
			outlined: true,
		});

		await component.vm.$nextTick();

		expect(component.classes()).toContain('outlined');
	});

	it('Adds the label class for block chips', async () => {
		component.setProps({
			label: true,
		});

		await component.vm.$nextTick();

		expect(component.classes()).toContain('label');
	});

	it('Adds the close icon for icon chips', async () => {
		component.setProps({
			close: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.close-outline').exists()).toBe(true);
	});

	it('Emits a click event when chip is not disabled', async () => {
		component.setProps({
			disabled: false,
		});

		await component.vm.$nextTick();

		(component.vm as any).onClick(new Event('click'));

		expect(component.emitted('click')?.[0][0]).toBeInstanceOf(Event);
	});

	it('Does not emit click when disabled', async () => {
		component.setProps({
			disabled: true,
		});

		await component.vm.$nextTick();

		(component.vm as any).onClick(new Event('click'));

		expect(component.emitted('click')).toBe(undefined);
	});

	it('Emits a click event when chip is not disabled and close button is clicked', async () => {
		component.setProps({
			disabled: false,
		});

		await component.vm.$nextTick();

		(component.vm as any).onCloseClick(new Event('click'));

		expect(component.emitted('close')?.[0][0]).toBeInstanceOf(Event);
	});

	it('Does not emit click when disabled and close button is clicked', async () => {
		component.setProps({
			disabled: true,
		});

		await component.vm.$nextTick();

		(component.vm as any).onCloseClick(new Event('click'));

		expect(component.emitted('click')).toBe(undefined);
	});
});
