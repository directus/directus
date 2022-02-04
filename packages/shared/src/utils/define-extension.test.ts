import {
	defineInterface,
	defineDisplay,
	defineModule,
	defineLayout,
	defineHook,
	defineEndpoint,
} from './define-extension';
import { Type } from '../types/fields';
import { defineComponent } from 'vue';

const mockComponent = defineComponent({});
const mockHandler = () => {
	return '';
};
describe('define-extensions', () => {
	const types = [] as readonly Type[];
	const mockRecord = () => {
		return { test: 'test' };
	};
	const interfaceConfig = { id: '1', name: 'test', icon: 'icon', component: mockComponent, types: types, options: {} };
	const displayConfig = { id: '1', name: 'test', icon: 'icon', component: mockComponent, types: types, options: {} };
	const layoutConfig = {
		id: '1',
		name: 'test',
		icon: 'icon',
		component: mockComponent,
		slots: { options: mockComponent, sidebar: mockComponent, actions: mockComponent },
		setup: mockRecord,
	};
	const moduleConfig = {
		id: '1',
		name: 'test',
		icon: 'icon',
		routes: [],
	};
	const hookHandler = () => {
		return { test: (..._values: any[]) => undefined };
	};
	const endpointConfig = { id: '1', handler: mockHandler };

	it('return an interface config', () => {
		expect(defineInterface(interfaceConfig)).toBe(interfaceConfig);
	});

	it('return a display config', () => {
		expect(defineDisplay(displayConfig)).toBe(displayConfig);
	});

	it('return a layout config', () => {
		expect(defineLayout(layoutConfig)).toBe(layoutConfig);
	});

	it('return a module config', () => {
		expect(defineModule(moduleConfig)).toBe(moduleConfig);
	});

	it('return a hook config', () => {
		expect(defineHook(hookHandler)).toBe(hookHandler);
	});

	it('return an endpoint config', () => {
		expect(defineEndpoint(endpointConfig)).toBe(endpointConfig);
	});
});
