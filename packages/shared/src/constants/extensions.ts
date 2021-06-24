import { ApiExtensionType, AppExtensionType, ExtensionType } from '../types';

export const SHARED_DEPS = ['@directus/extension-sdk', 'vue'];

export const APP_EXTENSION_TYPES: AppExtensionType[] = ['interface', 'display', 'layout', 'module'];
export const API_EXTENSION_TYPES: ApiExtensionType[] = ['endpoint', 'hook'];
export const EXTENSION_TYPES: ExtensionType[] = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES];

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-).+$/;
