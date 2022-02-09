import { isExtension, isAppExtension, isApiExtension, isExtensionPackage } from './is-extension';

describe('is extension type', () => {
	it('returns true when passed a valid extension_type', () => {
		expect(isExtension('interface')).toBe(true);
	});

	it('returns false when passed an invalid extension_type', () => {
		expect(isExtension('not_extension_type')).toBe(false);
	});

	it('returns true when passed a valid app_extension_type', () => {
		expect(isAppExtension('interface')).toBe(true);
	});

	it('returns false when passed an invalid app_extension_type', () => {
		expect(isAppExtension('not_extension_type')).toBe(false);
	});

	it('returns true when passed a valid api_extension_type', () => {
		expect(isApiExtension('hook')).toBe(true);
	});
	it('returns false when passed an invalid api_extension_type', () => {
		expect(isApiExtension('not_extension_type')).toBe(false);
	});

	it('returns true when passed a valid extension_package_type', () => {
		expect(isExtensionPackage('pack')).toBe(true);
	});

	it('returns true when passed ain valid extension_package_type', () => {
		expect(isExtensionPackage('not_extension_type')).toBe(false);
	});
});
