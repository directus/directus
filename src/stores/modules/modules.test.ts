import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import router from '@/router';
import { useModulesStore } from './modules';
import { ModuleConfig } from '@/types/modules';
import systemModules from '@/modules/';
jest.mock('@/modules/', () => [
	{
		id: 'system-test-1',
		icon: 'box',
		name: 'System Module 1',
		routes: []
	},
	{
		id: 'system-test-2',
		icon: 'box',
		name: 'System Module 2',
		routes: []
	}
]);

describe('Stores / Modules', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	describe('registerModule', () => {
		it('Prefixes each route path with /:project/:module/', () => {
			jest.spyOn(router, 'addRoutes');
			const modulesStore = useModulesStore({});
			const testModule: ModuleConfig = {
				id: 'test-module',
				icon: 'box',
				name: 'Test Module',
				routes: [
					{
						path: '/test'
					}
				]
			};

			modulesStore.registerModule(testModule);
			expect(router.addRoutes).toHaveBeenCalledWith([
				{
					path: '/:project/test-module/test'
				}
			]);
		});

		it('Adds the routes when registering the module', () => {
			jest.spyOn(router, 'addRoutes');
			const modulesStore = useModulesStore({});
			const testModule: ModuleConfig = {
				id: 'test-module',
				icon: 'box',
				name: 'Test Module',
				routes: []
			};
			modulesStore.registerModule(testModule);
			expect(router.addRoutes).toHaveBeenCalledWith([]);
		});

		it('Adds the module to the store if registration is completed', () => {
			jest.spyOn(router, 'addRoutes');
			const modulesStore = useModulesStore({});
			const testModule: ModuleConfig = {
				id: 'test-module',
				icon: 'box',
				name: 'Test Module',
				routes: []
			};
			modulesStore.registerModule(testModule);
			expect(modulesStore.state.modules).toEqual([
				{
					id: 'test-module',
					icon: 'box',
					name: 'Test Module'
				}
			]);
		});

		it('Uses the static name, or calls the function if method is given for name', () => {
			jest.spyOn(router, 'addRoutes');
			const modulesStore = useModulesStore({});
			const testModule: ModuleConfig = {
				id: 'test-module',
				icon: 'box',
				name: jest.fn(),
				routes: []
			};
			modulesStore.registerModule(testModule);
			expect(testModule.name).toHaveBeenCalled();
		});
	});

	describe('registerGlobalModules', () => {
		it('Calls registerModule for each global module', () => {
			const modulesStore = useModulesStore({});
			modulesStore.registerModule = jest.fn();
			modulesStore.registerGlobalModules();
			expect(modulesStore.registerModule).toHaveBeenCalledTimes(2);
		});
	});
});
