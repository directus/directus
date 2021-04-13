/**
 * @slynova/flydrive
 *
 * @license MIT
 * @copyright Slynova - Romain Lanz <romain.lanz@slynova.ch>
 */

import path from 'path';

jest.mock('fs-extra', () => {
	const fse = jest.requireActual('fs-extra');

	const errors: {
		map: Record<string, Error>;
	} = {
		map: {},
	};

	return {
		...Object.entries(fse)
			.map(([key, func]: [string, any]) => {
				if (typeof fse[key] !== 'function') {
					return {
						[key]: func,
					};
				}
				return {
					[key]: (...args: any[]) => {
						if (key in errors.map) {
							throw (errors.map as any)[key as any];
						}
						return func(...args);
					},
				};
			})
			.reduce((previous, current) => Object.assign(previous, current)),
		throwErrors(handler: () => Promise<any>, map: Record<string, Error>): () => Promise<void> {
			return async () => {
				errors.map = map;
				try {
					await handler();
				} catch (e) {
					throw e;
				} finally {
					errors.map = {};
				}
			};
		},
	};
});

import fse from 'fs-extra';

const fsem: typeof fse & {
	throwErrors(handler: () => Promise<any>, map: Record<string, Error>): () => Promise<void>;
} = fse as any;

import * as CE from '../src/exceptions';
import { LocalFileSystemStorage } from '../src/LocalFileSystemStorage';
import { streamToString, getFlatList } from '../src/utils';
import { RuntimeException } from 'node-exceptions';

const root = path.join(__dirname, 'storage/local');
const storage = new LocalFileSystemStorage({ root });

function isWindowsDefenderError(error: { code: string }): boolean {
	return error.code === 'EPERM';
}

function realFsPath(relativePath: string): string {
	return path.join(root, relativePath);
}

const testString = 'test-data';

beforeAll(async () => {
	await fse.ensureDir(root);
});

afterEach(async () => {
	await fse.emptyDir(root);
});

