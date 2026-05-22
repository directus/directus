import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublishedVersionKey } from '@directus/constants';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { Accountability, Item, PrimaryKey, SchemaOverview } from '@directus/types';
import {
	buildPayload,
	findParentInitialValue,
	findParentRelationCandidates,
	getSchemaPrimaryKeyFields,
	isObject,
	mergeNestedRelationDeltaInto,
	type ParentRef,
	type ParentRelation,
	prefixChildFields,
	resolveWriteTarget,
	toArray,
	WRITE_TARGET_REFUSAL,
} from '@directus/utils';
import { z } from 'zod';
import { CollectionsService } from '../../../services/collections.js';
import { ItemsService } from '../../../services/items.js';
import { VersionsService } from '../../../services/versions.js';
import { ensureVersionId } from '../../../utils/ensure-version-id.js';
import { requireText } from '../../../utils/require-text.js';
import type { ChatContext } from '../../chat/models/chat-request.js';
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

const ITEM_TOOL_REFUSAL = {
	NO_KEYS: 'NO_KEYS',
	NO_PUBLISHED_SINGLETON: 'NO_PUBLISHED_SINGLETON',
} as const;

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
			if (hasDraftVersionHint(args, context, schema)) {
				throw new InvalidPayloadError({
					reason: formatVersioningRefusal(
						WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED,
						'Creating items through a content version is not supported.',
					),
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
			const needsVersionRouting = collectionIsVersioned || hasDraftVersionHint(args, context, schema);

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
								reason: formatVersioningRefusal(
									ITEM_TOOL_REFUSAL.NO_PUBLISHED_SINGLETON,
									'Versioned singleton has no published row to version.',
								),
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
						reason: formatVersioningRefusal(ITEM_TOOL_REFUSAL.NO_KEYS, 'Versioned updates require explicit item keys.'),
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
			if (hasDraftVersionHint(args, context, schema)) {
				throw new InvalidPayloadError({
					reason: formatVersioningRefusal(
						WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED,
						'Deleting items through a content version is not supported.',
					),
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
	const deferredReads: Array<{ index: number; key: PrimaryKey; parent: ParentRef; relation: ParentRelation }> = [];
	const parentBatches = new Map<string, { collection: string; item: PrimaryKey; versionKey: string; payload: Item }>();
	const identityFields = getSchemaPrimaryKeyFields(schema);

	for (const update of updates) {
		const target = await resolveWriteTarget({
			schema,
			target: { collection: args.collection, key: update.key },
			hint: getVersionHint(args, update.key, context),
			collectionHasVersioning,
			readParent: async (parent, fields) => {
				// Materialize the version row before reading. ItemsService.readOne with `version`
				// throws 403 when no directus_versions row exists for that (collection, item, key).
				// Phase 2 will teach handleVersion to fall back to published.
				await ensureVersionId(versionsService, {
					collection: parent.collection,
					item: parent.key,
					versionKey: parent.versionKey,
				});

				const parentService = new ItemsService(parent.collection, { schema, accountability });

				return parentService.readOne(parent.key, {
					fields,
					version: parent.versionKey,
					versionRaw: false,
				});
			},
		});

		if (target.kind === 'refuse') {
			throw new InvalidPayloadError({ reason: formatVersioningRefusal(target.token, target.message) });
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
			mergeNestedRelationDeltaInto(batch.payload, payload, { identityFields });
		} else {
			parentBatches.set(batchKey, {
				collection: target.parent.collection,
				item: target.parent.key,
				versionKey: target.parent.versionKey,
				payload,
			});
		}

		deferredReads.push({
			index: results.length,
			key: update.key,
			parent: target.parent,
			relation: target.relation,
		});

		results.push(null);
	}

	for (const batch of parentBatches.values()) {
		const versionId = await ensureVersionId(versionsService, batch);
		await versionsService.save(versionId, batch.payload);
	}

	// Child rows don't get their own directus_versions entries when edits route through
	// a parent — the row exists against the parent collection. Reading the child at the
	// parent's version key would 403 in handleVersion. Read the parent at its version
	// instead and pluck the child out of the draft-merged relation array; this also
	// reflects draft edits accumulated across earlier turns, not just this call.
	for (const deferred of deferredReads) {
		const parentService = new ItemsService(deferred.parent.collection, { schema, accountability });

		const requestedFields =
			Array.isArray(sanitizedQuery['fields']) && sanitizedQuery['fields'].length ? sanitizedQuery['fields'] : ['*'];
		const childFields = requestedFields.includes('*')
			? requestedFields
			: Array.from(new Set([deferred.relation.childPkField, ...requestedFields]));

		const parentItem = await parentService.readOne(deferred.parent.key, {
			fields: prefixChildFields(deferred.relation, childFields),
			version: deferred.parent.versionKey,
			versionRaw: false,
		});

		results[deferred.index] = parentItem
			? findParentInitialValue(deferred.relation, parentItem, args.collection, deferred.key)
			: null;
	}

	return results;
}

function getKeyedUpdates(args: ItemsArgs, primaryKeyField: string): { key: PrimaryKey; data: Item }[] {
	if (Array.isArray(args.data)) {
		return args.data.map((item) => {
			const key = item[primaryKeyField];

			if (key === undefined || key === null) {
				throw new InvalidPayloadError({
					reason: formatVersioningRefusal(
						ITEM_TOOL_REFUSAL.NO_KEYS,
						`Batch updates against versions require "${primaryKeyField}".`,
					),
				});
			}

			return { key: key as PrimaryKey, data: item };
		});
	}

	if (args.keys) {
		return args.keys.map((key) => ({ key, data: { ...args.data } }));
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
		page:
			context?.page?.collection === args.collection && String(context.page.item) !== String(key)
				? undefined
				: context?.page,
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

function hasDraftVersionHint(args: ItemsArgs, context: ChatContext | undefined, schema: SchemaOverview) {
	if (isDraftVersionKey(args.query?.version)) return true;

	if (context?.page?.collection === args.collection && isDraftVersionKey(context.page.version)) {
		const pkField = getPrimaryKeyField(schema, args.collection);
		const pageItemStr = String(context.page.item);

		const hasMatchingKey =
			args.keys?.some((k) => String(k) === pageItemStr) ||
			(Array.isArray(args.data) && args.data.some((d) => String(d[pkField]) === pageItemStr));

		if (hasMatchingKey) return true;
	}

	if (
		context?.page?.collection &&
		isDraftVersionKey(context.page.version) &&
		hasParentRelationPath(schema, context.page.collection, args.collection)
	) {
		return true;
	}

	return (
		context?.attachments?.some((attachment) => {
			if (attachment.type !== 'visual-element') return false;
			if (attachment.data.collection !== args.collection) return false;
			if (isDraftVersionKey(attachment.data.version)) return true;

			return isDraftVersionKey(attachment.data.parent?.version);
		}) ?? false
	);
}

function isDraftVersionKey(versionKey: string | null | undefined) {
	return Boolean(versionKey && !isPublishedVersionKey(versionKey));
}

function hasParentRelationPath(schema: SchemaOverview, parentCollection: string, targetCollection: string) {
	return findParentRelationCandidates(schema, parentCollection, targetCollection).length > 0;
}

function formatVersioningRefusal(token: string, message: string) {
	if (token === WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED) return `[VERSIONING_REQUIRED] ${message}`;
	return `[VERSIONING_REQUIRED:${token}] ${message}`;
}

function getPrimaryKeyField(schema: SchemaOverview, collection: string) {
	return schema.collections[collection]?.primary ?? 'id';
}
