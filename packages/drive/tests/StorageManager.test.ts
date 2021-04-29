/**
 * @slynova/flydrive
 *
 * @license MIT
 * @copyright Slynova - Romain Lanz <romain.lanz@slynova.ch>
 */

import Storage from '../src/Storage';
import StorageManager from '../src/StorageManager';
import { LocalFileSystemStorage } from '../src/LocalFileSystemStorage';

describe('Storage Manager', () => {
	it('throw exception when no disk name is defined', () => {
		const storageManager = new StorageManager({});
		const fn = (): Storage => storageManager.disk();
		expect(fn).toThrow('E_INVALID_CONFIG: Make sure to define a default disk name inside config file');
	});

	it('throw exception when disk config is missing', () => {
		const storageManager = new StorageManager({
			default: 'local',
		});
		const fn = (): Storage => storageManager.disk();

		expect(fn).toThrow('E_INVALID_CONFIG: Make sure to define config for local disk');
	});

	it('throw exception when disk config doesnt have driver', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				// @ts-expect-error No driver
				local: {},
			},
		});
		const fn = (): Storage => storageManager.disk();

		expect(fn).toThrow('E_INVALID_CONFIG: Make sure to define driver for local disk');
	});

	it('throw exception when driver is invalid', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'foo',
					config: {
						root: '',
					},
				},
			},
		});
		const fn = (): Storage => storageManager.disk();

		expect(fn).toThrow('Driver foo is not supported');
	});

	it('return storage instance for a given driver', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
			},
		});
		const localDriver = storageManager.disk('local');
		const localDriver2 = storageManager.disk('local');

		expect(localDriver).toBe(localDriver2);

		expect(localDriver).toBeInstanceOf(LocalFileSystemStorage);
	});

	it('extend and add new drivers', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'foo',
					config: {},
				},
			},
		});

		class FooDriver extends Storage {}
		storageManager.registerDriver('foo', FooDriver);

		expect(storageManager.disk('local')).toBeInstanceOf(FooDriver);
	});

	it('add new disks', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
			},
		});

		storageManager.addDisk('home', {
			driver: 'local',
			config: {
				root: '~',
			},
		});

		expect(storageManager.disk('home')).toBeInstanceOf(LocalFileSystemStorage);
	});

	it("invalid disks can't be added", () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
			},
		});

		const fn = () =>
			storageManager.addDisk('local', {
				driver: 'local',
				config: {
					root: '',
				},
			});

		expect(fn).toThrow('E_INVALID_CONFIG: A disk named local is already defined');
	});

	it('gets all instantiated disks', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
				home: {
					driver: 'local',
					config: {
						root: '~',
					},
				},
			},
		});

		let disks = storageManager.getDisks().keys();
		expect([...disks]).toStrictEqual([]);

		storageManager.disk('local');
		disks = storageManager.getDisks().keys();
		expect([...disks].sort()).toStrictEqual(['local']);

		storageManager.disk('home');
		disks = storageManager.getDisks().keys();
		expect([...disks].sort()).toStrictEqual(['home', 'local']);
	});

	it('gets all available drivers', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
				home: {
					driver: 'local',
					config: {
						root: '~',
					},
				},
			},
		});

		class FooDriver extends Storage {}
		storageManager.registerDriver('foo', FooDriver);

		class BarDriver extends Storage {}
		storageManager.registerDriver('bar', BarDriver);

		let disks = storageManager.getDrivers().keys();
		expect([...disks].sort()).toStrictEqual(['bar', 'foo', 'local']);
	});

	it('get disk with custom config', () => {
		const storageManager = new StorageManager({
			default: 'local',
			disks: {
				local: {
					driver: 'local',
					config: {
						root: '',
					},
				},
			},
		});

		const localWithDefaultConfig = storageManager.disk('local');
		expect(localWithDefaultConfig).toBeInstanceOf(LocalFileSystemStorage);
	});
});
