import type { ApiExtension, HookConfig } from '@directus/types';
import { afterEach, expect, test, vi } from 'vitest';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { importFileUrl } from '../utils/import-file-url.js';
import { ExtensionManager } from './manager.js';

vi.mock('../database/index.js', () => ({ default: vi.fn() }));
vi.mock('../utils/import-file-url.js', () => ({ importFileUrl: vi.fn() }));

afterEach(() => {
	emitter.offAll();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

test('emits extensions.unload to hooks before unregistering their listeners', async () => {
	const manager = new ExtensionManager();
	const onUnload = vi.fn();

	const hook: ApiExtension = {
		name: 'unload-hook',
		type: 'hook',
		path: '/extensions/unload-hook',
		entrypoint: 'index.js',
		local: true,
	};

	const register: HookConfig = ({ action }) => {
		action('extensions.unload', onUnload);
	};

	vi.mocked(importFileUrl).mockResolvedValue(register);

	manager['localExtensions'].set(hook.name, hook);
	await manager['registerHookExtension'](hook);

	expect(emitter.countActionListeners('extensions.unload')).toBe(1);

	await manager['unload']();

	expect(onUnload).toHaveBeenCalledExactlyOnceWith(
		{ event: 'extensions.unload', extensions: [hook] },
		expect.anything(),
	);

	expect(emitter.countActionListeners('extensions.unload')).toBe(0);
});

test('unregisters hooks when an extensions.unload handler throws synchronously', async () => {
	const manager = new ExtensionManager();
	const error = new Error('Unload failed');
	const warn = vi.spyOn(useLogger(), 'warn').mockImplementation(() => {});

	const onUnload = vi.fn(() => {
		throw error;
	});

	const hook: ApiExtension = {
		name: 'unload-hook',
		type: 'hook',
		path: '/extensions/unload-hook',
		entrypoint: 'index.js',
		local: true,
	};

	const register: HookConfig = ({ action }) => {
		action('extensions.unload', onUnload);
	};

	vi.mocked(importFileUrl).mockResolvedValue(register);

	manager['isLoaded'] = true;
	await manager['registerHookExtension'](hook);

	expect(emitter.countActionListeners('extensions.unload')).toBe(1);

	await manager['unload']();

	expect(onUnload).toHaveBeenCalledOnce();
	expect(emitter.countActionListeners('extensions.unload')).toBe(0);
	expect(manager['isLoaded']).toBe(false);
	expect(warn).toHaveBeenCalledWith(error);
});
