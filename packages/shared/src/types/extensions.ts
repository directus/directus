import {
	API_EXTENSION_PACKAGE_TYPES,
	API_EXTENSION_TYPES,
	APP_EXTENSION_PACKAGE_TYPES,
	APP_EXTENSION_TYPES,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
} from '../constants';

export type AppExtensionType = typeof APP_EXTENSION_TYPES[number];
export type ApiExtensionType = typeof API_EXTENSION_TYPES[number];
export type ExtensionType = typeof EXTENSION_TYPES[number];

export type AppExtensionPackageType = typeof APP_EXTENSION_PACKAGE_TYPES[number];
export type ApiExtensionPackageType = typeof API_EXTENSION_PACKAGE_TYPES[number];
export type ExtensionPackageType = typeof EXTENSION_PACKAGE_TYPES[number];

export type Extension = {
	path: string;
	name: string;
	version?: string;

	type: ExtensionPackageType;
	entrypoint?: string;
	host?: string;
	children?: string[];

	local: boolean;
	root: boolean;
};

export type ExtensionManifestRaw = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]?: {
		type?: string;
		path?: string;
		source?: string;
		host?: string;
		hidden?: boolean;
	};
};

export type ExtensionManifest = {
	name: string;
	version: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]: {
		type: ExtensionPackageType;
		path: string;
		source: string;
		host: string;
		hidden: boolean;
	};
};

export type ApiExtensionContext = {
	services: any;
	exceptions: any;
	database: any;
	env: any;
	getSchema: any;
};
