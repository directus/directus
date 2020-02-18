import Vue from 'vue';
import { registerModule } from './register';
import { ModuleConfig } from './types';
import router from '@/router';

jest.mock('@/router', () => ({
	addRoutes: jest.fn()
}));

describe('Modules / Register', () => {
	beforeEach(() => {
		(router.addRoutes as jest.Mock).mockClear();
	});

	it('Registers the routes in router', () => {
		const mockModule: ModuleConfig = {
			id: 'test-module',
			routes: []
		};
		registerModule(mockModule);
		expect(router.addRoutes).toBeCalledWith([]);
	});
});
