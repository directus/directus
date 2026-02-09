import type { Readable } from 'node:stream';
import type { Column, ForeignKey } from '@directus/schema';
import type { Archiver } from 'archiver';
import type { GraphQLSchema } from 'graphql';
import type { Knex } from 'knex';
import type { Transporter } from 'nodemailer';
import type { OpenAPIObject } from 'openapi3-ts/oas30';
import type { Accountability } from './accountability.js';
import type { TransformationSet } from './assets.js';
import type { LoginResult } from './authentication.js';
import type { ApiCollection, RawCollection } from './collection.js';
import type { DeploymentConfig, Project, ProviderType, StoredProject } from './deployment.js';
import type { ActionHandler } from './events.js';
import type { ApiOutput, ExtensionManager, ExtensionSettings } from './extensions/index.js';
import type { Field, RawField, Type } from './fields.js';
import type { BusboyFileStream, File } from './files.js';
import type { FlowRaw, OperationRaw } from './flows.js';
import type { GQLScope, GraphQLParams } from './graphql.js';
import type { ExportFormat } from './import-export.js';
import type { Item, MutationOptions, PrimaryKey, QueryOptions } from './items.js';
import type { EmailOptions } from './mail.js';
import type { CachedResult, DeepPartial } from './misc.js';
import type { Notification } from './notifications.js';
import type { PayloadAction, PayloadServiceProcessRelationResult } from './payload.js';
import type { ItemPermissions } from './permissions.js';
import type { Policy } from './policies.js';
import type { Aggregate, Query } from './query.js';
import type { Relation } from './relations.js';
import type { FieldOverview, SchemaOverview } from './schema.js';
import type { Snapshot, SnapshotDiff, SnapshotDiffWithHash, SnapshotWithHash } from './snapshot.js';
import type { Range, Stat } from './storage.js';
import type { RegisterUserInput } from './users.js';
import type { ContentVersion } from './versions.js';
import type { WebSocketClient, WebSocketMessage } from './websockets/index.js';

export type AbstractServiceOptions = {
	knex?: Knex | undefined;
	accountability?: Accountability | null | undefined;
	schema: SchemaOverview;
	nested?: string[];
};

/**
 * The AssetsService
 */
