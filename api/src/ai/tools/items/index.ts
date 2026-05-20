import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublishedVersionKey } from '@directus/constants';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { Accountability, Item, PrimaryKey, SchemaOverview } from '@directus/types';
import {
	buildPayload,
	isObject,
	mergeNestedRelationDeltaInto,
	REFUSAL,
	resolveWriteTarget,
	toArray,
} from '@directus/utils';
import { z } from 'zod';
import type { ChatContext } from '../../chat/models/chat-request.js';
import { CollectionsService } from '../../../services/collections.js';
import { ItemsService } from '../../../services/items.js';
import { VersionsService } from '../../../services/versions.js';
import { ensureVersionId } from '../../../utils/ensure-version-id.js';
import { requireText } from '../../../utils/require-text.js';
import { defineTool } from '../define-tool.js';
import {
	ItemInputSchema,
	ItemValidateSchema,
	PrimaryKeyInputSchema,
	PrimaryKeyValidateSchema,
	QueryInputSchema,
	QueryValidateSchema,
} from '../schema.js';
import { buildSanitizedQueryFromArgs } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PartialItemInputSchema = z.strictObject({
	collection: z.string(),
});

const ItemsValidateSchema = z.discriminatedUnion('action', [
	PartialItemInputSchema.extend({
		action: z.literal('create'),
		data: z.union([z.array(ItemValidateSchema), ItemValidateSchema]),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('read'),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('update'),
		data: z.union([z.array(ItemValidateSchema), ItemValidateSchema]),
		keys: z.array(PrimaryKeyValidateSchema).optional(),
		query: QueryValidateSchema.optional(),
	}),
	PartialItemInputSchema.extend({
		action: z.literal('delete'),
		keys: z.array(PrimaryKeyValidateSchema),
	}),
]);

const ItemsInputSchema = z.object({
	action: z.enum(['create', 'read', 'update', 'delete']).describe('The operation to perform'),
	collection: z.string().describe('The name of the collection'),
	query: QueryInputSchema.optional(),
	keys: z.array(PrimaryKeyInputSchema).optional(),
	data: z
		.union([z.array(ItemInputSchema), ItemInputSchema])
		.optional()
		.describe('Object when using keys, array with PKs for batch updates'),
});

type ItemsArgs = z.infer<typeof ItemsValidateSchema>;

