import type { Field, SnapshotRelation } from '@directus/types';
import { z } from 'zod';
import { getSnapshot } from '../../utils/get-snapshot.js';
import { defineTool } from '../define.js';
import prompts from './prompts/index.js';

export interface fieldOverviewOutput {
	type: string;
	primary_key?: boolean;
	required?: boolean;
	readonly?: boolean;
	note?: string;
	interface?: {
		type: string;
		choices?: Array<string | number>;
	};
	relation?: {
		type: string;
		related_collections: string[];
	};
	fields?: Record<string, fieldOverviewOutput>;
	value?: string;
}

export interface OverviewOutput {
	[collection: string]: {
		[field: string]: fieldOverviewOutput;
	};
}

export const OverviewValidateSchema = z.object({
	keys: z.array(z.string()).optional(),
});

export const OverviewInputSchema = z.object({
	keys: z
		.array(z.string())
		.optional()
		.describe(
			'Collection names to get detailed schema for. If omitted, returns a lightweight list of all collections.',
		),
});

export const schema = defineTool<z.infer<typeof OverviewValidateSchema>>({
	name: 'schema',
	admin: true,
	description: prompts.schema,
	inputSchema: OverviewInputSchema,
	validateSchema: OverviewValidateSchema,
	async handler({ args }) {
		const snapshot = await getSnapshot();

		// If no keys provided, return lightweight collection list
		if (!args.keys || args.keys.length === 0) {
			const collections: string[] = [];
			const folders: string[] = [];
			const notes: Record<string, string> = {};

			snapshot.collections.forEach((collection) => {
				// Separate folders from real collections
				if (!collection.schema) {
					folders.push(collection.collection);
				} else {
					collections.push(collection.collection);
				}

				// Extract note if exists (for both collections and folders)
				if (collection.meta?.note) {
					notes[collection.collection] = collection.meta.note;
				}
			});

			return {
				type: 'text',
				data: {
					collections,
					folders,
					notes,
				},
			};
		}

		// If keys provided, return detailed schema for requested collections
		const overview: OverviewOutput = {};

		const relations: { [collection: string]: SnapshotRelation } = {};

		snapshot.relations.forEach((relation) => {
			relations[relation.collection] = relation;
		});

		snapshot.fields.forEach((field) => {
			// Skip collections not requested
			if (!args.keys?.includes(field.collection)) return;

			// Skip UI-only fields
			if (field.type === 'alias' && field.meta?.special?.includes('no-data')) return;

			if (!overview[field.collection]) {
				overview[field.collection] = {};
			}

			const fieldOverview: fieldOverviewOutput = {
				type: field.type,
			};

			if (field.schema?.is_primary_key) {
				fieldOverview.primary_key = field.schema?.is_primary_key;
			}

			if (field.meta.required) {
				fieldOverview.required = field.meta.required;
			}

			if (field.meta.readonly) {
				fieldOverview.readonly = field.meta.readonly;
			}

			if (field.meta.note) {
				fieldOverview.note = field.meta.note;
			}

			if (field.meta.interface) {
				fieldOverview.interface = {
					type: field.meta.interface,
				};

				if (field.meta.options?.['choices']) {
					fieldOverview.interface.choices = field.meta.options['choices'];
				}
			}

			// Process nested fields for JSON fields with options.fields (like repeaters)
			if (field.type === 'json' && field.meta.options?.['fields']) {
				const nestedFields = field.meta.options['fields'] as any[];

				fieldOverview.fields = processNestedFields({
					fields: nestedFields,
					maxDepth: 5,
					currentDepth: 0,
					snapshot,
				});
			}

			// Handle collection-item-dropdown interface
			if (field.type === 'json' && field.meta.interface === 'collection-item-dropdown') {
				fieldOverview.fields = processCollectionItemDropdown({
					field,
					snapshot,
				});
			}

			const relation = relations[field.collection] as SnapshotRelation | undefined;

			if (field.meta?.special && relation) {
				let type;

				if (field.meta.special.includes('m2o') || field.meta.special.includes('file')) {
					type = 'm2o';
				} else if (field.meta.special.includes('o2m')) {
					type = 'o2m';
				} else if (field.meta.special.includes('m2m') || field.meta.special.includes('files')) {
					type = 'm2m';
				} else if (field.meta.special.includes('m2a')) {
					type = 'm2a';
				}

				if (type) {
					let relatedCollections: string[] = [];

					if (relation.related_collection) {
						relatedCollections.push(relation.related_collection);
					} else if (type === 'm2a' && relation.meta.one_allowed_collections) {
						relatedCollections = relation.meta.one_allowed_collections;
					}

					fieldOverview.relation = {
						type,
						related_collections: relatedCollections,
					};
				}
			}

			overview[field.collection]![field.field] = fieldOverview;
		});

		return {
			type: 'text',
			data: overview,
		};
	},
});

// Helpers
function processNestedFields(options: {
	fields: any[];
	maxDepth?: number;
	currentDepth?: number;
	snapshot?: any;
}): Record<string, fieldOverviewOutput> {
	const { fields, maxDepth = 5, currentDepth = 0, snapshot } = options;
	const result: Record<string, fieldOverviewOutput> = {};

	if (currentDepth >= maxDepth) {
		return result;
	}

	if (!Array.isArray(fields)) {
		return result;
	}

	for (const field of fields) {
		const fieldKey = field.field || field.name;
		if (!fieldKey) continue;

		const fieldOverview: fieldOverviewOutput = {
			type: field.type ?? 'any',
		};

		if (field.meta) {
			const { required, readonly, note, interface: interfaceConfig, options } = field.meta;

			if (required) fieldOverview.required = required;
			if (readonly) fieldOverview.readonly = readonly;
			if (note) fieldOverview.note = note;

			if (interfaceConfig) {
				fieldOverview.interface = { type: interfaceConfig };

				if (options?.choices) {
					fieldOverview.interface.choices = options.choices;
				}
			}
		}

		// Handle nested fields recursively
		const nestedFields = field.meta?.options?.fields || field.options?.fields;

		if (field.type === 'json' && nestedFields) {
			fieldOverview.fields = processNestedFields({
				fields: nestedFields,
				maxDepth,
				currentDepth: currentDepth + 1,
				snapshot,
			});
		}

		// Handle collection-item-dropdown interface
		if (field.type === 'json' && field.meta?.interface === 'collection-item-dropdown') {
			fieldOverview.fields = processCollectionItemDropdown({
				field,
				snapshot,
			});
		}

		result[fieldKey] = fieldOverview;
	}

	return result;
}

function processCollectionItemDropdown(options: { field: Field; snapshot?: any }): Record<string, fieldOverviewOutput> {
	const { field, snapshot } = options;
	const selectedCollection = field.meta?.options?.['selectedCollection'];
	let keyType = 'string | number | uuid';

	// Find the primary key type for the selected collection
	if (selectedCollection && snapshot?.fields) {
		const primaryKeyField = snapshot.fields.find(
			(f: any) => f.collection === selectedCollection && f.schema?.is_primary_key,
		);

		if (primaryKeyField) {
			keyType = primaryKeyField.type;
		}
	}

	return {
		collection: {
			value: selectedCollection,
			type: 'string',
		},
		key: {
			type: keyType,
		},
	};
}