interface AssetsService {
	zipFiles(files: string[]): Promise<{
		archive: Archiver;
		complete: () => Promise<void>;
	}>;
	zipFolder(folder: string): Promise<{
		archive: Archiver;
		complete: () => Promise<void>;
		metadata: {
			name: string | undefined;
		};
	}>;
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
	readByQuery(): Promise<ApiCollection[]>;
	/**
	 * Get a single collection by name
	 */
	readOne(collectionKey: string): Promise<ApiCollection>;
	/**
	 * Read many collections by name
	 */
	readMany(collectionKeys: string[]): Promise<ApiCollection[]>;
	/**
	 * Update a single collection by name
	 */
	updateOne(collectionKey: string, data: Partial<ApiCollection>, opts?: MutationOptions): Promise<string>;
	/**
	 * Update multiple collections in a single transaction
	 */
	updateBatch(data: Partial<ApiCollection>[], opts?: MutationOptions): Promise<string[]>;
	/**
	 * Update multiple collections by name
	 */
	updateMany(collectionKeys: string[], data: Partial<ApiCollection>, opts?: MutationOptions): Promise<string[]>;
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
 * The ExtensionsService
 */
interface ExtensionsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	extensionsItemService: AbstractService<ExtensionSettings>;
	extensionsManager: ExtensionManager;
	install: (extensionId: string, versionId: string) => Promise<void>;
	uninstall: (id: string) => Promise<void>;
	reinstall: (id: string) => Promise<void>;
	readAll: () => Promise<ApiOutput[]>;
	readOne: (id: string) => Promise<ApiOutput>;
	updateOne: (id: string, data: DeepPartial<ApiOutput>) => Promise<ApiOutput>;
	deleteOne: (id: string) => Promise<void>;
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
 * The FoldersService
 */
interface FoldersService {
	/**
	 * Builds a full folder tree starting from a given root folder.
	 */
	buildTree(root: string): Promise<Map<string, string>>;
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
 * The GraphQLService
 */
interface GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	scope: GQLScope;
	execute: (params: GraphQLParams) => Promise<any>;
	getSchema: {
		(): Promise<GraphQLSchema>;
		(type: 'schema'): Promise<GraphQLSchema>;
		(type: 'sdl'): Promise<string | GraphQLSchema>;
	};
	read: (collection: string, query: Query) => Promise<Partial<Item>>;
	upsertSingleton: (
		collection: string,
		body: Record<string, any> | Record<string, any>[],
		query: Query,
	) => Promise<boolean | Partial<Item>>;
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
interface MailService {
	schema: SchemaOverview;
	accountability: Accountability | null;
	knex: Knex;
	mailer: Transporter;
	send: (options: EmailOptions) => Promise<any>;
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
interface RelationsService<T = Relation> {
	foreignKeys(collection?: string): Promise<ForeignKey[]>;
	readAll(collection?: string, opts?: QueryOptions, bypassCache?: boolean): Promise<T[]>;
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
 */
interface OASSpecsService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	generate: (host?: string) => Promise<OpenAPIObject>;
}

interface GraphQLSpecsService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	items: GraphQLService;
	system: GraphQLService;
	generate: (scope: 'items' | 'system') => Promise<string | GraphQLSchema | null>;
}

interface SpecificationService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	oas: OASSpecsService;
	graphql: GraphQLSpecsService;
}

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
 * The DeploymentService
 */
interface DeploymentService {
	readByProvider(provider: ProviderType, query?: Query): Promise<DeploymentConfig>;
	updateByProvider(provider: ProviderType, data: Partial<DeploymentConfig>): Promise<PrimaryKey>;
	deleteByProvider(provider: ProviderType): Promise<PrimaryKey>;
	getDriver(provider: ProviderType): Promise<unknown>;
	listProviderProjects(provider: ProviderType): Promise<CachedResult<Project[]>>;
	getProviderProject(provider: ProviderType, projectId: string): Promise<CachedResult<Project>>;
}

/**
 * The DeploymentProjectsService
 */
interface DeploymentProjectsService {
	updateSelection(
		deploymentId: string,
		create: { external_id: string; name: string }[],
		deleteIds: PrimaryKey[],
	): Promise<StoredProject[]>;
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
	getVersionSave(key: string, collection: string, item: string | undefined): Promise<ContentVersion | undefined>;
	save(key: PrimaryKey, data: Partial<Item>): Promise<Partial<Item>>;
	promote(version: PrimaryKey, mainHash: string, fields?: string[]): Promise<PrimaryKey>;
}

/**
 * The WebSocketService
 */
interface WebSocketService {
	on: (event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandler) => void;
	off: (event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandler) => void;
	broadcast: (message: string | WebSocketMessage, filter?: { user?: string; role?: string }) => void;
	clients: () => Set<WebSocketClient>;
}

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

export interface ExtensionsServices {
	/**
	 * The AccessService
	 */
	AccessService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The ActivityService
	 */
	ActivityService: new (options: AbstractServiceOptions) => AbstractService;
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
	CommentsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The DashboardsService
	 */
	DashboardsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The DeploymentService
	 */
	DeploymentService: new (options: AbstractServiceOptions) => AbstractService & DeploymentService;
	/**
	 * The DeploymentProjectsService
	 */
	DeploymentProjectsService: new (options: AbstractServiceOptions) => AbstractService & DeploymentProjectsService;
	/**
	 * The DeploymentRunsService
	 */
	DeploymentRunsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The ExportService
	 */
	ExportService: new (options: AbstractServiceOptions) => ExportService;
	/**
	 * The ExtensionsService
	 */
	ExtensionsService: new (options: AbstractServiceOptions) => ExtensionsService;
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
	FlowsService: new (options: AbstractServiceOptions) => AbstractService<FlowRaw>;
	/**
	 * The FoldersService
	 */
	FoldersService: new (options: AbstractServiceOptions) => AbstractService & FoldersService;
	/**
	 * The GraphQLService
	 */
	GraphQLService: new (options: AbstractServiceOptions & { scope: GQLScope }) => GraphQLService;
	/**
	 * The ImportService
	 */
	ImportService: new (options: AbstractServiceOptions) => ImportService;
	/**
	 * The ItemsService
	 */
	ItemsService: new <T extends Item = Item, Collection extends string = string>(
		collection: Collection,
		options: AbstractServiceOptions,
	) => AbstractService<T>;
	/**
	 * The MailService
	 */
	MailService: new (options: AbstractServiceOptions) => MailService;
	/**
	 * The MetaService
	 */
	MetaService: new (options: AbstractServiceOptions) => MetaService;
	/**
	 * The NotificationsService
	 */
	NotificationsService: new (options: AbstractServiceOptions) => AbstractService & NotificationsService;
	/**
	 * The OperationsService
	 */
	OperationsService: new (options: AbstractServiceOptions) => AbstractService<OperationRaw>;
	/**
	 * The PanelsService
	 */
	PanelsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The PayloadService
	 */
	PayloadService: new (collection: string, options: AbstractServiceOptions) => PayloadService;
	/**
	 * The PermissionsService
	 */
	PermissionsService: new (options: AbstractServiceOptions) => AbstractService & PermissionsService;
	/**
	 * The PoliciesService
	 */
	PoliciesService: new (options: AbstractServiceOptions) => AbstractService<Policy>;
	/**
	 * The PresetsService
	 */
	PresetsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The RelationsService
	 */
	RelationsService: new (options: AbstractServiceOptions) => RelationsService<Relation>;
	/**
	 * The RevisionsService
	 */
	RevisionsService: new (options: AbstractServiceOptions) => AbstractService & RevisionsService;
	/**
	 * The RolesService
	 */
	RolesService: new (options: AbstractServiceOptions) => AbstractService;
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
	SettingsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The SharesService
	 */
	SharesService: new (options: AbstractServiceOptions) => AbstractService & SharesService;
	/**
	 * The SpecificationService
	 */
	SpecificationService: new (options: AbstractServiceOptions) => SpecificationService;
	/**
	 * The TFAService
	 */
	TFAService: new (options: AbstractServiceOptions) => TFAService;
	/**
	 * The TranslationsService
	 */
	TranslationsService: new (options: AbstractServiceOptions) => AbstractService;
	/**
	 * The UsersService
	 */
	UsersService: new (options: AbstractServiceOptions) => AbstractService & UsersService;
	/**
	 * The UtilsService
	 */
	UtilsService: new (options: AbstractServiceOptions) => UtilsService;
	/**
	 * The VersionsService
	 */
	VersionsService: new (options: AbstractServiceOptions) => AbstractService & VersionsService;
	/**
	 * The WebSocketService
	 */
	WebSocketService: new () => WebSocketService;
}
