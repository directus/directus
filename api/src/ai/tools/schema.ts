import { z } from 'zod';

// PK
export const PrimaryKeyInputSchema = z.union([z.number(), z.string()]);
export const PrimaryKeyValidateSchema = z.union([z.number(), z.string()]);

// item
export const ItemInputSchema = z.record(z.string(), z.any());
export const ItemValidateSchema = z.record(z.string(), z.any());

// query
export const QueryInputSchema = z
	.object({
		fields: z.array(z.string()),
		sort: z.array(z.string()),
		filter: z.record(z.string(), z.any()),
		limit: z.number(),
		offset: z.number(),
		page: z.number(),
		search: z.string(),
		deep: z.record(z.string(), z.any()),
		alias: z.record(z.string(), z.string()),
		aggregate: z.object({
			count: z.array(z.string()).optional(),
			sum: z.array(z.string()).optional(),
			avg: z.array(z.string()).optional(),
			min: z.array(z.string()).optional(),
			max: z.array(z.string()).optional(),
		}),
		backlink: z.boolean(),
		version: z.string(),
		versionRaw: z.boolean(),
		export: z.string(),
		groupBy: z.array(z.string()),
	})
	.partial();

export const QueryValidateSchema = QueryInputSchema;

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

export const RawFieldItemValidateSchema = RawFieldItemInputSchema;

export const FieldItemInputSchema = z.object({
	field: z.string(),
	type: z.string().nullable(),
	name: z.string().optional(),
	collection: z.string().optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

export const FieldItemValidateSchema = FieldItemInputSchema;

// collection
export const CollectionItemInputSchema = z.object({
	collection: z.string(),
	fields: z.array(RawFieldItemInputSchema).optional(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	schema: z
		.union([z.object({}), z.null()])
		.optional()
		.describe('ALWAYS an empty object for new collections. Only send `null` or `undefined` for folder collections.'),
});

export const CollectionItemValidateCreateSchema = CollectionItemInputSchema;
export const CollectionItemValidateUpdateSchema = z.object({
	collection: z.string(),
	meta: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
	schema: z.union([z.record(z.string(), z.any()), z.null()]).optional(),
});

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

export const FileItemValidateSchema = FileItemInputSchema;

export const FileImportItemInputSchema = z.object({
	url: z.string(),
	file: FileItemInputSchema,
});

export const FileImportItemValidateSchema = z.object({
	url: z.string(),
	file: FileItemValidateSchema,
});

// opertations
export const OperationItemInputSchema = z
	.object({
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

export const OperationItemValidateSchema = OperationItemInputSchema;

// flow
export const FlowItemInputSchema = z
	.object({
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
		group: z.union([z.string(), z.null()]),
		sort: z.union([z.number(), z.null()]),
		collapse: z.enum(['open', 'closed']),
	})
	.partial();

export const FlowItemValidateSchema = FlowItemInputSchema;

// trigger flow
export const TriggerFlowInputSchema = z.object({
	id: PrimaryKeyInputSchema,
	collection: z.string(),
	keys: z.array(PrimaryKeyInputSchema).optional(),
	headers: z.record(z.string(), z.any()).optional(),
	query: z.record(z.string(), z.any()).optional(),
	data: z.record(z.string(), z.any()).optional(),
});

export const TriggerFlowValidateSchema = z.strictObject({
	id: PrimaryKeyValidateSchema,
	collection: z.string(),
	keys: z.array(PrimaryKeyValidateSchema).optional(),
	query: z.record(z.string(), z.any()).optional(),
	headers: z.record(z.string(), z.any()).optional(),
	data: z.record(z.string(), z.any()).optional(),
});

// folder
export const FolderItemInputSchema = z.object({
	id: PrimaryKeyInputSchema.optional(),
	name: z.string(),
	parent: z.string().optional(),
});

export const FolderItemValidateSchema = FolderItemInputSchema;

// relation
export const RelationItemInputSchema = z.object({
	collection: z.string(),
	field: z.string(),
	related_collection: z.union([z.string(), z.null()]),
	schema: z.union([z.record(z.string(), z.any()), z.null()]),
	meta: z.union([z.record(z.string(), z.any()), z.null()]),
});

const RelationMetaSchema = z.object({
	id: z.number(),
	many_collection: z.string(),
	many_field: z.string(),
	one_collection: z.string().nullable(),
	one_field: z.string().nullable(),
	one_collection_field: z.string().nullable(),
	one_allowed_collections: z.array(z.string()).nullable(),
	one_deselect_action: z.enum(['nullify', 'delete']),
	junction_field: z.string().nullable(),
	sort_field: z.string().nullable(),
	system: z.boolean().optional(),
});

const FkActionEnum = z.enum(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']);

export const ForeignKeySchema = z.object({
	table: z.string(),
	column: z.string(),
	foreign_key_table: z.string(),
	foreign_key_column: z.string(),
	foreign_key_schema: z.string().optional(),
	constraint_name: z.union([z.string(), z.null()]),
	on_update: z.union([FkActionEnum, z.null()]),
	on_delete: z.union([FkActionEnum, z.null()]),
});

export const RelationItemValidateCreateSchema = z.object({
	collection: z.string(),
	field: z.string(),
	related_collection: z.string().nullable(),
	schema: ForeignKeySchema.partial().nullable().optional(),
	meta: RelationMetaSchema.partial().nullable(),
});

export const RelationItemValidateUpdateSchema = z
	.object({
		collection: z.string(),
		field: z.string(),
		related_collection: z.string().nullable().optional(),
		schema: ForeignKeySchema.partial().nullable().optional(),
		meta: RelationMetaSchema.partial().nullable().optional(),
	})
	.optional();
