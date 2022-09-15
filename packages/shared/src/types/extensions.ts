import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { Ref } from 'vue';
import type {
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	LOCAL_TYPES,
	PACKAGE_EXTENSION_TYPES,
} from '../constants/index.js';
import type { Accountability } from './accountability.js';
import type { InterfaceConfig } from './interfaces.js';
import type { DisplayConfig } from './displays.js';
import type { LayoutConfig } from './layouts.js';
import type { ModuleConfig } from './modules.js';
import type { PanelConfig } from './panels.js';
import type { DeepPartial } from './misc.js';
import type { Field } from './fields.js';
import type { Relation } from './relations.js';
import type { Collection } from './collection.js';
import type { SchemaOverview } from './schema.js';

export type AppExtensionType = typeof APP_EXTENSION_TYPES[number];
export type ApiExtensionType = typeof API_EXTENSION_TYPES[number];
export type HybridExtensionType = typeof HYBRID_EXTENSION_TYPES[number];
export type ExtensionType = typeof EXTENSION_TYPES[number];

export type PackageExtensionType = typeof PACKAGE_EXTENSION_TYPES[number];
export type ExtensionPackageType = typeof EXTENSION_PACKAGE_TYPES[number];

type ExtensionCommon = {
	path: string;
	name: string;
};

type AppExtensionCommon = {
	type: AppExtensionType;
	entrypoint: string;
};

type ApiExtensionCommon = {
	type: ApiExtensionType;
	entrypoint: string;
};

type HybridExtensionCommon = {
	type: HybridExtensionType;
	entrypoint: { app: string; api: string };
};

type PackageExtensionCommon = {
	type: PackageExtensionType;
	children: string[];
};

type ExtensionLocalCommon = ExtensionCommon & {
	local: true;
};

type ExtensionPackageCommon = ExtensionCommon & {
	version: string;
	host: string;
	local: false;
};

export type ExtensionLocal = ExtensionLocalCommon & (AppExtensionCommon | ApiExtensionCommon | HybridExtensionCommon);
export type ExtensionPackage = ExtensionPackageCommon &
	(AppExtensionCommon | ApiExtensionCommon | HybridExtensionCommon | PackageExtensionCommon);

export type AppExtension = AppExtensionCommon & (ExtensionLocalCommon | ExtensionPackageCommon);
export type ApiExtension = ApiExtensionCommon & (ExtensionLocalCommon | ExtensionPackageCommon);
export type HybridExtension = HybridExtensionCommon & (ExtensionLocalCommon | ExtensionPackageCommon);
export type Extension = ExtensionLocal | ExtensionPackage;

export type ExtensionManifestRaw = {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]?: {
		type?: string;
		path?: string | { app: string; api: string };
		source?: string | { app: string; api: string };
		host?: string;
		hidden?: boolean;
	};
};

type ExtensionOptionsCommon = {
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

type ExtensionOptionsPackage = {
	type: PackageExtensionType;
};

export type ExtensionOptions = ExtensionOptionsCommon &
	(ExtensionOptionsAppOrApi | ExtensionOptionsHybrid | ExtensionOptionsPackage);

export type ExtensionManifest = {
	name: string;
	version: string;
	dependencies?: Record<string, string>;

	[EXTENSION_PKG_KEY]: ExtensionOptions;
};

export type AppExtensionConfigs = {
	interfaces: Ref<InterfaceConfig[]>;
	displays: Ref<DisplayConfig[]>;
	layouts: Ref<LayoutConfig[]>;
	modules: Ref<ModuleConfig[]>;
	panels: Ref<PanelConfig[]>;
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
