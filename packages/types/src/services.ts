import type { Readable } from 'node:stream';
import type { Knex } from 'knex';
import type { Column, ForeignKey } from '@directus/schema';

import type { Accountability } from './accountability.js';
import type { TransformationSet } from './assets.js';
import type { LoginResult } from './authentication.js';
import type { RawSchemaCollection, RawCollection } from './collection.js';
// import type { ActionHandler } from './events.js';
import type { Field, Type, RawField } from './fields.js';
import type { BusboyFileStream, File } from './files.js';
import type { FlowRaw } from './flows.js';
import type { ExportFormat } from './import-export.js';
import type { SchemaOverview } from './schema.js';
import type { ItemPermissions } from './permissions.js';
import type { Policy } from './policies.js';
import type { Item, PrimaryKey, MutationOptions, QueryOptions } from './items.js';
import type { Notification } from './notifications.js';
import type { PayloadAction, PayloadServiceProcessRelationResult } from './payload.js';
import type { Aggregate, Query } from './query.js';
import type { FieldOverview } from './schema.js';
import type { Range, Stat } from './storage.js';
// import type { DeepPartial } from './misc.js';
import type { OperationRaw } from './flows.js';
import type { Relation } from './relations.js';
import type { RegisterUserInput } from './users.js';
import type { Snapshot, SnapshotDiffWithHash, SnapshotDiff, SnapshotWithHash } from './snapshot.js';
import type { Webhook } from './webhooks.js';
// import type { WebSocketEvent } from './websockets.js';

export type AbstractServiceOptions = {
	knex?: Knex | undefined;
	accountability?: Accountability | null | undefined;
	schema: SchemaOverview;
	nested?: string[];
};

type Service<T extends Item = Item> = new (options: AbstractServiceOptions) => AbstractService<T>;

type ItemsService<T extends Item = Item, Collection extends string = string> = new (
	collection: Collection,
	options: AbstractServiceOptions,
) => AbstractService<T>;

/**
 * The AssetsService
 */
interface AssetsService {
	getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream?: false,
	): Promise<{ stream: Readable; file: any; stat: Stat }>;
	getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream?: true,
	): Promise<{ stream: () => Promise<Readable>; file: any; stat: Stat }>;
	getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream?: boolean,
	): Promise<{ stream: (() => Promise<Readable>) | Readable; file: any; stat: Stat }>;
}

/**
 * The AuthenticationService
 */
interface AuthenticationService {
	login(
		providerName: string,
		payload: Record<string, any>,
		options?: Partial<{
			otp: string;
			session: boolean;
		}>,
	): Promise<LoginResult>;
	refresh(refreshToken: string, options?: Partial<{ session: boolean }>): Promise<LoginResult>;
	logout(refreshToken: string): Promise<void>;
	verifyPassword(userID: string, password: string): Promise<void>;
}

/**
 * The CollectionsService
 */
interface CollectionsService {
	/**
	 * Create a single new collection
	 */
	createOne(payload: RawCollection, opts?: MutationOptions): Promise<string>;
	/**
	 * Create multiple new collections
	 */
	createMany(payloads: RawCollection[], opts?: MutationOptions): Promise<string[]>;
	/**
	 * Read all collections. Currently doesn't support any query.
	 */
	readByQuery(): Promise<RawSchemaCollection[]>;
	/**
	 * Get a single collection by name
	 */
	readOne(collectionKey: string): Promise<RawSchemaCollection>;
	/**
	 * Read many collections by name
	 */
	readMany(collectionKeys: string[]): Promise<RawSchemaCollection[]>;
	/**
	 * Update a single collection by name
	 */
	updateOne(collectionKey: string, data: Partial<RawSchemaCollection>, opts?: MutationOptions): Promise<string>;
	/**
	 * Update multiple collections in a single transaction
	 */
	updateBatch(data: Partial<RawSchemaCollection>[], opts?: MutationOptions): Promise<string[]>;
	/**
	 * Update multiple collections by name
	 */
	updateMany(collectionKeys: string[], data: Partial<RawSchemaCollection>, opts?: MutationOptions): Promise<string[]>;
	/**
	 * Delete a single collection This will delete the table and all records within. It'll also
	 * delete any fields, presets, activity, revisions, and permissions relating to this collection
	 */
	deleteOne(collectionKey: string, opts?: MutationOptions): Promise<string>;
	/**
	 * Delete multiple collections by key
	 */
	deleteMany(collectionKeys: string[], opts?: MutationOptions): Promise<string[]>;
}

