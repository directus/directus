import { API_EXTENSION_TYPES, APP_EXTENSION_TYPES, EXTENSION_PACKAGE_TYPES, EXTENSION_TYPES } from '../constants';
import { ApiExtensionType, AppExtensionType, ExtensionPackageType, ExtensionType } from '../types';

export function isExtension(type: string): type is ExtensionType {
	return (EXTENSION_TYPES as readonly string[]).includes(type);
}

export function isAppExtension(type: string): type is AppExtensionType {
	return (APP_EXTENSION_TYPES as readonly string[]).includes(type);
}

export function isApiExtension(type: string): type is ApiExtensionType {
	return (API_EXTENSION_TYPES as readonly string[]).includes(type);
}

export function isExtensionPackage(type: string): type is ExtensionPackageType {
	return (EXTENSION_PACKAGE_TYPES as readonly string[]).includes(type);
}
