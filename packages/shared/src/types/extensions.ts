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
