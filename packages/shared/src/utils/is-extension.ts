import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, EXTENSION_TYPES } from '../constants';
import { ApiExtensionType, AppExtensionType, ExtensionType } from '../types';

export function isExtension(type: string): type is ExtensionType {
	return (EXTENSION_TYPES as string[]).includes(type);
}

export function isAppExtension(type: string): type is AppExtensionType {
	return (APP_EXTENSION_TYPES as string[]).includes(type);
}

export function isApiExtension(type: string): type is ApiExtensionType {
	return (API_EXTENSION_TYPES as string[]).includes(type);
}
