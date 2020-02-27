import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import PrivateView from './private-view.vue';
import VOverlay from '@/components/v-overlay';
import * as windowSize from '@/compositions/window-size';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-overlay', VOverlay);

describe('Views / Private', () => {
	it('Shows nav with overlay if screen is < 960px', async () => {
		jest.spyOn(windowSize, 'default').mockImplementation(() => ({
			width: { value: 600 },
			height: { value: 600 }
		}));

		const component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(true);
	});

	it('Does not render overlay for nav if screen is >= 960px', async () => {
		jest.spyOn(windowSize, 'default').mockImplementation(() => ({
			width: { value: 960 },
			height: { value: 960 }
		}));

		let component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(false);

		(windowSize.default as jest.Mock).mockImplementation(() => ({
			width: { value: 1000 },
			height: { value: 1000 }
		}));

		component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).navWithOverlay).toBe(false);
	});

	it('Shows drawer with overlay if screen is < 1260px', async () => {
		jest.spyOn(windowSize, 'default').mockImplementation(() => ({
			width: { value: 600 },
			height: { value: 600 }
		}));

		const component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(true);
	});

	it('Does not render overlay for drawer if screen is >= 1260px', async () => {
		jest.spyOn(windowSize, 'default').mockImplementation(() => ({
			width: { value: 1260 },
			height: { value: 1260 }
		}));

		let component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(false);

		(windowSize.default as jest.Mock).mockImplementation(() => ({
			width: { value: 1300 },
			height: { value: 1300 }
		}));

		component = shallowMount(PrivateView, { localVue });
		expect((component.vm as any).drawerWithOverlay).toBe(false);
	});
});
