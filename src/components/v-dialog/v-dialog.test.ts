import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import PortalVue from 'portal-vue';
import VDialog from './v-dialog.vue';
import VOverlay from '@/components/v-overlay';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-overlay', VOverlay);
localVue.use(PortalVue);

describe('Components / Dialog', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	it('Renders', () => {
		const component = shallowMount(VDialog, { localVue });
		expect(component.isVueInstance()).toBe(true);
	});

	it('Calls emit on emitToggle when persistent is false', () => {
		const component = shallowMount(VDialog, {
			localVue,
			propsData: {
				persistent: false,
				active: false,
			},
		});

		(component.vm as any).emitToggle();

		expect(component.emitted('toggle')![0][0]).toBe(true);
	});

	it('Sets and removes the nudge class when persistent is true', () => {
		const component = shallowMount(VDialog, {
			localVue,
			propsData: {
				persistent: true,
				active: false,
			},
		});

		(component.vm as any).emitToggle();

		expect(component.emitted('toggle')).toBe(undefined);
		expect((component.vm as any).className).toBe('nudge');
	});

	it('Adds the nudge class', () => {
		const component = shallowMount(VDialog, {
			localVue,
		});

		(component.vm as any).nudge();

		expect((component.vm as any).className).toBe('nudge');

		jest.advanceTimersByTime(250);

		expect((component.vm as any).className).toBe(null);
	});
});
