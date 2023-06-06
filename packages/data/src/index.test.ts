import { randomAlpha, randomInteger } from '@directus/random';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AbstractQuery, DataDriver } from './index.js';
import { DataEngine } from './index.js';

let engine: DataEngine;

let sample: {
	mockStore: DataDriver;
	mockStoreIdentifier: string;
};

beforeEach(() => {
	sample = {
		mockStore: {
			query: vi.fn(),
			destroy: vi.fn(),
		},
		mockStoreIdentifier: randomAlpha(randomInteger(3, 25)),
	};

	engine = new DataEngine();
	engine.registerStore(sample.mockStoreIdentifier, sample.mockStore);
});

describe('#store', () => {
	test('Retrieves store', () => {
		expect(engine.store(sample.mockStoreIdentifier)).toBe(sample.mockStore);
	});

	test("Throws error when retrieved store name hasn't been registered", () => {
		expect(() => engine.store('unregistered')).toThrowErrorMatchingInlineSnapshot(
			'"Store \\"unregistered\\" doesn\'t exist."'
		);
	});
});

describe('#query', () => {
	test('Passes AbstractQuery to store query method', async () => {
		const query: AbstractQuery = {
			store: sample.mockStoreIdentifier,
			root: true,
			collection: randomAlpha(randomInteger(3, 25)),
			nodes: [],
		};

		await engine.query(query);

		expect(sample.mockStore.query).toHaveBeenCalledWith(query);
	});
});

describe('#destroy', () => {
	test('Calls destroy on all connected drivers that have a destroy method', async () => {
		await engine.destroy();

		expect(sample.mockStore.destroy).toHaveBeenCalledOnce();
		expect(sample.mockStore.destroy).toHaveBeenCalledWith();
	});
});
