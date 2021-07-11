import { EXTENSION_PKG_KEY } from '../constants';

export type ApiExtensionType = 'endpoint' | 'hook';
export type AppExtensionType = 'interface' | 'display' | 'layout' | 'module';
export type ExtensionType = ApiExtensionType | AppExtensionType;
export type ExtensionPackageType = ExtensionType | 'pack';

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

export type ExtensionManifest = {
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