export const items = defineTool<z.infer<typeof ItemsValidateSchema>>({
	name: 'items',
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Items',
	},
	inputSchema: ItemsInputSchema,
	validateSchema: ItemsValidateSchema,
	endpoint({ input, data }) {
		if (!isObject(data) || !('id' in data)) {
			return;
		}

		return ['content', input.collection, data['id']];
	},
	async handler({ args, schema, accountability, context }) {
		if (isSystemCollection(args.collection)) {
			throw new InvalidPayloadError({ reason: 'Cannot provide a core collection' });
		}

		if (args.collection in schema.collections === false) {
			throw new ForbiddenError();
		}

		const isSingleton = schema.collections[args.collection]?.singleton ?? false;

		const itemsService = new ItemsService(args.collection, {
			schema,
			accountability,
		});

		const collectionHasVersioning = createCollectionVersioningResolver(schema, accountability);

		if (args.action === 'create') {
			if (hasDraftVersionHint(args.query?.version, context)) {
				throw new InvalidPayloadError({
					reason: `${REFUSAL.VERSIONING_REQUIRED} Creating items through a content version is not supported.`,
				});
			}

			const sanitizedQuery = await buildSanitizedQueryFromArgs(args, schema, accountability);
			const data = toArray(args.data);

			if (isSingleton) {
				if (Array.isArray(args.data)) {
					throw new InvalidPayloadError({ reason: 'Invalid data payload, object exptected' });
				}

				await itemsService.upsertSingleton(args.data);

				const item = await itemsService.readSingleton(sanitizedQuery);

				return {
					type: 'text',
					data: item || null,
				};
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

			if (isSingleton) {
				result = await itemsService.readSingleton(sanitizedQuery);
			} else if (args.keys) {
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
			const collectionIsVersioned = await collectionHasVersioning(args.collection);
			const needsVersionRouting = collectionIsVersioned || hasDraftVersionHint(args.query?.version, context);

			if (isSingleton) {
				if (Array.isArray(args.data)) {
					throw new InvalidPayloadError({ reason: 'Invalid data payload, object expected' });
				}

				if (needsVersionRouting) {
					const primaryKeyField = getPrimaryKeyField(schema, args.collection);
					const singleton = await itemsService.readSingleton({ fields: [primaryKeyField] });
					const singletonKey = singleton?.[primaryKeyField];

					if (singletonKey === undefined || singletonKey === null) {
						if (collectionIsVersioned) {
							throw new InvalidPayloadError({
								reason: `${REFUSAL.NO_PUBLISHED_SINGLETON} Versioned singleton has no published row to version.`,
							});
						}

						await itemsService.upsertSingleton(args.data);

						const item = await itemsService.readSingleton(sanitizedQuery);

						return {
							type: 'text',
							data: item || null,
						};
					}

					const result = await updateWithVersionRouting({
						args,
						schema,
						accountability,
						context,
						sanitizedQuery,
						itemsService,
						collectionHasVersioning,
						updates: [{ key: singletonKey as PrimaryKey, data: args.data }],
						isSingleton,
					});

					return {
						type: 'text',
						data: result[0] ?? null,
					};
				}

				await itemsService.upsertSingleton(args.data);

				const item = await itemsService.readSingleton(sanitizedQuery);

				return {
					type: 'text',
					data: item || null,
				};
			}

			if (needsVersionRouting) {
				const updates = getKeyedUpdates(args, getPrimaryKeyField(schema, args.collection));

				if (updates.length === 0) {
					throw new InvalidPayloadError({
						reason: `${REFUSAL.NO_KEYS} Versioned updates require explicit item keys.`,
					});
				}

				const result = await updateWithVersionRouting({
					args,
					schema,
					accountability,
					context,
					sanitizedQuery,
					itemsService,
					collectionHasVersioning,
					updates,
					isSingleton,
				});

				return {
					type: 'text',
					data: result,
				};
			}

			let updatedKeys: PrimaryKey[] = [];

			if (Array.isArray(args.data)) {
				updatedKeys = await itemsService.updateBatch(args.data);
			} else if (args.keys) {
				updatedKeys = await itemsService.updateMany(args.keys, args.data);
			} else {
				updatedKeys = await itemsService.updateByQuery(sanitizedQuery, args.data);
			}

			const result = await itemsService.readMany(updatedKeys, sanitizedQuery);

			return {
				type: 'text',
				data: result,
			};
		}

		if (args.action === 'delete') {
			if (hasDraftVersionHint(args.query?.version, context)) {
				throw new InvalidPayloadError({
					reason: `${REFUSAL.VERSIONING_REQUIRED} Deleting items through a content version is not supported.`,
				});
			}

			const deletedKeys = await itemsService.deleteMany(args.keys);

			return {
				type: 'text',
				data: deletedKeys,
			};
		}

		throw new Error('Invalid action.');
	},
});

async function updateWithVersionRouting({
	args,
	schema,
	accountability,
	context,
	sanitizedQuery,
	itemsService,
	collectionHasVersioning,
	updates,
	isSingleton,
}: {
	args: ItemsArgs;
	schema: SchemaOverview;
	accountability: Accountability | undefined;
	context: ChatContext | undefined;
	sanitizedQuery: Record<string, any>;
	itemsService: ItemsService;
	collectionHasVersioning: (collection: string) => Promise<boolean>;
	updates: { key: PrimaryKey; data: Item }[];
	isSingleton: boolean;
}) {
	const versionsService = new VersionsService({ schema, accountability });
	const results: unknown[] = [];
	const parentBatches = new Map<string, { collection: string; item: PrimaryKey; versionKey: string; payload: Item }>();

	for (const update of updates) {
		const target = await resolveWriteTarget({
			schema,
			target: { collection: args.collection, key: update.key },
			hint: getVersionHint(args, update.key, context),
			collectionHasVersioning,
			readParent: async (parent, fields) => {
				const parentService = new ItemsService(parent.collection, { schema, accountability });

				return parentService.readOne(parent.key, {
					fields,
					version: parent.versionKey,
					versionRaw: false,
				});
			},
		});

		if (target.kind === 'refuse') {
			throw new InvalidPayloadError({ reason: target.message });
		}

		if (target.kind === 'published') {
			if (isSingleton) {
				await itemsService.upsertSingleton(update.data);
				results.push(await itemsService.readSingleton(sanitizedQuery));
			} else {
				await itemsService.updateOne(target.key, update.data);
				results.push(await itemsService.readOne(target.key, sanitizedQuery));
			}

			continue;
		}

		const payload = buildPayload(target, update.data, update.key);

		if (target.kind === 'item-version') {
			const versionId = await ensureVersionId(versionsService, {
				collection: target.collection,
				item: target.key,
				versionKey: target.versionKey,
			});

			await versionsService.save(versionId, payload);

			const readQuery = {
				...sanitizedQuery,
				version: target.versionKey,
				versionRaw: false,
			};

			if (isSingleton) {
				results.push(await itemsService.readSingleton(readQuery));
			} else {
				const readService = new ItemsService(args.collection, { schema, accountability });
				const items = await readService.readMany([target.key], readQuery);
				results.push(items[0] ?? null);
			}

			continue;
		}

		const batchKey = `${target.parent.collection}:${target.parent.key}:${target.parent.versionKey}`;
		const batch = parentBatches.get(batchKey);

		if (batch) {
			mergePayloadForSingleSave(batch.payload, payload);
		} else {
			parentBatches.set(batchKey, {
				collection: target.parent.collection,
				item: target.parent.key,
				versionKey: target.parent.versionKey,
				payload,
			});
		}

		results.push(null);
	}

	for (const batch of parentBatches.values()) {
		const versionId = await ensureVersionId(versionsService, batch);
		await versionsService.save(versionId, batch.payload);
	}

	return results;
}

function getKeyedUpdates(args: ItemsArgs, primaryKeyField: string): { key: PrimaryKey; data: Item }[] {
	if (Array.isArray(args.data)) {
		return args.data.map((item) => {
			const key = item[primaryKeyField];

			if (key === undefined || key === null) {
				throw new InvalidPayloadError({
					reason: `${REFUSAL.NO_KEYS} Batch updates against versions require "${primaryKeyField}".`,
				});
			}

			return { key: key as PrimaryKey, data: item };
		});
	}

	if (args.keys) {
		return args.keys.map((key) => ({ key, data: args.data }));
	}

	return [];
}

function createCollectionVersioningResolver(schema: SchemaOverview, accountability: Accountability | undefined) {
	const cache = new Map<string, boolean>();
	let collectionsService: CollectionsService | null = null;

	return async function collectionHasVersioning(collection: string) {
		const cached = cache.get(collection);
		if (cached !== undefined) return cached;

		collectionsService ??= new CollectionsService({ schema, accountability });

		const collectionInfo = await collectionsService.readOne(collection);
		const hasVersioning = Boolean(collectionInfo.meta?.versioning);

		cache.set(collection, hasVersioning);

		return hasVersioning;
	};
}

function getVersionHint(args: ItemsArgs, key: PrimaryKey, context: ChatContext | undefined) {
	const visualElement = context?.attachments?.find((attachment) => {
		if (attachment.type !== 'visual-element') return false;
		if (attachment.data.collection !== args.collection) return false;

		return String(attachment.data.item) === String(key);
	});

	const visualElementParent = visualElement?.data.parent;

	return {
		explicitVersion: args.query?.version,
		page: context?.page,
		attachment: visualElement
			? {
					collection: visualElement.data.collection,
					item: visualElement.data.item,
					version: visualElement.data.version,
					parent: visualElementParent
						? {
								collection: visualElementParent.collection,
								key: visualElementParent.item,
								versionKey: visualElementParent.version,
							}
						: null,
				}
			: null,
	};
}

function hasDraftVersionHint(queryVersion: string | null | undefined, context: ChatContext | undefined) {
	if (isDraftVersionKey(queryVersion)) return true;
	if (isDraftVersionKey(context?.page?.version)) return true;

	return (
		context?.attachments?.some((attachment) => {
			if (attachment.type !== 'visual-element') return false;
			if (isDraftVersionKey(attachment.data.version)) return true;

			return isDraftVersionKey(attachment.data.parent?.version);
		}) ?? false
	);
}

function isDraftVersionKey(versionKey: string | null | undefined) {
	return Boolean(versionKey && !isPublishedVersionKey(versionKey));
}

function getPrimaryKeyField(schema: SchemaOverview, collection: string) {
	return schema.collections[collection]?.primary ?? 'id';
}

function mergePayloadForSingleSave(target: Item, source: Item) {
	for (const [field, incoming] of Object.entries(source)) {
		const existing = target[field];

		if (
			isObject(existing) &&
			isObject(incoming) &&
			!isDetailedUpdatePayload(existing) &&
			!isDetailedUpdatePayload(incoming)
		) {
			target[field] = { ...existing, ...incoming };
			continue;
		}

		mergeNestedRelationDeltaInto(target, { [field]: incoming });
	}
}

function isDetailedUpdatePayload(value: unknown) {
	return (
		isObject(value) &&
		Array.isArray(value['create']) &&
		Array.isArray(value['update']) &&
		Array.isArray(value['delete'])
	);
}
