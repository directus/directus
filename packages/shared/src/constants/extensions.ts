export const APP_SHARED_DEPS = ['@directus/extensions-sdk', 'vue', 'vue-router', 'vue-i18n', 'pinia'];
export const API_SHARED_DEPS = ['directus'];

export const APP_EXTENSION_TYPES = ['interface', 'display', 'layout', 'module', 'panel'] as const;
export const API_EXTENSION_TYPES = ['hook', 'endpoint'] as const;
export const EXTENSION_TYPES = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES] as const;

export const EXTENSION_PACK_TYPE = 'pack';
export const APP_EXTENSION_PACKAGE_TYPES = [...APP_EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;
export const API_EXTENSION_PACKAGE_TYPES = [...API_EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;
export const EXTENSION_PACKAGE_TYPES = [...EXTENSION_TYPES, EXTENSION_PACK_TYPE] as const;

export const EXTENSION_LANGUAGES = ['javascript', 'typescript'] as const;

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-).+$/;

export const EXTENSION_PKG_KEY = 'directus:extension';
