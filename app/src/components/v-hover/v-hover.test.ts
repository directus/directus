import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VHover from './v-hover.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Hover', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VHover, { localVue });
		jest.useFakeTimers();
	});

	it('Renders the correct element based on tag prop', async () => {
		component.setProps({ tag: 'span' });
		await component.vm.$nextTick();
		expect(component.find('span').exists()).toBe(true);
		component.setProps({ tag: 'section' });
		await component.vm.$nextTick();
		expect(component.find('section').exists()).toBe(true);
	});

	it('Keeps track of the hover state', async () => {
		component.find('div').trigger('mouseenter');
		jest.runAllTimers();
		expect((component.vm as any).hover).toBe(true);

		component.find('div').trigger('mouseleave');
		jest.runAllTimers();
		expect((component.vm as any).hover).toBe(false);
	});

	it('Adds delays to enter/leave based on props', async () => {
		component.setProps({
			openDelay: 300,
			closeDelay: 600,
		});

		component.find('div').trigger('mouseenter');
		expect((component.vm as any).hover).toBe(false);

		jest.advanceTimersByTime(150);

		expect((component.vm as any).hover).toBe(false);

		jest.advanceTimersByTime(200);

		expect((component.vm as any).hover).toBe(true);

		component.find('div').trigger('mouseleave');

		jest.advanceTimersByTime(300);

		expect((component.vm as any).hover).toBe(true);

		jest.advanceTimersByTime(300);

		expect((component.vm as any).hover).toBe(false);
	});

	it("Doesn't do anything if disabled prop is set", async () => {
		component.setProps({ disabled: true });

		expect((component.vm as any).hover).toBe(false);

		component.find('div').trigger('mouseenter');
		jest.runAllTimers();

		expect((component.vm as any).hover).toBe(false);

		component.find('div').trigger('mouseleave');
		jest.runAllTimers();

		expect((component.vm as any).hover).toBe(false);
	});
});