/**
 * The ExtensionsService
 */
// interface ExtensionsService {
// 	install(extensionId: string, versionId: string): Promise<void>;
// 	uninstall(id: string): Promise<void>;
// 	reinstall(id: string): Promise<void>;
// 	readAll(): Promise<ApiOutput[]>;
// 	readOne(id: string): Promise<ApiOutput>;
// 	updateOne(id: string, data: DeepPartial<ApiOutput>): Promise<ApiOutput>;
// 	deleteOne(id: string): Promise<void>;
// }

/**
 * The ExportService
 */
interface ExportService {
	exportToFile(
		collection: string,
		query: Partial<Query>,
		format: ExportFormat,
		options?: {
			file?: Partial<File>;
		},
	): Promise<void>;
	transform(
		input: Record<string, any>[],
		format: ExportFormat,
		options?: {
			includeHeader?: boolean;
			includeFooter?: boolean;
			fields?: string[] | null;
		},
	): string;
}

/**
 * The FieldsService
 */
interface FieldsService {
	columnInfo(collection?: string, field?: string): Promise<Column | Column[]>;
	readAll(collection?: string): Promise<Field[]>;
	readOne(collection: string, field: string): Promise<Record<string, any>>;
	createField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		table?: Knex.CreateTableBuilder, // allows collection creation to
		opts?: MutationOptions,
	): Promise<void>;
	updateField(collection: string, field: RawField, opts?: MutationOptions): Promise<string>;
	updateFields(collection: string, fields: RawField[], opts?: MutationOptions): Promise<string[]>;
	deleteField(collection: string, field: string, opts?: MutationOptions): Promise<void>;
}

/**
 * The FilesService
 */
interface FileService<T = File> {
	/**
	 * Upload a single new file to the configured storage adapter
	 */
	uploadOne(
		stream: BusboyFileStream | Readable,
		data: Partial<T> & { storage: string },
		primaryKey?: PrimaryKey,
		opts?: MutationOptions,
	): Promise<PrimaryKey>;

	/**
	 * Import a single file from an external URL
	 */
	importOne(importURL: string, body: Partial<T>): Promise<PrimaryKey>;
}

/**
 * The ImportService
 */

interface ImportService {
	import(collection: string, mimetype: string, stream: Readable): Promise<void>;
	importJSON(collection: string, stream: Readable): Promise<void>;
	importCSV(collection: string, stream: Readable): Promise<void>;
}

/**
 * The NotificationsService
 */
interface NotificationsService {
	sendEmail(data: Partial<Notification>): Promise<void>;
}

/**
 * The MetaService
 */
interface MetaService {
	getMetaForQuery(collection: string, query: any): Promise<Record<string, any> | undefined>;
	totalCount(collection: string): Promise<number>;
	filterCount(collection: string, query: Query): Promise<number>;
}

/**
 * The PayloadService
 */
