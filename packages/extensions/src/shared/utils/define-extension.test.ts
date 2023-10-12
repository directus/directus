import type { Type } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import {
	defineDisplay,
	defineEndpoint,
	defineHook,
	defineInterface,
	defineLayout,
	defineModule,
	defineOperationApi,
	defineOperationApp,
	definePanel,
} from './define-extension.js';

const mockComponent = defineComponent({});

const mockHandler = () => {
	return '';
};

describe('define-extensions', () => {
	const types = [] as readonly Type[];

	const mockRecord = () => {
		return { test: 'test' };
	};

	const interfaceConfig = {
		id: '1',
		name: 'test',
		icon: 'icon',
		component: mockComponent,
		types: types,
		options: null,
	};

	const displayConfig = { id: '1', name: 'test', icon: 'icon', component: mockComponent, types: types, options: null };

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

	const panelConfig = {
		id: '1',
		name: 'test',
		icon: 'icon',
		component: mockComponent,
		options: null,
		minWidth: 2,
		minHeight: 2,
	};

	const hookHandler = () => {
		return { test: (..._values: any[]) => undefined };
	};

	const endpointConfig = { id: '1', handler: mockHandler };

	const operationAppConfig = {
		id: '1',
		name: 'test',
		icon: 'icon',
		overview: null,
		options: null,
	};

	const operationApiConfig = {
		id: '1',
		handler: mockHandler,
	};

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

	it('return a panel config', () => {
		expect(definePanel(panelConfig)).toBe(panelConfig);
	});

	it('return a hook config', () => {
		expect(defineHook(hookHandler)).toBe(hookHandler);
	});

	it('return an endpoint config', () => {
		expect(defineEndpoint(endpointConfig)).toBe(endpointConfig);
	});

	it('return an operation App config', () => {
		expect(defineOperationApp(operationAppConfig)).toBe(operationAppConfig);
	});

	it('return an operation API config', () => {
		expect(defineOperationApi(operationApiConfig)).toBe(operationApiConfig);
	});
});
