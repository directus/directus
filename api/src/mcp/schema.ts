import type {
	Collection,
	Field,
	File,
	FlowRaw,
	Item,
	OperationRaw,
	PrimaryKey,
	Query,
	RawCollection,
	RawField,
	Relation,
	Type,
} from '@directus/types';
import { z } from 'zod';

// PK
export const PrimaryKeyInputSchema = z.union([z.number(), z.string()]);
export const PrimaryKeyValidateSchema = z.custom<PrimaryKey>();

// item
export const ItemInputSchema = z.record(z.string(), z.any());
export const ItemValidateSchema = z.custom<Item>();

// query
export const QueryInputSchema = z.object({
	fields: z.array(z.string()).optional(),
	sort: z.array(z.string()).optional(),
	filter: z.record(z.string(), z.any()).optional(),
	limit: z.number().optional(),
	offset: z.number().optional(),
	page: z.number().optional(),
	search: z.string().optional(),
	deep: z.record(z.string(), z.any()).optional(),
	alias: z.record(z.string(), z.string()).optional(),
	aggregate: z
		.object({
			count: z.array(z.string()).optional(),
			sum: z.array(z.string()).optional(),
			avg: z.array(z.string()).optional(),
			min: z.array(z.string()).optional(),
			max: z.array(z.string()).optional(),
		})
		.optional(),
	backlink: z.boolean().optional(),
	version: z.string().optional(),
	versionRaw: z.boolean().optional(),
	export: z.string(),
	group: z.array(z.string()),
});

export const QueryValidateSchema = z.custom<Query>();

// field
export const RawFieldItemInputSchema = z.object({
	field: z.string(),
	type: z.string(),
	name: z.string().optional(),
	children: z.union([z.array(z.record(z.string(), z.any())), z.null()]).optional(),
	collection: z.string().optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

export const RawFieldItemValidateSchema = z.custom<RawField>();

export const FieldItemInputSchema = z.object({
	field: z.string(),
	type: z.string(),
	name: z.string().optional(),
	collection: z.string().optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

export const FieldItemValidateSchema = z.custom<
	Partial<Field> & {
		field: string;
		type: Type | null;
	}
>();

// collection
export const CollectionItemInputSchema = z.object({
	collection: z.string(),
	fields: z.array(RawFieldItemInputSchema).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

export const CollectionItemValidateCreateSchema = z.custom<RawCollection>();
export const CollectionItemValidateUpdateSchema = z.custom<Collection>();

// file
export const FileItemInputSchema = z
	.object({
		id: z.string(),
		storage: z.string(),
		filename_disk: z.string(),
		filename_download: z.string(),
		title: z.union([z.string(), z.null()]),
		type: z.union([z.string(), z.null()]),
		folder: z.union([z.string(), z.null()]),
		created_on: z.string(),
		uploaded_by: z.union([z.string(), z.null()]),
		uploaded_on: z.union([z.string(), z.null()]),
		modified_by: z.union([z.string(), z.null()]),
		modified_on: z.string(),
		charset: z.union([z.string(), z.null()]),
		filesize: z.number(),
		width: z.union([z.number(), z.null()]),
		height: z.union([z.number(), z.null()]),
		duration: z.union([z.number(), z.null()]),
		embed: z.union([z.string(), z.null()]),
		description: z.union([z.string(), z.null()]),
		location: z.union([z.string(), z.null()]),
		tags: z.union([z.string(), z.null()]),
		metadata: z.union([z.record(z.string(), z.any()), z.null()]),
		focal_point_x: z.union([z.number(), z.null()]),
		focal_point_y: z.union([z.number(), z.null()]),
		tus_id: z.union([z.string(), z.null()]),
		tus_data: z.union([z.record(z.string(), z.any()), z.null()]),
	})
	.partial();

export const FileItemValidateSchema = z.custom<Partial<File>>();

// opertations
export const OperationItemInputSchema = z
	.strictObject({
		id: z.string(),
		name: z.union([z.string(), z.null()]),
		key: z.string(),
		type: z.string(),
		position_x: z.number(),
		position_y: z.number(),
		options: z.record(z.string(), z.any()),
		resolve: z.union([z.string(), z.null()]),
		reject: z.union([z.string(), z.null()]),
		flow: z.string(),
		date_created: z.string(),
		user_created: z.string(),
	})
	.partial();

export const OperationItemValidateSchema = z.custom<Partial<OperationRaw>>();

// flow
export const FlowItemInputSchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.union([z.string(), z.null()]),
	color: z.union([z.string(), z.null()]),
	description: z.union([z.string(), z.null()]),
	status: z.enum(['active', 'inactive']),
	trigger: z.union([z.enum(['event', 'schedule', 'operation', 'webhook', 'manual']), z.null()]),
	options: z.union([z.record(z.string(), z.any()), z.null()]),
	operation: z.union([z.string(), z.null()]),
	operations: z.array(OperationItemInputSchema),
	date_created: z.string(),
	user_created: z.string(),
	accountability: z.union([z.enum(['all', 'activity']), z.null()]),
});

export const FlowItemValidateSchema = z.custom<Partial<FlowRaw>>();

// folder
export const FolderItemInputSchema = z.object({
	id: PrimaryKeyInputSchema.optional(),
	name: z.string(),
	parent: z.string().optional(),
});

export const FolderItemValidateSchema = FolderItemInputSchema;

// relation
export const RelationItemSchema = z.object({
	collection: z.string(),
	field: z.string(),
	related_collection: z.union([z.string(), z.null()]),
	schema: z.union([z.record(z.string(), z.any()), z.null()]),
	meta: z.union([z.record(z.string(), z.any()), z.null()]),
});

export const RelationItemValidateCreateSchema = z.custom<Relation>();
export const RelationItemValidateUpdateSchema = z.custom<Partial<Relation>>();
