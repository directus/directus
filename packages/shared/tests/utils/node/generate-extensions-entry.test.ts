import { generateExtensionsEntry } from '../../../src/utils/node/generate-extensions-entry';
import { APP_EXTENSION_TYPES } from '../../../src/constants/extensions';
import { Extension } from '../../../src/types/extensions';

describe('generateExtensionsEntry', () => {
	const type = APP_EXTENSION_TYPES[4];
	it('returns an extension entrypoint exporting all extensions with a type that matches the provided type', () => {
		const mockExtension: Extension[] = [
			{ path: './extensions', name: 'mockExtension', type: 'panel', entrypoint: 'index.js', local: true },
		];
		expect(generateExtensionsEntry(type, mockExtension)).toBe(
			`import e0 from './extensions/index.js';
export default [e0];`
		);
	});
	it('returns an empty extension entrypoint if there is no extension with the provided type', () => {
		const mockExtension: Extension[] = [
			{
				path: './extensions',
				name: 'mockExtension',
				type: 'pack',
				version: '1.0.0',
				host: '^9.0.0',
				children: [],
				local: false,
			},
		];
		expect(generateExtensionsEntry(type, mockExtension)).toBe(`export default [];`);
	});
});
