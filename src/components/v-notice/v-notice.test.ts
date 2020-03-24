import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VNotice from './v-notice.vue';
import VIcon from '@/components/v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Notice', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VNotice, {
			localVue,
			slots: {
				default: 'I like pizza',
			},
		});
	});

	it('Renders the default slot in the notice', () => {
		expect(component.text()).toContain('I like pizza');
	});

	it('Uses the right color / icon combo for success', async () => {
		component.setProps({
			success: true,
		});

		await component.vm.$nextTick();

		expect(component.classes()).toContain('success');
		expect((component.vm as any).iconName).toBe('check_circle');
	});

	it('Uses the right color / icon combo for warning', async () => {
		component.setProps({
			warning: true,
		});

		await component.vm.$nextTick();

		expect(component.classes()).toContain('warning');
		expect((component.vm as any).iconName).toBe('warning');
	});

	it('Uses the right color / icon combo for danger', async () => {
		component.setProps({
			danger: true,
		});

		await component.vm.$nextTick();

		expect(component.classes()).toContain('danger');
		expect((component.vm as any).iconName).toBe('error');
	});

	it('Defaults to success if all props are given', async () => {
		component.setProps({
			success: true,
			warning: true,
			danger: true,
		});

		await component.vm.$nextTick();

		expect((component.vm as any).iconName).toBe('check_circle');
		expect(component.classes()).toContain('success');
	});

	it('Allows setting a custom icon', async () => {
		component.setProps({
			icon: 'person',
		});
		await component.vm.$nextTick();
		expect((component.vm as any).iconName).toBe('person');
	});
});
