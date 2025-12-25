import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { PrimaryKey } from '@directus/types';
import { toArray } from '@directus/utils';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { ItemsService } from '../../../services/items.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import { PrimaryKeyInputSchema, PrimaryKeyValidateSchema, QueryInputSchema, QueryValidateSchema } from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Component documentation paths
const COMPONENTS_DIR = resolve(__dirname, './components');
const COMPONENTS_OVERVIEW = resolve(COMPONENTS_DIR, './overview.md');
const COMPONENTS_DOCS_DIR = resolve(COMPONENTS_DIR, './docs');

const COLLECTION = 'directus_minis';

// Validation helper functions
interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

function extractReferences(schema: any, prefix: string): Set<string> {
	const refs = new Set<string>();

	function traverse(node: any) {
		if (!node || typeof node !== 'object') {
			// Check string values for references
			if (typeof node === 'string') {
				// Match state.xxx or actions.xxx patterns
				const regex = new RegExp(`${prefix}\\.([a-zA-Z_][a-zA-Z0-9_]*)`, 'g');
				let match;

				while ((match = regex.exec(node)) !== null) {
					refs.add(match[1]!);
				}
			}

			return;
		}

		if (Array.isArray(node)) {
			for (const item of node) traverse(item);
			return;
		}

		// Check all properties
		for (const [_key, value] of Object.entries(node)) {
			if (typeof value === 'string') {
				// Direct bindings like "state.count" or "actions.increment"
				const directMatch = value.match(new RegExp(`^${prefix}\\.([a-zA-Z_][a-zA-Z0-9_]*)$`));

				if (directMatch) {
					refs.add(directMatch[1]!);
				}

				// Action calls like "actions.press('7')"
				const callMatch = value.match(new RegExp(`^${prefix}\\.([a-zA-Z_][a-zA-Z0-9_]*)\\(`));

				if (callMatch) {
					refs.add(callMatch[1]!);
				}

				// Interpolations like "{{ state.count }}"
				const interpolationRegex = new RegExp(`\\{\\{\\s*${prefix}\\.([a-zA-Z_][a-zA-Z0-9_]*)`, 'g');
				let match;

				while ((match = interpolationRegex.exec(value)) !== null) {
					refs.add(match[1]!);
				}
			} else {
				traverse(value);
			}
		}
	}

	traverse(schema);
	return refs;
}

function extractScriptDefinitions(script: string, prefix: string): Set<string> {
	const defs = new Set<string>();

	// Match patterns like: state.xxx = or actions.xxx =
	const assignmentRegex = new RegExp(`${prefix}\\.([a-zA-Z_][a-zA-Z0-9_]*)\\s*=`, 'g');
	let match;

	while ((match = assignmentRegex.exec(script)) !== null) {
		defs.add(match[1]!);
	}

	return defs;
}

/**
 * Validates that ui_schema is valid JSON when status is 'published'.
 * Draft status allows invalid JSON so users can save work-in-progress.
 */
function validatePublishedUiSchema(item: { ui_schema?: any; status?: string | undefined }): void {
	if (item.status !== 'published') return;
	if (!item.ui_schema) return;

	if (typeof item.ui_schema === 'string') {
		try {
			JSON.parse(item.ui_schema);
		} catch {
			throw new InvalidPayloadError({
				reason: 'ui_schema must be valid JSON when status is "published"',
			});
		}
	}
}

function validateMiniApp(item: {
	ui_schema?: any;
	script?: string | null | undefined;
	name?: string | undefined;
}): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Parse ui_schema if it's a string
	let schema = item.ui_schema;

	if (typeof schema === 'string') {
		try {
			schema = JSON.parse(schema);
		} catch {
			errors.push('ui_schema is not valid JSON');
			return { valid: false, errors, warnings };
		}
	}

	if (!schema) {
		warnings.push('No ui_schema provided');
		return { valid: errors.length === 0, errors, warnings };
	}

	const script = item.script || '';

	// Extract references from schema
	const stateRefs = extractReferences(schema, 'state');
	const actionRefs = extractReferences(schema, 'actions');

	// Extract definitions from script
	const stateDefs = extractScriptDefinitions(script, 'state');
	const actionDefs = extractScriptDefinitions(script, 'actions');

	// Check for undefined state variables
	for (const ref of stateRefs) {
		if (!stateDefs.has(ref)) {
			errors.push(`state.${ref} is used in ui_schema but not initialized in script`);
		}
	}

	// Check for undefined actions
	for (const ref of actionRefs) {
		if (!actionDefs.has(ref)) {
			errors.push(`actions.${ref} is used in ui_schema but not defined in script`);
		}
	}

	// Check for unused definitions (warnings only)
	for (const def of stateDefs) {
		if (!stateRefs.has(def)) {
			warnings.push(`state.${def} is defined but not used in ui_schema`);
		}
	}

	for (const def of actionDefs) {
		if (def !== 'init' && !actionRefs.has(def)) {
			warnings.push(`actions.${def} is defined but not used in ui_schema`);
		}
	}

	return { valid: errors.length === 0, errors, warnings };
}

