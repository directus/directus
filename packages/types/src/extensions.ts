import type {
	API_EXTENSION_TYPES,
	APP_EXTENSION_TYPES,
	BUNDLE_EXTENSION_TYPES,
	EXTENSION_TYPES,
	ExtensionManifest,
	ExtensionOptions,
	ExtensionOptionsBundleEntries,
	ExtensionOptionsBundleEntry,
	HYBRID_EXTENSION_TYPES,
	LOCAL_TYPES,
	NESTED_EXTENSION_TYPES,
	SplitEntrypoint,
} from '@directus/constants';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { z } from 'zod';
import type { Accountability } from './accountability.js';
import type { Collection } from './collection.js';
import type { DisplayConfig } from './displays.js';
import type { Field } from './fields.js';
import type { InterfaceConfig } from './interfaces.js';
import type { LayoutConfig } from './layouts.js';
import type { DeepPartial } from './misc.js';
import type { ModuleConfig } from './modules.js';
import type { OperationAppConfig } from './operations.js';
import type { PanelConfig } from './panels.js';
import type { Relation } from './relations.js';
import type { SchemaOverview } from './schema.js';

export type AppExtensionType = (typeof APP_EXTENSION_TYPES)[number];
export type ApiExtensionType = (typeof API_EXTENSION_TYPES)[number];
export type HybridExtensionType = (typeof HYBRID_EXTENSION_TYPES)[number];
export type BundleExtensionType = (typeof BUNDLE_EXTENSION_TYPES)[number];
export type ExtensionType = (typeof EXTENSION_TYPES)[number];
export type NestedExtensionType = (typeof NESTED_EXTENSION_TYPES)[number];

export type SplitEntrypoint = z.infer<typeof SplitEntrypoint>;

type ExtensionBase = {
	path: string;
	name: string;
	version?: string;
	host?: string;
	local: boolean;
};

export type AppExtension = ExtensionBase & {
	type: AppExtensionType;
	entrypoint: string;
};

export type ApiExtension = ExtensionBase & {
	type: ApiExtensionType;
	entrypoint: string;
};

export type HybridExtension = ExtensionBase & {
	type: HybridExtensionType;
	entrypoint: SplitEntrypoint;
};

export type BundleExtension = ExtensionBase & {
	type: 'bundle';
	entrypoint: SplitEntrypoint;
	entries: { type: NestedExtensionType; name: string }[];
};

export type Extension = AppExtension | ApiExtension | HybridExtension | BundleExtension;

export type ExtensionOptions = z.infer<typeof ExtensionOptions>;
export type ExtensionOptionsBundleEntry = z.infer<typeof ExtensionOptionsBundleEntry>;

export type ExtensionOptionsBundleEntries = z.infer<typeof ExtensionOptionsBundleEntries>;

export type ExtensionManifest = z.infer<typeof ExtensionManifest>;

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

	localType: (typeof LOCAL_TYPES)[number];
	autoGenerateJunctionRelation: boolean;
	saving: boolean;
};

export type ExtensionInfo =
	| Omit<AppExtension, 'entrypoint' | 'path'>
	| Omit<ApiExtension, 'entrypoint' | 'path'>
	| Omit<HybridExtension, 'entrypoint' | 'path'>
	| Omit<BundleExtension, 'entrypoint' | 'path'>;
