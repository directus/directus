import { describe, expect, test, vi } from 'vitest';
import { StorageManager } from './index.js';

describe('#registerDriver', () => {
	test('Saves registered drivers locally', () => {
		const manager = new StorageManager();
		const mockDriver = vi.fn();
		manager.registerDriver('test-driver', mockDriver);
		expect(manager['drivers'].size).toBe(1);
		expect(manager['drivers'].get('test-driver')).toBe(mockDriver);
	});
});

describe('#registerLocation', () => {
	test('Throws error when registering location with missing driver', () => {
		const manager = new StorageManager();

		expect(() =>
			manager.registerLocation('test-driver', {
				driver: 's3',
				options: {},
			})
		).toThrowErrorMatchingInlineSnapshot('"Driver \\"s3\\" isn\'t registered."');
	});

	test('Instantiates driver instance with passed config', () => {
		const mockDriver = vi.fn();

		const manager = new StorageManager();

		manager.registerDriver('test-driver', mockDriver);

		manager.registerLocation('test-location', {
			driver: 'test-driver',
			options: {
				foo: 'bar',
			},
		});

		expect(mockDriver).toHaveBeenCalledOnce();
		expect(mockDriver).toHaveBeenCalledWith({ foo: 'bar' });
	});

	test('Sets location driver in locations map', () => {
		const mockDriver = vi.fn();

		const manager = new StorageManager();

		manager.registerDriver('test-driver', mockDriver);

		manager.registerLocation('test-location', {
			driver: 'test-driver',
			options: {
				foo: 'bar',
			},
		});

		expect(manager['locations'].size).toBe(1);
		expect(manager['locations'].get('test-location')).toBeInstanceOf(mockDriver);
	});
});

describe('#location', () => {
	test(`Throws error if location is used that wasn't registered`, () => {
		const manager = new StorageManager();
		expect(() => manager.location('missing')).toThrowErrorMatchingInlineSnapshot(
			'"Location \\"missing\\" doesn\'t exist."'
		);
	});

	test('Returns driver instance of registered location', () => {
		const mockDriver = vi.fn();

		const manager = new StorageManager();

		manager.registerDriver('test-driver', mockDriver);

		manager.registerLocation('test-location', {
			driver: 'test-driver',
			options: {
				foo: 'bar',
			},
		});

		const driverInstance = manager.location('test-location');

		expect(driverInstance).toBeInstanceOf(mockDriver);
	});
});