interface PayloadService {
	processValues(action: PayloadAction, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
	processValues(action: PayloadAction, payload: Partial<Item>): Promise<Partial<Item>>;
	processValues(
		action: PayloadAction,
		payloads: Partial<Item>[],
		aliasMap: Record<string, string>,
		aggregate: Aggregate,
	): Promise<Partial<Item>[]>;
	processValues(
		action: PayloadAction,
		payload: Partial<Item>,
		aliasMap: Record<string, string>,
		aggregate: Aggregate,
	): Promise<Partial<Item>>;
	processAggregates(payload: Partial<Item>[], aggregate?: Aggregate): void;
	processField(
		field: SchemaOverview['collections'][string]['fields'][string],
		payload: Partial<Item>,
		action: PayloadAction,
		accountability: Accountability | null,
	): Promise<any>;
	processGeometries<T extends Partial<Record<string, any>>[]>(
		fieldEntries: [string, FieldOverview][],
		payloads: T,
		action: PayloadAction,
	): T;
	processDates(
		fieldEntries: [string, FieldOverview][],
		payloads: Partial<Record<string, any>>[],
		action: PayloadAction,
		aliasMap?: Record<string, string>,
		aggregate?: Aggregate,
	): Partial<Record<string, any>>[];
	processA2O(
		data: Partial<Item>,
		opts?: MutationOptions,
	): Promise<
		PayloadServiceProcessRelationResult & {
			payload: Partial<Item>;
		}
	>;
	processM2O(
		data: Partial<Item>,
		opts?: MutationOptions,
	): Promise<
		PayloadServiceProcessRelationResult & {
			payload: Partial<Item>;
		}
	>;
	processO2M(
		data: Partial<Item>,
		parent: PrimaryKey,
		opts?: MutationOptions,
	): Promise<PayloadServiceProcessRelationResult>;
	prepareDelta(data: Partial<Item>): Promise<string | null>;
}

/**
 * The PermissionsService
 */
interface PermissionsService {
	getItemPermissions(collection: string, primaryKey?: string): Promise<ItemPermissions>;
}

/**
 * The RelationsService
 */
interface RelationsService {
	foreignKeys(collection?: string): Promise<ForeignKey[]>;
	readAll(collection?: string, opts?: QueryOptions, bypassCache?: boolean): Promise<Relation[]>;
	/**
	 * Create a new relationship / foreign key constraint
	 */
	createOne(relation: Partial<Relation>, opts?: MutationOptions): Promise<void>;
	/**
	 * Update an existing foreign key constraint
	 *
	 * Note: You can update anything under meta, but only the `on_delete` trigger under schema
	 */
	updateOne(collection: string, field: string, relation: Partial<Relation>, opts?: MutationOptions): Promise<void>;
	/**
	 * Delete an existing relationship
	 */
	deleteOne(collection: string, field: string, opts?: MutationOptions): Promise<void>;
}

/**
 * The RevisionsService
 */
interface RevisionsService {
	revert(pk: PrimaryKey): Promise<void>;
}

/**
 * The SchemaService
 */
interface SchemaService {
	snapshot(): Promise<Snapshot>;
	apply(payload: SnapshotDiffWithHash): Promise<void>;
	diff(snapshot: Snapshot, options?: { currentSnapshot?: Snapshot; force?: boolean }): Promise<SnapshotDiff | null>;
	getHashedSnapshot(snapshot: Snapshot): SnapshotWithHash;
}

/**
 * The ServerService
 */
interface ServerService {
	serverInfo(): Promise<Record<string, any>>;
	health(): Promise<Record<string, any>>;
}

/**
 * The SharesService
 */
interface SharesService {
	login(
		payload: Record<string, any>,
		options?: Partial<{
			session: boolean;
		}>,
	): Promise<Omit<LoginResult, 'id'>>;
	invite(payload: { emails: string[]; share: PrimaryKey }): Promise<void>;
}

/**
 * The SpecificationService
 * Pass in `OpenAPIObject` or `GraphQLSchema` as type `T` to generate OpenAPI or GraphQL specifications respectively.
 */

// interface SpecificationService<T> {
// 	oas: {
// 		generate(host?: string): Promise<T>;
// 	};
// 	graphql: {
// 		generate(scope: 'items' | 'system'): Promise<string | T | null>;
// 	};
// }

/**
 * The TFAService
 */
interface TFAService {
	verifyOTP(key: PrimaryKey, otp: string, secret?: string): Promise<boolean>;
	generateTFA(key: PrimaryKey): Promise<Record<string, string>>;
	enableTFA(key: PrimaryKey, otp: string, secret: string): Promise<void>;
	disableTFA(key: PrimaryKey): Promise<void>;
}

/**
 * The UsersService
 */
interface UsersService {
	inviteUser(email: string | string[], role: string, url: string | null, subject?: string | null): Promise<void>;
	acceptInvite(token: string, password: string): Promise<void>;
	registerUser(input: RegisterUserInput): Promise<void>;
	verifyRegistration(token: string): Promise<string>;
	requestPasswordReset(email: string, url: string | null, subject?: string | null): Promise<void>;
	resetPassword(token: string, password: string): Promise<void>;
}

/**
 * The UtilsService
 */
interface UtilsService {
	sort(collection: string, { item, to }: { item: PrimaryKey; to: PrimaryKey }): Promise<void>;
	clearCache({ system }: { system: boolean }): Promise<void>;
}

/**
 * The VersionsService
 */
interface VersionsService {
	getMainItem(collection: string, item: PrimaryKey, query?: Query): Promise<Item>;
	verifyHash(collection: string, item: PrimaryKey, hash: string): Promise<{ outdated: boolean; mainHash: string }>;
	getVersionSaves(key: string, collection: string, item: string | undefined): Promise<Partial<Item>[] | null>;
	save(key: PrimaryKey, data: Partial<Item>): Promise<Partial<Item>>;
	promote(version: PrimaryKey, mainHash: string, fields?: string[]): Promise<PrimaryKey>;
}

/**
 * The WebSocketService
 * Pass in `WM` for the WebSocket message type and `WC` for the WebSocket client type.
 */
// interface WebSocketService<WM, WC> {
// 	on(event: WebSocketEvent, callback: ActionHandler): void;
// 	off(event: WebSocketEvent, callback: ActionHandler): void;
// 	broadcast(message: string | WM, filter?: { user?: string; role?: string }): void;
// 	clients(): Set<WC>;
// }

export interface AbstractService<T extends Item = Item> {
	knex: Knex;
	accountability: Accountability | null | undefined;
	nested: string[];
	getKeysByQuery(query: Query): Promise<PrimaryKey[]>;
	/**
	 * Create a single new item.
	 */
	createOne(data: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction.
	 *
	 * Uses `this.createOne` under the hood.
	 */
	createMany(data: Partial<T>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Get items by query.
	 */
	readByQuery(query: Query, opts?: QueryOptions): Promise<T[]>;
	/**
	 * Get single item by primary key.
	 *
	 * Uses `this.readByQuery` under the hood.
	 */
	readOne(key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<T>;
	/**
	 * Get multiple items by primary keys.
	 *
	 * Uses `this.readByQuery` under the hood.
	 */
	readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<T[]>;
	/**
	 * Update multiple items by query.
	 *
	 * Uses `this.updateMany` under the hood.
	 */
	updateByQuery(query: Query, data: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Update a single item by primary key.
	 *
	 * Uses `this.updateMany` under the hood.
	 */
	updateOne(key: PrimaryKey, data: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Update multiple items in a single transaction.
	 *
	 * Uses `this.updateOne` under the hood.
	 */
	updateBatch(data: Partial<T>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Update many items by primary key, setting all items to the same change.
	 */
	updateMany(keys: PrimaryKey[], data: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Upsert a single item.
	 *
	 * Uses `this.createOne` / `this.updateOne` under the hood.
	 */
	upsertOne(payload: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Upsert many items.
	 *
	 * Uses `this.upsertOne` under the hood.
	 */
	upsertMany(payloads: Partial<T>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Delete multiple items by query.
	 *
	 * Uses `this.deleteMany` under the hood.
	 */
	deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Delete a single item by primary key.
	 *
	 * Uses `this.deleteMany` under the hood.
	 */
	deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
	/**
	 * Delete multiple items by primary key.
	 */
	deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
	/**
	 * Read/treat collection as singleton.
	 */
	readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<T>>;
	/**
	 * Upsert/treat collection as singleton.
	 *
	 * Uses `this.createOne` / `this.updateOne` under the hood.
	 */
	upsertSingleton(data: Partial<T>, opts?: MutationOptions): Promise<PrimaryKey>;
}

export interface ExtensionsServices<T extends Item = Item, Collection extends string = string> {
	/**
	 * The AccessService
	 */
	AccessService: Service<T>;
	/**
	 * The ActivityService
	 */
	ActivityService: Service<T>;
	/**
	 * The AssetsService
	 */
	AssetsService: new (options: AbstractServiceOptions) => AssetsService;
	/**
	 * The AuthenticationService
	 */
	AuthenticationService: new (options: AbstractServiceOptions) => AuthenticationService;
	/**
	 * The CollectionsService
	 */
	CollectionsService: new (options: AbstractServiceOptions) => CollectionsService;
	/**
	 * The CommentsService
	 */
	CommentsService: Service<T>;
	/**
	 * The DashboardsService
	 */
	DashboardsService: Service<T>;
	/**
	 * The ExportService
	 */
	ExportService: new (options: AbstractServiceOptions) => ExportService;
	/**
	 * The ExtensionsService
	 */
	// ExtensionsService: new (options: AbstractServiceOptions) => ExtensionsService;
	/**
	 * The FieldsService
	 */
	FieldsService: new (options: AbstractServiceOptions) => FieldsService;
	/**
	 * The FilesService
	 */
	FilesService: new (options: AbstractServiceOptions) => AbstractService<File> & FileService<File>;
	/**
	 * The FlowsService
	 */
	FlowsService: Service<FlowRaw>;
	/**
	 * The FoldersService
	 */
	FoldersService: Service<T>;
	/**
	 * The GraphQLService
	 */
	// GraphQLService: new (options: AbstractServiceOptions) => any;
	/**
	 * The ImportService
	 */
	ImportService: new (options: AbstractServiceOptions) => ImportService;
	/**
	 * The ItemsService
	 */
	ItemsService: ItemsService<T, Collection>;
	/**
	 * The MailService
	 */
	MailService: new (options: AbstractServiceOptions) => any;
	/**
	 * The MetaService
	 */
	MetaService: new (options: AbstractServiceOptions) => MetaService;
	/**
	 * The NotificationsService
	 */
	NotificationsService: new (options: AbstractServiceOptions) => AbstractService<T> & NotificationsService;
	/**
	 * The OperationsService
	 */
	OperationsService: Service<OperationRaw>;
	/**
	 * The PanelsService
	 */
	PanelsService: Service<T>;
	/**
	 * The PayloadService
	 */
	PayloadService: new (collection: Collection, options: AbstractServiceOptions) => PayloadService;
	/**
	 * The PermissionsService
	 */
	PermissionsService: new (options: AbstractServiceOptions) => AbstractService<T> & PermissionsService;
	/**
	 * The PoliciesService
	 */
	PoliciesService: Service<Policy>;
	/**
	 * The PresetsService
	 */
	PresetsService: Service<T>;
	/**
	 * The RelationsService
	 */
	RelationsService: new (options: AbstractServiceOptions) => RelationsService;
	/**
	 * The RevisionsService
	 */
	RevisionsService: new (options: AbstractServiceOptions) => AbstractService<T> & RevisionsService;
	/**
	 * The RolesService
	 */
	RolesService: Service<T>;
	/**
	 * The SchemaService
	 */
	SchemaService: new (options: AbstractServiceOptions) => SchemaService;
	/**
	 * The ServerService
	 */
	ServerService: new (options: AbstractServiceOptions) => ServerService;
	/**
	 * The SettingsService
	 */
	SettingsService: Service<T>;
	/**
	 * The SharesService
	 */
	SharesService: new (options: AbstractServiceOptions) => AbstractService<T> & SharesService;
	/**
	 * The SpecificationService
	 */
	// SpecificationService: new <ST>(options: AbstractServiceOptions) => AbstractSpecificationService<ST>;
	/**
	 * The TFAService
	 */
	TFAService: new (options: AbstractServiceOptions) => TFAService;
	/**
	 * The TranslationsService
	 */
	TranslationsService: Service<T>;
	/**
	 * The UsersService
	 */
	UsersService: new (options: AbstractServiceOptions) => AbstractService<T> & UsersService;
	/**
	 * The UtilsService
	 */
	UtilsService: new (options: AbstractServiceOptions) => UtilsService;
	/**
	 * The VersionsService
	 */
	VersionsService: new (options: AbstractServiceOptions) => AbstractService<T> & VersionsService;
	/**
	 * The WebhooksService
	 */
	WebhooksService: Service<Webhook>;
	/**
	 * The WebSocketService
	 */
	// WebSocketService: new <WM, WC>() => AbstractWebSocketService<WM, WC>;
}
