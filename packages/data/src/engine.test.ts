import { randomIdentifier } from '@directus/random';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DataEngine } from './engine.js';
import type { AbstractQuery } from './types/abstract-query.js';
import type { DataDriver } from './types/driver.js';

let engine: DataEngine;

let sample: {
	mockStore: DataDriver;
	mockStoreIdentifier: string;
};

beforeEach(async () => {
	sample = {
		mockStore: {
			query: vi.fn(),
			register: vi.fn(),
			destroy: vi.fn(),
		},
		mockStoreIdentifier: randomIdentifier(),
	};

	engine = new DataEngine();

	await engine.registerStore(sample.mockStoreIdentifier, sample.mockStore);
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
			collection: randomIdentifier(),
			fields: [],
		};

		await engine.query(query);

		expect(sample.mockStore.query).toHaveBeenCalledWith(query);
	});
});

describe('#register', () => {
	test("Calls the driver's optional register function on registration", () => {
		expect(sample.mockStore.register).toHaveBeenCalledWith();
	});
});

describe('#destroy', () => {
	test('Calls destroy on all connected drivers that have a destroy method', async () => {
		await engine.destroy();

		expect(sample.mockStore.destroy).toHaveBeenCalledOnce();
		expect(sample.mockStore.destroy).toHaveBeenCalledWith();
	});
});
