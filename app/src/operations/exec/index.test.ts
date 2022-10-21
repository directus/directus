import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cryptoStub } from '@/__utils__/crypto';
vi.stubGlobal('crypto', cryptoStub);

import { useServerStore } from '@/stores/server';

import config from './index';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		})
	);
});

describe('Overview', () => {
	it('Renders empty array', () => {
		expect(config.overview()).toEqual([]);
	});
});

describe('Options', () => {
	it("Doesn't show notice when no modules are allowed", () => {
		expect(config.options()).toHaveLength(1);
	});

	it('Shows notice when modules are allowed', () => {
		const serverStore = useServerStore();

		serverStore.info.flows = {
			execAllowedModules: ['nanoid'],
			execAllowedEnv: [],
		};

		expect(config.options()).toHaveLength(2);
	});

	it('Shows notice when env is allowed', () => {
		const serverStore = useServerStore();

		serverStore.info.flows = {
			execAllowedModules: [],
			execAllowedEnv: ['PUBLIC_URL'],
		};

		expect(config.options()).toHaveLength(2);
	});

	it('Shows notice when modules and env are allowed', () => {
		const serverStore = useServerStore();

		serverStore.info.flows = {
			execAllowedModules: ['nanoid'],
			execAllowedEnv: ['PUBLIC_URL'],
		};

		expect(config.options()).toHaveLength(2);
	});
});
