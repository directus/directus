export const APP_SHARED_DEPS = ['@directus/extension-sdk', 'vue'];
export const API_SHARED_DEPS = ['axios'];

export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module'] as const;
export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;
export const EXTENSION_TYPES = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES] as const;

export const EXTENSION_PACK_TYPE = 'pack';
export const APP_EXTENSION_PACKAGE_TYPES = [...APP_EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;
export const API_EXTENSION_PACKAGE_TYPES = [...API_EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;
export const EXTENSION_PACKAGE_TYPES = [...EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-).+$/;

export const EXTENSION_PKG_KEY = 'directus:extension';
