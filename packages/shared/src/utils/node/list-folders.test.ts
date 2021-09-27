import { listFolders } from '.';

describe('', () => {
	it('returns all the subdirectories of the current directory', async () => {
		expect(await listFolders('./')).toStrictEqual([
			'coverage',
			'displays',
			'dist',
			'endpoints',
			'extension',
			'hooks',
			'interfaces',
			'layouts',
			'modules',
			'node_modules',
			'panels',
			'src',
			'utils',
			'~',
		]);
	});
});
