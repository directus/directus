import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { LayoutConfig } from '@/types/extensions';
import layoutRegistration from './register';
import * as registerUtil from '@/utils/register-component';
import { useExtensionsStore } from '@/stores/extensions';

describe('Layouts / Register', () => {
	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
	});

	it('Calls registerComponent util', () => {
		jest.spyOn(registerUtil, 'registerComponent');

		const testLayout: LayoutConfig = {
			id: 'test',
			name: 'Test',
			icon: 'test',
			component: {
				render(h) {
					return h('div');
				}
			}
		};

		layoutRegistration.registerLayout(testLayout);

		expect(registerUtil.registerComponent).toHaveBeenCalledWith(
			'layout-test',
			testLayout.component
		);
	});

	it('Adds the layout to the extensions store', () => {
		const extensionsStore = useExtensionsStore({});
		extensionsStore.state.layouts = [];

		const testLayout: LayoutConfig = {
			id: 'test',
			name: 'Test',
			icon: 'test',
			component: {
				render(h) {
					return h('div');
				}
			}
		};

		layoutRegistration.registerLayout(testLayout);

		expect(extensionsStore.state.layouts).toEqual([
			{
				id: 'test',
				name: 'Test',
				icon: 'test'
			}
		]);
	});

	it('Calls the name function if its a method', () => {
		const testLayout: LayoutConfig = {
			id: 'test',
			name: jest.fn(),
			icon: 'test',
			component: {
				render(h) {
					return h('div');
				}
			}
		};

		layoutRegistration.registerLayout(testLayout);
		expect(testLayout.name).toHaveBeenCalled();
	});

	it('Registers all global layouts', () => {
		jest.spyOn(layoutRegistration, 'registerLayout');
		layoutRegistration.registerGlobalLayouts();
		expect(layoutRegistration.registerLayout).toHaveBeenCalled();
	});
});
