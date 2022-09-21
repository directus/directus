import { Knex } from 'knex';
import { Logger } from 'pino';
import {
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	LOCAL_TYPES,
	PACKAGE_EXTENSION_TYPES,
} from '../constants';
import { Accountability } from './accountability';
import { InterfaceConfig } from './interfaces';
import { DisplayConfig } from './displays';
import { LayoutConfig } from './layouts';
import { ModuleConfig } from './modules';
import { PanelConfig } from './panels';
import { DeepPartial } from './misc';
import { Field } from './fields';
import { Relation } from './relations';
import { Collection } from './collection';
import { SchemaOverview } from './schema';
import { OperationAppConfig } from './operations';

export type AppExtensionType = typeof APP_EXTENSION_TYPES[number];
export type ApiExtensionType = typeof API_EXTENSION_TYPES[number];
export type HybridExtensionType = typeof HYBRID_EXTENSION_TYPES[number];
export type ExtensionType = typeof EXTENSION_TYPES[number];

export type PackageExtensionType = typeof PACKAGE_EXTENSION_TYPES[number];
export type ExtensionPackageType = typeof EXTENSION_PACKAGE_TYPES[number];

type ExtensionBase = {
	path: string;
	name: string;
};

type AppExtensionBase = {
	type: AppExtensionType;
	entrypoint: string;
};

type ApiExtensionBase = {
	type: ApiExtensionType;
	entrypoint: string;
};

type HybridExtensionBase = {
	type: HybridExtensionType;
	entrypoint: { app: string; api: string };
};

type PackExtensionBase = {
	type: 'pack';
	children: string[];
};

type BundleExtensionBase = {
	type: 'bundle';
	entrypoint: { app: string; api: string };
	entries: { type: ExtensionType; name: string }[];
};

type PackageExtensionBase = PackExtensionBase | BundleExtensionBase;

type ExtensionLocalBase = ExtensionBase & {
	local: true;
};

type ExtensionPackageBase = ExtensionBase & {
	version: string;
	host: string;
	local: false;
};

export type ExtensionLocal = ExtensionLocalBase & (AppExtensionBase | ApiExtensionBase | HybridExtensionBase);
export type ExtensionPackage = ExtensionPackageBase &
	(AppExtensionBase | ApiExtensionBase | HybridExtensionBase | PackageExtensionBase);

export type AppExtension = AppExtensionBase & (ExtensionLocalBase | ExtensionPackageBase);
export type ApiExtension = ApiExtensionBase & (ExtensionLocalBase | ExtensionPackageBase);
export type HybridExtension = HybridExtensionBase & (ExtensionLocalBase | ExtensionPackageBase);

export type PackExtension = PackExtensionBase & ExtensionPackageBase;
export type BundleExtension = BundleExtensionBase & ExtensionPackageBase;

export type Extension = ExtensionLocal | ExtensionPackage;

export type ExtensionManifestRaw = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]?: {
		type?: string;
		path?: string | { app?: string; api?: string };
		source?: string | { app?: string; api?: string };
		entries?: { type?: string; name?: string; source?: string | { app?: string; api?: string } }[];
		host?: string;
		hidden?: boolean;
	};
};

type ExtensionOptionsBase = {
	host: string;
	hidden?: boolean;
};

type ExtensionOptionsAppOrApi = {
	type: AppExtensionType | ApiExtensionType;
	path: string;
	source: string;
};

type ExtensionOptionsHybrid = {
	type: HybridExtensionType;
	path: { app: string; api: string };
	source: { app: string; api: string };
};

type ExtensionOptionsPack = {
	type: 'pack';
};

type ExtensionOptionsBundle = {
	type: 'bundle';
	path: { app: string; api: string };
	entries: (
		| { type: AppExtensionType | ApiExtensionType; name: string; source: string }
		| { type: HybridExtensionType; name: string; source: { app: string; api: string } }
	)[];
};

type ExtensionOptionsPackage = ExtensionOptionsPack | ExtensionOptionsBundle;

export type ExtensionOptions = ExtensionOptionsBase &
	(ExtensionOptionsAppOrApi | ExtensionOptionsHybrid | ExtensionOptionsPackage);

export type ExtensionManifest = {
	name: string;
	version: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]: ExtensionOptions;
};

export type AppExtensionConfigs = {
	interfaces: InterfaceConfig[];
	displays: DisplayConfig[];
	layouts: LayoutConfig[];
	modules: ModuleConfig[];
	panels: PanelConfig[];
	operations: OperationAppConfig[];
};

export type ApiExtensionContext = {
	services: any;
	exceptions: any;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { accountability?: Accountability; database?: Knex }) => Promise<SchemaOverview>;
};

export type ExtensionOptionsContext = {
	collection: string | undefined;
	editing: string;
	field: DeepPartial<Field>;
	relations: {
		m2o: DeepPartial<Relation> | undefined;
		m2a?: DeepPartial<Relation> | undefined;
		o2m: DeepPartial<Relation> | undefined;
	};
	collections: {
		junction: DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined;
		related: DeepPartial<Collection & { fields: DeepPartial<Field>[] }> | undefined;
	};
	fields: {
		corresponding: DeepPartial<Field> | undefined;
		junctionCurrent: DeepPartial<Field> | undefined;
		junctionRelated: DeepPartial<Field> | undefined;
		sort: DeepPartial<Field> | undefined;
	};

	items: Record<string, Record<string, any>[]>;

	localType: typeof LOCAL_TYPES[number];
	autoGenerateJunctionRelation: boolean;
	saving: boolean;
};