describe('Local Driver', () => {
	it('get underlying driver', async () => {
		expect(storage.driver()).toBeDefined();
	});

	it('find if a file exists', async () => {
		await fse.outputFile(realFsPath('i_exist'), testString);
		const { exists } = await storage.exists('i_exist');

		expect(exists).toBe(true);
	});

	it(
		'exists handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.exists('file')).rejects.toThrow('Mocked permission error');
			},
			{
				pathExists: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it(`find if a file doesn't exist`, async () => {
		const { exists } = await storage.exists('i_dont_exist');

		expect(exists).toBe(false);
	});

	it('find if a folder exists', async () => {
		await fse.ensureDir(realFsPath('test_dir'));
		const { exists } = await storage.exists('test_dir');

		expect(exists).toBe(true);
	});

	it('create a file', async () => {
		await storage.put('im_new', testString);
		const { content } = await storage.get('im_new');

		expect(content).toStrictEqual(testString);
	});

	it('create a file in a deep directory', async () => {
		await storage.put('deep/directory/im_new', testString);
		const { content } = await storage.get('deep/directory/im_new');

		expect(content).toStrictEqual(testString);
	});

	it('delete a file', async () => {
		await fse.outputFile(realFsPath('i_will_be_deleted'), '');

		try {
			const { wasDeleted } = await storage.delete('i_will_be_deleted');
			expect(wasDeleted).toBe(true);

			const { exists } = await storage.exists('i_will_be_deleted');
			expect(exists).toBe(false);
		} catch (error) {
			if (!isWindowsDefenderError(error)) {
				throw error;
			}
		}
	});

	it(
		'delete rethrows',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.delete('file')).rejects.toThrow('Mocked permission error');
			},
			{
				unlink: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it('delete a file that does not exist', async () => {
		const { wasDeleted } = await storage.delete('i_dont_exist');
		expect(wasDeleted).toBe(false);
	});

	it('move a file', async () => {
		await fse.outputFile(realFsPath('i_will_be_renamed'), '');
		await storage.move('i_will_be_renamed', 'im_renamed');

		const { exists: newExists } = await storage.exists('im_renamed');
		expect(newExists).toBe(true);

		const { exists: oldExists } = await storage.exists('i_will_be_renamed');
		expect(oldExists).toBe(false);
	});

	it('copy a file', async () => {
		await fse.outputFile(realFsPath('i_will_be_copied'), '');
		await storage.copy('i_will_be_copied', 'im_copied');

		const { exists: newExists } = await storage.exists('im_copied');
		expect(newExists).toBe(true);

		const { exists: oldExists } = await storage.exists('i_will_be_copied');
		expect(oldExists).toBe(true);
	});

	it(
		'copy handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.copy('src', 'dst')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file src'
				);
			},
			{
				copy: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it('prepend to a file', async () => {
		await fse.outputFile(realFsPath('i_have_content'), 'world');
		await storage.prepend('i_have_content', 'hello ');

		const { content } = await storage.get('i_have_content');
		expect(content).toStrictEqual('hello world');
	});

	it(
		'prepend handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.prepend('prependFails', 'test')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file prependFails'
				);
			},
			{
				readFile: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it('append to a file', async () => {
		await fse.outputFile(realFsPath('i_have_content'), 'hello');
		await storage.append('i_have_content', ' universe');

		const { content } = await storage.get('i_have_content');
		expect(content).toStrictEqual('hello universe');
	});

	it(
		'append handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.append('appendFails', 'test')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file appendFails'
				);
			},
			{
				appendFile: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it('prepend to new file', async () => {
		await storage.prepend('i_have_content', testString);

		const { content } = await storage.get('i_have_content', 'utf-8');
		expect(content).toStrictEqual(testString);
	});

	it('throw file not found exception when unable to find file', async () => {
		expect.assertions(1);

		try {
			await storage.get('non_existing', 'utf-8');
		} catch (error) {
			expect(error).toBeInstanceOf(CE.FileNotFound);
		}
	});

	it('do not get out of root path when path is absolute', async () => {
		const dummyFile = '/dummy_file';
		await storage.put(dummyFile, testString);

		const content = fse.readFileSync(realFsPath(dummyFile), 'utf-8');
		expect(content).toStrictEqual(testString);
	});

	it('ignore extraneous double dots ..', async () => {
		await storage.put('../../../dummy_file', testString);

		const content = fse.readFileSync(realFsPath('dummy_file'), 'utf-8');
		expect(content).toStrictEqual(testString);
	});

	it('do not ignore valid double dots ..', async () => {
		await storage.put('fake_dir/../dummy_file', testString);

		const content = fse.readFileSync(realFsPath('dummy_file'), 'utf-8');
		expect(content).toStrictEqual(testString);
	});

	it('create file from stream', async () => {
		await storage.put('foo', testString);

		const readStream = fse.createReadStream(realFsPath('foo'));
		await storage.put('bar', readStream);

		const { content } = await storage.get('bar');
		expect(content).toStrictEqual(testString);
	});

	it('get file as a buffer', async () => {
		await fse.outputFile(realFsPath('eita'), testString);

		const { content } = await storage.getBuffer('eita');
		expect(content).toBeInstanceOf(Buffer);
	});

	it(
		'getBuffer handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.getBuffer('eita')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file eita'
				);
			},
			{
				readFile: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it(
		'getStat handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.getStat('eita')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file eita'
				);
			},
			{
				stat: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it(
		'move handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.move('src', 'dst')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file src -> dst'
				);
			},
			{
				move: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it(
		'put handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await storage.put('eita', 'content')).rejects.toThrow(
					'E_PERMISSION_MISSING: Missing permission for file eita'
				);
			},
			{
				outputFile: new RuntimeException('Mocked permission error', undefined, 'EPERM'),
			}
		)
	);

	it(
		'flatList handles errors',
		fsem.throwErrors(
			async () => {
				expect(async () => await getFlatList(storage)).rejects.toThrow('E_UNKNOWN');
			},
			{
				opendir: new RuntimeException('Unknown', undefined, 'Unknown'),
			}
		)
	);

	it('throw exception when unable to find file', async () => {
		expect.assertions(1);

		const readStream = storage.getStream('foo');

		try {
			await streamToString(readStream);
		} catch ({ code }) {
			expect(code).toStrictEqual('ENOENT');
		}
	});

	it('get stream of a given file', async () => {
		await storage.put('foo', testString);

		const readStream = storage.getStream('foo');
		const content = await streamToString(readStream);
		expect(content).toStrictEqual(testString);
	});

	it('get the stat of a given file', async () => {
		await storage.put('foo', testString);

		const { size, modified } = await storage.getStat('foo');
		expect(size).toEqual(testString.length);
		// It seems that the Date constructor used in fs-extra is not the global one.
		expect(modified.constructor.name).toStrictEqual('Date');
	});

	it('list files with no prefix and empty directory', async () => {
		const result = await getFlatList(storage);
		expect(result).toStrictEqual([]);
	});

	it('list files with prefix that does not exist', async () => {
		const result = await getFlatList(storage, '/dummy/path');
		expect(result).toStrictEqual([]);
	});

	it('list files with no prefix', async () => {
		await Promise.all([
			storage.put('foo.txt', 'bar'),
			storage.put('foo/bar', 'baz'),
			storage.put('other/dir/file.txt', 'hello'),
		]);

		const result = await getFlatList(storage);
		expect(result.sort()).toStrictEqual(['foo.txt', path.normalize('foo/bar'), path.normalize('other/dir/file.txt')]);
	});

	it('list files with folder prefix', async () => {
		await Promise.all([
			storage.put('foo.txt', 'bar'),
			storage.put('foo/bar', 'baz'),
			storage.put('other/dir/file.txt', 'hello'),
		]);

		const result = await getFlatList(storage, 'other');
		expect(result).toStrictEqual([path.normalize('other/dir/file.txt')]);
	});

	it('list files with subfolder prefix', async () => {
		await Promise.all([
			storage.put('foo.txt', 'bar'),
			storage.put('foo/bar', 'baz'),
			storage.put('other/dir/file.txt', 'hello'),
		]);

		const result = await getFlatList(storage, `other/dir/`);
		expect(result).toStrictEqual([path.normalize('other/dir/file.txt')]);
	});

	it('list files with filename prefix', async () => {
		await Promise.all([
			storage.put('foo.txt', 'bar'),
			storage.put('foo/bar', 'baz'),
			storage.put('other/dir/file.txt', 'hello'),
		]);

		const result = await getFlatList(storage, 'other/dir/fil');
		expect(result).toStrictEqual([path.normalize('other/dir/file.txt')]);
	});

	it('list files with double dots in prefix', async () => {
		await Promise.all([
			storage.put('foo.txt', 'bar'),
			storage.put('foo/bar', 'baz'),
			storage.put('other/dir/file.txt', 'hello'),
		]);

		const result = await getFlatList(storage, 'other/../');
		expect(result.sort()).toStrictEqual(['foo.txt', path.normalize('foo/bar'), path.normalize('other/dir/file.txt')]);
	});
});