// UI Schema node structure
const UiSchemaNodeSchema: z.ZodType<any> = z.lazy(() =>
	z.object({
		type: z.string(),
		props: z.record(z.string(), z.any()).optional(),
		children: z.union([z.array(UiSchemaNodeSchema), z.string(), z.any()]).optional(),
		condition: z.string().optional(),
		// Iteration support
		iterate: z.string().optional(),
		as: z.string().optional(),
		template: z.lazy(() => UiSchemaNodeSchema).optional(),
	}),
);

// Mini-app data schema
const MiniAppInputSchema = z.object({
	id: z.string().uuid().optional(),
	name: z.string().optional(),
	icon: z.string().optional(),
	description: z.string().nullable().optional(),
	ui_schema: z.union([UiSchemaNodeSchema, z.string(), z.null()]).optional(),
	css: z.string().nullable().optional(),
	script: z.string().nullable().optional(),
	status: z.enum(['draft', 'published']).optional(),
});

const MiniAppValidateSchema = MiniAppInputSchema;

const MinisValidateSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('create'),
		data: z.union([z.array(MiniAppValidateSchema), MiniAppValidateSchema]),
		query: QueryValidateSchema.optional(),
	}),
	z.object({
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.object({
		action: z.literal('update'),
		data: z.union([z.array(MiniAppValidateSchema), MiniAppValidateSchema]),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	z.object({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
	// Validation action
	z.object({
		action: z.literal('validate'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		data: z.union([z.array(MiniAppValidateSchema), MiniAppValidateSchema]).optional(),
	}),
	// Component documentation actions
	z.object({
		action: z.literal('list_components'),
	}),
	z.object({
		action: z.literal('describe_component'),
		component: z.union([z.string(), z.array(z.string())]),
	}),
]);

const MinisInputSchema = z.object({
	action: z
		.enum(['create', 'read', 'update', 'delete', 'validate', 'list_components', 'describe_component'])
		.describe(
			`The operation to perform.

| Action | Description |
| :--- | :--- |
| \`create\` | Create new mini-app(s). **Validation is automatic.** |
| \`read\` | List or fetch specific mini-apps. |
| \`update\` | Modify existing mini-app(s). **Validation is automatic.** |
| \`delete\` | Remove mini-app(s). |
| \`validate\` | Manual check of ui_schema/script consistency. |
| \`list_components\` | Get overview of all available UI components. |
| \`describe_component\` | Get detailed documentation for one or more specific components. **Pass an array for efficiency.** |`
		),
	query: QueryInputSchema.optional(),
	keys: z.array(PrimaryKeyInputSchema).optional().describe('Primary keys of mini-apps to operate on'),
	data: z
		.union([z.array(MiniAppInputSchema), MiniAppInputSchema])
		.optional()
		.describe('Mini-app data for create/update operations'),
	component: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe('Component name or list of names for describe_component action (e.g., "v-select", ["v-select", "v-tabs"])'),
});

export const minis = defineTool<z.infer<typeof MinisValidateSchema>>({
	name: 'minis',
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Minis',
	},
	inputSchema: MinisInputSchema,
	validateSchema: MinisValidateSchema,
	endpoint({ data }) {
		if (!data || typeof data !== 'object' || !('id' in data)) {
			return;
		}

		return ['minis', String(data['id'])];
	},
	async handler({ args, schema, accountability }) {
		// Handle component documentation actions (no collection access needed)
		if (args.action === 'list_components') {
			try {
				const overview = requireText(COMPONENTS_OVERVIEW);

				return {
					type: 'text',
					data: overview,
				};
			} catch {
				return {
					type: 'text',
					data: 'Component documentation not available.',
				};
			}
		}

		if (args.action === 'describe_component') {
			const componentNames = toArray(args.component);
			const docs: string[] = [];

			for (const name of componentNames) {
				const componentName = name.toLowerCase().replace(/^v-/, '');
				const docPath = resolve(COMPONENTS_DOCS_DIR, `v-${componentName}.md`);

				if (existsSync(docPath)) {
					docs.push(requireText(docPath));
				} else {
					docs.push(`No detailed documentation found for "v-${componentName}".`);
				}
			}

			return {
				type: 'text',
				data: docs.join('\n\n---\n\n'),
			};
		}

		// Handle validate action - can work with data directly or fetch by keys
		if (args.action === 'validate') {
			const results: Array<{
				id: string | undefined;
				name: string | undefined;
				valid: boolean;
				errors: string[];
				warnings: string[];
			}> = [];

			// If data is provided, validate it directly
			if (args.data) {
				const items = toArray(args.data);

				for (const item of items) {
					const validation = validateMiniApp(item);

					results.push({
						id: item.id,
						name: item.name,
						...validation,
					});
				}
			}

			// If keys are provided, fetch and validate existing mini-apps
			if (args.keys && args.keys.length > 0) {
				// Check if the collection exists in schema
				if (COLLECTION in schema.collections === false) {
					throw new ForbiddenError();
				}

				const itemsService = new ItemsService(COLLECTION, {
					schema,
					accountability,
				});

				const existingItems = await itemsService.readMany(args.keys, {
					fields: ['id', 'name', 'ui_schema', 'script'],
				});

				for (const item of existingItems) {
					const validation = validateMiniApp(item as { ui_schema?: any; script?: string | null; name?: string });

					results.push({
						id: item['id'] as string,
						name: item['name'] as string,
						...validation,
					});
				}
			}

			if (results.length === 0) {
				return {
					type: 'text',
					data: 'No mini-apps to validate. Provide either `data` or `keys`.',
				};
			}

			const allValid = results.every((r) => r.valid);

			const summary = allValid
				? `All ${results.length} mini-app(s) passed validation.`
				: `${results.filter((r) => !r.valid).length} of ${results.length} mini-app(s) have errors.`;

			return {
				type: 'text',
				data: {
					summary,
					results,
				},
			};
		}

		// Check if the collection exists in schema
		if (COLLECTION in schema.collections === false) {
			throw new ForbiddenError();
		}

		const itemsService = new ItemsService(COLLECTION, {
			schema,
			accountability,
		});

		if (args.action === 'create') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			const data = toArray(args.data).map((item) => {
				if (item.ui_schema && typeof item.ui_schema === 'object') {
					item.ui_schema = JSON.stringify(item.ui_schema, null, 2);
				}

				return item;
			});

			// Validate required fields, consistency, and published status
			for (const item of data) {
				if (!item.name) {
					throw new InvalidPayloadError({ reason: 'name is required for creating a mini-app' });
				}

				// Automatic consistency validation
				const validation = validateMiniApp(item);

				if (!validation.valid) {
					throw new InvalidPayloadError({
						reason: `Validation failed: ${validation.errors.join('; ')}`,
					});
				}

				// Validate ui_schema is valid JSON when publishing
				validatePublishedUiSchema(item);
			}

			const savedKeys = await itemsService.createMany(data);
			const result = await itemsService.readMany(savedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result || null,
			};
		}

		if (args.action === 'read') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			let result = null;

			if (args.keys) {
				result = await itemsService.readMany(args.keys, sanitizedQuery);
			} else {
				result = await itemsService.readByQuery(sanitizedQuery);
			}

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'update') {
			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);

			let updatedKeys: PrimaryKey[] = [];

			if (Array.isArray(args.data)) {
				const data = args.data.map((item) => {
					if (item.ui_schema && typeof item.ui_schema === 'object') {
						item.ui_schema = JSON.stringify(item.ui_schema, null, 2);
					}

					// Automatic consistency validation
					const validation = validateMiniApp(item);

					if (!validation.valid) {
						throw new InvalidPayloadError({
							reason: `Validation failed for item ${item.id || '(new)'}: ${validation.errors.join('; ')}`,
						});
					}

					// Validate ui_schema is valid JSON when publishing
					validatePublishedUiSchema(item);

					return item;
				});

				updatedKeys = await itemsService.updateBatch(data);
			} else if (args.keys) {
				const data = { ...args.data };

				if (data.ui_schema && typeof data.ui_schema === 'object') {
					data.ui_schema = JSON.stringify(data.ui_schema, null, 2);
				}

				// Automatic consistency validation for single update
				const validation = validateMiniApp(data);

				if (!validation.valid) {
					throw new InvalidPayloadError({
						reason: `Validation failed: ${validation.errors.join('; ')}`,
					});
				}

				// Validate ui_schema is valid JSON when publishing
				validatePublishedUiSchema(data);

				updatedKeys = await itemsService.updateMany(args.keys, data);
			} else {
				throw new InvalidPayloadError({ reason: 'keys are required for update action' });
			}

			const result = await itemsService.readMany(updatedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			const deletedKeys = await itemsService.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});
