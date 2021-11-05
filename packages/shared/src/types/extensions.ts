import { Knex } from 'knex';
import { Logger } from 'pino';
import {
	API_EXTENSION_PACKAGE_TYPES,
	API_EXTENSION_TYPES,
	APP_EXTENSION_PACKAGE_TYPES,
	APP_EXTENSION_TYPES,
	EXTENSION_PACKAGE_TYPES,
	EXTENSION_PKG_KEY,
	EXTENSION_TYPES,
} from '../constants';
import { Accountability } from './accountability';
import { Collection, Field, Relation, DeepPartial } from '.';
import { LOCAL_TYPES } from '../constants';

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
		hidden?: boolean;
	};
};

export type ApiExtensionContext = {
	services: any;
	exceptions: any;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { accountability?: Accountability; database?: Knex }) => Promise<Record<string, any>>;
};

export type ExtensionOptionsContext = {
	collection: string;
	editing: string;
	field: DeepPartial<Field>;
	relations: {
		m2o: DeepPartial<Relation> | undefined;
		m2a: DeepPartial<Relation> | undefined;
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
