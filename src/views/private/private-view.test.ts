import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import PrivateView from './private-view.vue';
import VOverlay from '@/components/v-overlay';
import useWindowSize from '@/compositions/window-size';

let mockWidth = 50;

jest.mock('@/compositions/window-size', () =>
	jest.fn().mockImplementation(() => {
		return {
			width: {
				value: mockWidth
			},
			height: {
				value: mockWidth
			}
		};
	})
);

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-overlay', VOverlay);

describe('Views / Private', () => {
	beforeEach(() => {
		(useWindowSize as jest.Mock).mockClear();
	});

	it('Shows nav with overlay if screen is < 960px', async () => {
		mockWidth = 600;
		const component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(true);
	});

	it('Does not render overlay for nav if screen is >= 960px', async () => {
		mockWidth = 960;
		let component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(false);

		mockWidth = 1000;
		component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(false);
	});

	it('Shows drawer with overlay if screen is < 1260px', async () => {
		mockWidth = 600;
		const component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(true);
	});

	it('Does not render overlay for drawer if screen is >= 1260px', async () => {
		mockWidth = 1260;
		let component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(false);

		mockWidth = 1300;
		component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(false);
	});
});
