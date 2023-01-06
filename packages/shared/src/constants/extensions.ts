export const APP_SHARED_DEPS = ['@directus/extensions-sdk', 'vue', 'vue-router', 'vue-i18n', 'pinia'];
export const API_SHARED_DEPS = ['directus'];

export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel'] as const;
export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;
export const HYBRID_EXTENSION_TYPES = ['operation'] as const;
export const BUNDLE_EXTENSION_TYPES = ['bundle'] as const;
export const EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;
export const NESTED_EXTENSION_TYPES = [
	...APP_EXTENSION_TYPES,
	...API_EXTENSION_TYPES,
	...HYBRID_EXTENSION_TYPES,
] as const;
export const APP_OR_HYBRID_EXTENSION_TYPES = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES] as const;
export const APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES = [
	...APP_OR_HYBRID_EXTENSION_TYPES,
	...BUNDLE_EXTENSION_TYPES,
] as const;

export const EXTENSION_LANGUAGES = ['javascript', 'typescript'] as const;

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-)(.+)$/;

export const EXTENSION_PKG_KEY = 'directus:extension';
