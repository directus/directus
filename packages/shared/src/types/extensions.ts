import { Knex } from 'knex';
import { Logger } from 'pino';
import { Ref } from 'vue';
import {
	API_EXTENSION_PACKAGE_TYPES,
	API_EXTENSION_TYPES,
	API_WITHOUT_HYBRID_EXTENSION_TYPES,
	APP_EXTENSION_PACKAGE_TYPES,
	APP_EXTENSION_TYPES,
	APP_WITHOUT_HYBRID_EXTENSION_TYPES,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
	HYBRID_EXTENSION_TYPES,
	LOCAL_TYPES,
	PACK_EXTENSION_TYPE,
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

export type AppWithoutHybridExtensionType = typeof APP_WITHOUT_HYBRID_EXTENSION_TYPES[number];
export type ApiWithoutHybridExtensionType = typeof API_WITHOUT_HYBRID_EXTENSION_TYPES[number];
export type HybridExtensionType = typeof HYBRID_EXTENSION_TYPES[number];
export type AppExtensionType = typeof APP_EXTENSION_TYPES[number];
export type ApiExtensionType = typeof API_EXTENSION_TYPES[number];
export type ExtensionType = typeof EXTENSION_TYPES[number];

export type PackExtensionType = typeof PACK_EXTENSION_TYPE;
export type AppExtensionPackageType = typeof APP_EXTENSION_PACKAGE_TYPES[number];
export type ApiExtensionPackageType = typeof API_EXTENSION_PACKAGE_TYPES[number];
export type ExtensionPackageType = typeof EXTENSION_PACKAGE_TYPES[number];

type ExtensionCommon = {
	path: string;
	name: string;
};

type AppExtensionCommon = {
	type: AppWithoutHybridExtensionType;
	entrypoint: string;
};

type ApiExtensionCommon = {
	type: ApiWithoutHybridExtensionType;
	entrypoint: string;
};

type HybridExtensionCommon = {
	type: HybridExtensionType;
	entrypoint: { app: string; api: string };
};

type PackExtensionCommon = {
	type: PackExtensionType;
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
	(AppExtensionCommon | ApiExtensionCommon | HybridExtensionCommon | PackExtensionCommon);

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

type ExtensionManifestCommon = {
	host: string;
	hidden?: boolean;
};

type ExtensionManifestWithoutHybrid = {
	type: AppWithoutHybridExtensionType | ApiWithoutHybridExtensionType;
	path: string;
	source: string;
};

type ExtensionManifestHybrid = {
	type: HybridExtensionType;
	path: { app: string; api: string };
	source: { app: string; api: string };
};

type ExtensionManifestPack = {
	type: PackExtensionType;
};

export type ExtensionOptions = ExtensionManifestCommon &
	(ExtensionManifestWithoutHybrid | ExtensionManifestHybrid | ExtensionManifestPack);

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
