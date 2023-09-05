import type { Table } from "@directus/schema";
import type { Field, RawField, Type } from "../fields.js";
import type { Item, PrimaryKey } from "../items.js";
import type { Query } from "../query.js";
import type { Relation } from "../relations.js";
import type { ActionHandlerSecure } from "../events.js";

export type MutationOptionsSecure = {
	autoPurgeCache?: false | undefined;
	autoPurgeSystemCache?: false | undefined;
	emitEvents?: boolean | undefined;
	bypassLimits?: boolean | undefined;
};

export type PermissionsActionSecure = 'create' | 'read' | 'update' | 'delete' | 'comment' | 'explain' | 'share';

export type QueryOptionsSecure = {
	stripNonRequested?: boolean;
	permissionsAction?: PermissionsActionSecure;
	emitEvents?: boolean;
};

export declare class ItemsServiceSecure<InternalItem extends Item = Item> {
	constructor(collection: string);

	getKeysByQuery(query: Query): Promise<PrimaryKey[]>;
	createOne(data: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	createMany(data: Partial<InternalItem>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	readByQuery(query: Query, opts?: QueryOptionsSecure): Promise<InternalItem[]>
	readOne(key: PrimaryKey, query?: Query, opts?: QueryOptionsSecure): Promise<InternalItem>
	readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptionsSecure): Promise<InternalItem[]>
	updateByQuery(query: Query, data: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	updateOne(key: PrimaryKey, data: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	updateBatch(data: Partial<InternalItem>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	updateMany(keys: PrimaryKey[], data: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	upsertOne(payload: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	upsertMany(payloads: Partial<InternalItem>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	deleteByQuery(query: Query, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	deleteOne(key: PrimaryKey, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	deleteMany(keys: PrimaryKey[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	readSingleton(query: Query, opts?: QueryOptionsSecure): Promise<Partial<InternalItem>>
	upsertSingleton(data: Partial<InternalItem>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
}

export declare class ActivityServiceSecure extends ItemsServiceSecure {
	constructor();

	createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
}

export type CollectionMetaSecure = {
	collection: string;
	note: string | null;
	hidden: boolean;
	singleton: boolean;
	icon: string | null;
	translations: Record<string, string>;
	branches_enabled: boolean;
	item_duplication_fields: string[] | null;
	accountability: 'all' | 'accountability' | null;
	group: string | null;
}

export type RawCollectionSecure = {
	collection: string;
	fields?: RawField[];
	schema?: Partial<Table> | null;
	meta?: Partial<CollectionMetaSecure> | null;
};

export type CollectionSecure = {
	collection: string;
	fields?: Field[];
	meta: CollectionMetaSecure | null;
	schema: Table | null;
};

export declare class CollectionsServiceSecure extends ItemsServiceSecure {
	constructor();

	createOne(data: RawCollectionSecure, opts?: MutationOptionsSecure): Promise<string>
	createMany(payloads: RawCollectionSecure[], opts?: MutationOptionsSecure): Promise<string[]>
	readByQuery(): Promise<CollectionSecure[]>
	readOne(collectionKey: string): Promise<CollectionSecure>
	readMany(collectionKeys: string[]): Promise<CollectionSecure[]>
	updateOne(collectionKey: string, data: Partial<CollectionSecure>, opts?: MutationOptionsSecure): Promise<string>
	updateBatch(data: Partial<CollectionSecure>[], opts?: MutationOptionsSecure): Promise<string[]>
	updateMany(collectionKeys: string[], data: Partial<CollectionSecure>, opts?: MutationOptionsSecure): Promise<string[]>
	deleteOne(collectionKey: string, opts?: MutationOptionsSecure): Promise<string>
	deleteMany(collectionKeys: string[], opts?: MutationOptionsSecure): Promise<string[]>
}

export declare class DashboardsServiceSecure extends ItemsServiceSecure {
	constructor();
}

export declare class FieldsServiceSecure {
	constructor();

	readAll(collection?: string): Promise<Field[]>
	readOne(collection: string, field: string): Promise<Record<string, any>>
	createField(collection: string, field: Partial<Field> & { field: string; type: Type | null }, table?: undefined, opts?: MutationOptionsSecure): Promise<void>
	updateField(collection: string, field: RawField, opts?: MutationOptionsSecure): Promise<string>
	deleteField(collection: string, field: string, opts?: MutationOptionsSecure): Promise<void>
}

export declare class FlowsServiceSecure {
	constructor();

	createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	createMany(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	updateBatch(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	deleteMany(keys: PrimaryKey[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
}

export declare class NotificationsServiceSecure extends ItemsServiceSecure {
	constructor();

	createOne(data: Partial<Notification>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	createMany(data: Partial<Notification>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	sendEmail(data: Partial<Notification>): Promise<void>
}

export declare class OperationsServiceSecure extends ItemsServiceSecure {
	constructor();

	override createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	override createMany(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	override updateBatch(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	override updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	override deleteMany(keys: PrimaryKey[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
}

export declare class PanelsServiceSecure extends ItemsServiceSecure {
	constructor();
}

export declare class PresetsServiceSecure extends ItemsServiceSecure {
	constructor();
}

export declare class RelationsServiceSecure {
	constructor();

	readAll(collection?: string, opts?: QueryOptionsSecure): Promise<Relation[]>
	readOne(collection: string, field: string): Promise<Relation>
	createOne(relation: Partial<Relation>, opts?: MutationOptionsSecure): Promise<void>
	updateOne(collection: string, field: string, relation: Partial<Relation>, opts?: MutationOptionsSecure): Promise<void>
	deleteOne(collection: string, field: string, opts?: MutationOptionsSecure): Promise<void>
}

export declare class RevisionsServiceSecure extends ItemsServiceSecure {
	constructor();

	revert(pk: PrimaryKey): Promise<void>
	createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	createMany(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
}

export declare class ServerServiceSecure {
	constructor();

	serverInfo(): Promise<Record<string, any>>
	health(): Promise<Record<string, any>>
}

export declare class SettingsServiceSecure extends ItemsServiceSecure {
	constructor();
}

export type LoginResultSecure = {
	accessToken: any;
	refreshToken: any;
	expires: any;
	id?: any;
};


export declare class SharesServiceSecure extends ItemsServiceSecure {
	constructor();

	createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	login(payload: Record<string, any>): Promise<LoginResultSecure>
	invite(payload: { emails: string[]; share: PrimaryKey }): Promise<void>
}

export declare class TranslationsServiceSecure extends ItemsServiceSecure {
	constructor();

	createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
}

export declare class UtilsServiceSecure extends ItemsServiceSecure {
	constructor();

	sort(collection: string, { item, to }: { item: PrimaryKey; to: PrimaryKey }): Promise<void>
}

export declare class WebhooksServiceSecure extends ItemsServiceSecure {
	constructor();

	override createOne(data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey>
	override createMany(data: Partial<Item>[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	override updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
	override deleteMany(keys: PrimaryKey[], opts?: MutationOptionsSecure): Promise<PrimaryKey[]>
}

export declare class WebSocketServiceSecure {
	constructor();

	on(event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandlerSecure): void
	off(event: 'connect' | 'message' | 'error' | 'close', callback: ActionHandlerSecure): void
	broadcast(message: string, filter?: { user?: string; role?: string }): void
	clients(): Set<Record<string, any>>
}
