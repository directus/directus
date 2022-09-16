import { Knex } from 'knex';
import { Accountability, Item, PrimaryKey, Query, SchemaOverview } from '../types';
import {
	ActivityService,
	AssetsService,
	AuthenticationService,
	AuthorizationService,
	CollectionsService,
	DashboardsService,
	ExportService,
	FieldsService,
	FilesService,
	FlowsService,
	FoldersService,
	GraphQLService,
	GraphQLServiceConstructor,
	ImportService,
	ItemsService,
	MailService,
	MetaService,
	NotificationsService,
	OperationsService,
	PanelsService,
	PayloadService,
	PermissionsService,
	PresetsService,
	RelationsService,
	RevisionsService,
	RolesService,
	ServerService,
	SettingsService,
	SharesService,
	SpecificationService,
	TFAService,
	UsersService,
	UtilsService,
	WebhooksService,
} from './index';

export type AbstractServiceOptions = {
	knex?: Knex;
	accountability?: Accountability | null;
	schema: SchemaOverview;
};

export interface AbstractService {
	knex: Knex;
	accountability: Accountability | null;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}

interface BasicServiceConstructor<T> extends Function {
	new (options: AbstractServiceOptions): T;
}

interface CollectionServiceConstructor<T> extends Function {
	new (collection: string, options: AbstractServiceOptions): T;
}

export type ServicesOverview = {
	ActivityService: BasicServiceConstructor<ActivityService>;
	AssetsService: BasicServiceConstructor<AssetsService>;
	AuthenticationService: BasicServiceConstructor<AuthenticationService>;
	AuthorizationService: BasicServiceConstructor<AuthorizationService>;
	CollectionsService: BasicServiceConstructor<CollectionsService>;
	DashboardsService: BasicServiceConstructor<DashboardsService>;
	ExportService: BasicServiceConstructor<ExportService>;
	FieldsService: BasicServiceConstructor<FieldsService>;
	FilesService: BasicServiceConstructor<FilesService>;
	FlowsService: BasicServiceConstructor<FlowsService>;
	FoldersService: BasicServiceConstructor<FoldersService>;
	GraphQLService: GraphQLServiceConstructor<GraphQLService>;
	ImportService: BasicServiceConstructor<ImportService>;
	ItemsService: CollectionServiceConstructor<ItemsService>;
	MailService: BasicServiceConstructor<MailService>;
	MetaService: BasicServiceConstructor<MetaService>;
	NotificationsService: BasicServiceConstructor<NotificationsService>;
	OperationsService: BasicServiceConstructor<OperationsService>;
	PanelsService: BasicServiceConstructor<PanelsService>;
	PayloadService: CollectionServiceConstructor<PayloadService>;
	PermissionsService: BasicServiceConstructor<PermissionsService>;
	PresetsService: BasicServiceConstructor<PresetsService>;
	RelationsService: BasicServiceConstructor<RelationsService>;
	RevisionsService: BasicServiceConstructor<RevisionsService>;
	RolesService: BasicServiceConstructor<RolesService>;
	ServerService: BasicServiceConstructor<ServerService>;
	SettingsService: BasicServiceConstructor<SettingsService>;
	SharesService: BasicServiceConstructor<SharesService>;
	SpecificationService: BasicServiceConstructor<SpecificationService>;
	TFAService: BasicServiceConstructor<TFAService>;
	UsersService: BasicServiceConstructor<UsersService>;
	UtilsService: BasicServiceConstructor<UtilsService>;
	WebhooksService: BasicServiceConstructor<WebhooksService>;
};
