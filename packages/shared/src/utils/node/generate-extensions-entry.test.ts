import { generateExtensionsEntry } from '.';
import { APP_EXTENSION_TYPES } from '../../constants/extensions';
import { Extension } from '../../types/extensions';

describe('generateExtensionsEntry', () => {
	const type = APP_EXTENSION_TYPES[4];
	it('returns an extension entrypoint exporting all extensions with a type that matches the provided type', () => {
		const mockExtension = [
			{ path: './extensions', name: 'mockExtension', type: 'panel', local: true, root: true },
		] as Extension[];
		expect(generateExtensionsEntry(type, mockExtension)).toBe(
			`import e0 from './extensions';
export default [e0];`
		);
	});
	it('return an a string of an empty array when the type does not match the extension type', () => {
		const mockExtension = [
			{ path: './extensions', name: 'mockExtension', type: 'pack', local: true, root: true },
		] as Extension[];
		expect(generateExtensionsEntry(type, mockExtension)).toBe(`export default [];`);
	});
});
