import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { RouteConfig } from 'vue-router';
import * as router from '@/router';
import moduleRegistration from './register';
import { useExtensionsStore } from '@/stores/extensions';
import { ModuleConfig } from '@/types/extensions';

describe('Modules / Register', () => {
	beforeAll(() => {
		Vue.config.productionTip = false;
		Vue.config.devtools = false;
		Vue.use(VueCompositionAPI);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('Calls replaceRoutes', () => {
		jest.spyOn(router, 'replaceRoutes');
		const testModules: ModuleConfig[] = [
			{
				id: 'test',
				icon: 'box',
				name: 'Test',
				routes: [
					{
						path: '/path'
					}
				]
			}
		];

		moduleRegistration.registerModules(testModules);

		expect(router.replaceRoutes).toHaveBeenCalled();
	});

	it('Adds the modules to the store', () => {
		const extensionsStore = useExtensionsStore({});

		const testModules: ModuleConfig[] = [
			{
				id: 'test',
				icon: 'box',
				name: 'Test',
				routes: [
					{
						path: '/path'
					}
				]
			}
		];

		moduleRegistration.registerModules(testModules);

		expect(extensionsStore.state.modules).toEqual([
			{
				id: 'test',
				icon: 'box',
				name: 'Test'
			}
		]);
	});

	it('Calls the name function if name is a method', () => {
		const testModules: ModuleConfig[] = [
			{
				id: 'test',
				icon: 'box',
				name: jest.fn(),
				routes: [
					{
						path: '/path'
					}
				]
			}
		];

		moduleRegistration.registerModules(testModules);

		expect(testModules[0].name).toHaveBeenCalled();
	});

	it('Calls insertBeforeProjectWildcard on register', () => {
		const spy = jest.spyOn(moduleRegistration, 'insertBeforeProjectWildcard');

		const testModules: ModuleConfig[] = [
			{
				id: 'test',
				icon: 'box',
				name: 'Test',
				routes: [
					{
						path: '/path'
					}
				]
			}
		];

		moduleRegistration.registerModules(testModules);

		expect(moduleRegistration.insertBeforeProjectWildcard).toHaveBeenCalled();

		spy.mockReset();
	});

	it('Calls registerModule for all global modules', () => {
		const spy = jest.spyOn(moduleRegistration, 'registerModules');
		moduleRegistration.registerGlobalModules();
		expect(moduleRegistration.registerModules).toHaveBeenCalled();
	});

	it('Inserts the passed routes into the right location in the routes array', () => {
		const testRoutes: RouteConfig[] = [
			{
				path: '/'
			},
			// Routes should be inserted here
			{
				path: '/:project/*'
			}
		];

		const testModules: RouteConfig[] = [
			{
				path: '/:project/test/path'
			}
		];

		const newRoutes = moduleRegistration.insertBeforeProjectWildcard(testRoutes, testModules);

		expect(newRoutes).toEqual([
			{
				path: '/'
			},
			{
				path: '/:project/test/path'
			},
			{
				path: '/:project/*'
			}
		]);
	});
});
