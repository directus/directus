import { isPublishedVersionKey } from '@directus/constants';
import type { Item, PrimaryKey, Relation, RelationMeta, SchemaOverview } from '@directus/types';
import { isDetailedUpdateSyntax } from './is-detailed-update-syntax.js';
import { isObject } from './is-object.js';

type RelationWithOneField = Relation & { meta: RelationMeta & { one_field: string } };
type ParentJunctionRelation = Relation & {
	meta: RelationMeta & { one_field: string; junction_field: string };
};

export const WRITE_TARGET_REFUSAL = {
	VERSIONING_REQUIRED: 'VERSIONING_REQUIRED',
	NO_PARENT_CONTEXT: 'NO_PARENT_CONTEXT',
	NO_PARENT_PATH: 'NO_PARENT_PATH',
	MULTI_RELATION: 'MULTI_RELATION',
	RELATED_NOT_FOUND: 'RELATED_ITEM_NOT_FOUND',
	STALE_ATTACHMENT: 'STALE_ATTACHMENT',
} as const;

export type WriteTargetRefusalToken = (typeof WRITE_TARGET_REFUSAL)[keyof typeof WRITE_TARGET_REFUSAL];

export type ParentRef = {
	collection: string;
	key: PrimaryKey;
	versionKey: string;
};

export type VersionHint = {
	explicitVersion?: string | null;
	page?: {
		collection?: string;
		item?: PrimaryKey;
		version?: string | null;
	} | null;
	attachment?: {
		collection?: string;
		item?: PrimaryKey;
		version?: string | null;
		parent?: {
			collection: string;
			key: PrimaryKey;
			versionKey?: string | null;
		} | null;
	} | null;
};

export type ParentRelation =
	| { kind: 'o2m'; parentField: string; childPkField: string }
	| {
			kind: 'm2m';
			parentField: string;
			junctionCollection: string;
			junctionPkField: string;
			junctionField: string;
			junctionItem: Item;
			childPkField: string;
	  }
	| {
			kind: 'm2a';
			parentField: string;
			junctionCollection: string;
			junctionPkField: string;
			junctionField: string;
			collectionField: string;
			junctionItem: Item;
			childPkField: string;
	  }
	| { kind: 'm2o'; parentField: string; childPkField: string };

export type WriteTarget =
	| { kind: 'published'; collection: string; key: PrimaryKey }
	| { kind: 'item-version'; collection: string; key: PrimaryKey; versionKey: string }
	| { kind: 'parent-version'; parent: ParentRef; relation: ParentRelation; parentItem: Item };

export type ResolveResult = WriteTarget | { kind: 'refuse'; token: WriteTargetRefusalToken; message: string };

export type MergeNestedRelationDeltaOptions = {
	identityFields?: Iterable<string>;
};

export type ParentRelationCandidate =
	| { kind: 'o2m'; parentField: string; childPkField: string }
	| {
			kind: 'm2m';
			parentField: string;
			junctionCollection: string;
			junctionPkField: string;
			junctionField: string;
			childPkField: string;
	  }
	| {
			kind: 'm2a';
			parentField: string;
			junctionCollection: string;
			junctionPkField: string;
			junctionField: string;
			collectionField: string;
			childPkField: string;
	  }
	| { kind: 'm2o'; parentField: string; childPkField: string };

export async function resolveWriteTarget(input: {
	schema: SchemaOverview;
	target: { collection: string; key: PrimaryKey };
	hint?: VersionHint;
	collectionHasVersioning: (collection: string) => boolean | Promise<boolean>;
	readParent: (ref: ParentRef, fields: string[]) => Promise<Item | null>;
}): Promise<ResolveResult> {
	const hint = input.hint ?? {};
	const versionKey = resolveVersionKey(hint);
	const targetIsVersioned = await input.collectionHasVersioning(input.target.collection);

	if (targetIsVersioned) {
		if (!versionKey || isPublishedVersionKey(versionKey)) {
			return refuse(
				WRITE_TARGET_REFUSAL.VERSIONING_REQUIRED,
				'Updates to versioned collections require a draft version.',
			);
		}

		return {
			kind: 'item-version',
			collection: input.target.collection,
			key: input.target.key,
			versionKey,
		};
	}

	const parent = resolveParentRef(hint);

	if (!parent) {
		if (versionKey && !isPublishedVersionKey(versionKey)) {
			return refuse(
				WRITE_TARGET_REFUSAL.NO_PARENT_CONTEXT,
				'A parent item is required to save this child item to a version.',
			);
		}

		return { kind: 'published', collection: input.target.collection, key: input.target.key };
	}

	const parentIsVersioned = await input.collectionHasVersioning(parent.collection);

	if (!parentIsVersioned || isPublishedVersionKey(parent.versionKey)) {
		return { kind: 'published', collection: input.target.collection, key: input.target.key };
	}

	const candidates = findParentRelationCandidates(input.schema, parent.collection, input.target.collection);

	if (candidates.length === 0) {
		return refuse(
			WRITE_TARGET_REFUSAL.NO_PARENT_PATH,
			'No relation path exists from the parent item to this target item.',
		);
	}

	const matches: { relation: ParentRelation; parentItem: Item }[] = [];

	for (const candidate of candidates) {
		const parentItem = await input.readParent(parent, getParentReadFields(candidate));
		if (!parentItem) continue;

		const relation = findTargetInParentItem(candidate, parentItem, input.target.collection, input.target.key);
		if (relation) matches.push({ relation, parentItem });
	}

	if (matches.length > 1) {
		return refuse(WRITE_TARGET_REFUSAL.MULTI_RELATION, 'Multiple parent relations contain this target item.');
	}

	if (matches.length === 0) {
		const token = hint.attachment ? WRITE_TARGET_REFUSAL.STALE_ATTACHMENT : WRITE_TARGET_REFUSAL.RELATED_NOT_FOUND;

		const message = hint.attachment
			? 'The visual element no longer matches the parent item.'
			: 'The target item was not found in the parent version.';

		return refuse(token, message);
	}

	const winner = matches[0]!;
	return { kind: 'parent-version', parent, relation: winner.relation, parentItem: winner.parentItem };
}

export function buildPayload(target: WriteTarget, edits: Item, childPk: PrimaryKey): Item {
	if (target.kind !== 'parent-version') return edits;

	const relation = target.relation;

	if (relation.kind === 'o2m') {
		return {
			[relation.parentField]: {
				create: [],
				update: [{ [relation.childPkField]: childPk, ...edits }],
				delete: [],
			},
		};
	}

	if (relation.kind === 'm2m') {
		return {
			[relation.parentField]: {
				create: [],
				update: [
					{
						[relation.junctionPkField]: relation.junctionItem[relation.junctionPkField],
						[relation.junctionField]: { [relation.childPkField]: childPk, ...edits },
					},
				],
				delete: [],
			},
		};
	}

	if (relation.kind === 'm2a') {
		return {
			[relation.parentField]: {
				create: [],
				update: [
					{
						[relation.junctionPkField]: relation.junctionItem[relation.junctionPkField],
						[relation.collectionField]: relation.junctionItem[relation.collectionField],
						[relation.junctionField]: { [relation.childPkField]: childPk, ...edits },
					},
				],
				delete: [],
			},
		};
	}

	return {
		[relation.parentField]: { [relation.childPkField]: childPk, ...edits },
	};
}

export function mergeNestedRelationDeltaInto(
	target: Item,
	source: Item,
	options: MergeNestedRelationDeltaOptions = {},
): Item {
	const identityFields = normalizeIdentityFields(options.identityFields);

	for (const [field, incoming] of Object.entries(source)) {
		const existing = target[field];

		if (isDetailedUpdateSyntax(existing) && isDetailedUpdateSyntax(incoming)) {
			target[field] = reconcileDetailedUpdate(existing, incoming, identityFields);

			continue;
		}

		// Same-identity plain objects (e.g. m2o relation rewrites) accumulate field-by-field
		// instead of overwriting, so successive autosaves don't drop earlier draft edits.
		if (hasSameUpdateIdentity(existing, incoming, identityFields)) {
			target[field] = mergeUpdateEntry(existing, incoming, identityFields);
			continue;
		}

		target[field] = incoming;
	}

	return target;
}

export function getSchemaPrimaryKeyFields(schema: SchemaOverview): string[] {
	const fields = new Set<string>();

	for (const collection of Object.values(schema.collections)) {
		if (collection?.primary) fields.add(collection.primary);
	}

	return normalizeIdentityFields(fields);
}

function normalizeIdentityFields(fields: Iterable<string> | undefined): string[] {
	const normalized = new Set<string>();

	for (const field of fields ?? []) {
		if (field) normalized.add(field);
	}

	normalized.add('id');

	return [...normalized].sort((left, right) => {
		if (left === 'id') return 1;
		if (right === 'id') return -1;
		return 0;
	});
}

function reconcileDetailedUpdate(
	existing: { create: unknown[]; update: unknown[]; delete: unknown[] },
	incoming: { create: unknown[]; update: unknown[]; delete: unknown[] },
	identityFields: string[],
): { create: unknown[]; update: unknown[]; delete: unknown[] } {
	// Incoming wins across buckets: a later delete supersedes earlier create/update for
	// the same identity, and a later create/update supersedes an earlier delete.
	const incomingDeleteIds = collectScalarIdentities(incoming.delete);
	const incomingMutateIds = collectEntryIdentities([incoming.create, incoming.update], identityFields);

	return {
		create: [
			...existing.create.filter((entry) => !entryMatchesIdentity(entry, identityFields, incomingDeleteIds)),
			...incoming.create,
		],
		update: mergeDetailedUpdateEntries(
			existing.update.filter((entry) => !entryMatchesIdentity(entry, identityFields, incomingDeleteIds)),
			incoming.update,
			identityFields,
		),
		delete: [
			...existing.delete.filter((value) => {
				const id = scalarIdentity(value);
				return id === undefined || !incomingMutateIds.has(id);
			}),
			...incoming.delete,
		],
	};
}

function collectScalarIdentities(values: unknown[]): Set<string> {
	const ids = new Set<string>();

	for (const value of values) {
		const id = scalarIdentity(value);
		if (id !== undefined) ids.add(id);
	}

	return ids;
}

function collectEntryIdentities(buckets: unknown[][], identityFields: string[]): Set<string> {
	const ids = new Set<string>();

	for (const bucket of buckets) {
		for (const entry of bucket) {
			if (!isObject(entry)) continue;

			for (const field of identityFields) {
				const value = entry[field];
				if (value !== null && value !== undefined) ids.add(String(value));
			}
		}
	}

	return ids;
}

function entryMatchesIdentity(entry: unknown, identityFields: string[], ids: Set<string>): boolean {
	if (ids.size === 0 || !isObject(entry)) return false;

	for (const field of identityFields) {
		const value = entry[field];
		if (value === null || value === undefined) continue;
		if (ids.has(String(value))) return true;
	}

	return false;
}

function scalarIdentity(value: unknown): string | undefined {
	if (value === null || value === undefined) return undefined;
	if (typeof value === 'object') return undefined;
	return String(value);
}

function mergeDetailedUpdateEntries(existing: unknown[], incoming: unknown[], identityFields: string[]): unknown[] {
	const merged = [...existing];

	for (const incomingEntry of incoming) {
		const existingIndex = merged.findIndex((existingEntry) =>
			hasSameUpdateIdentity(existingEntry, incomingEntry, identityFields),
		);

		if (existingIndex === -1) {
			merged.push(incomingEntry);
			continue;
		}

		merged[existingIndex] = mergeUpdateEntry(merged[existingIndex], incomingEntry, identityFields);
	}

	return merged;
}

function mergeUpdateEntry(existing: unknown, incoming: unknown, identityFields: string[]): unknown {
	if (!isObject(existing) || !isObject(incoming)) return incoming;

	const merged: Item = { ...existing, ...incoming };

	for (const [field, incomingValue] of Object.entries(incoming)) {
		const existingValue = existing[field];

		if (hasSameUpdateIdentity(existingValue, incomingValue, identityFields)) {
			merged[field] = mergeUpdateEntry(existingValue, incomingValue, identityFields);
		}
	}

	return merged;
}

function hasSameUpdateIdentity(existing: unknown, incoming: unknown, identityFields: string[]): boolean {
	if (!isObject(existing) || !isObject(incoming)) return false;

	for (const field of identityFields) {
		const existingId = getUpdateIdentity(existing, field);
		const incomingId = getUpdateIdentity(incoming, field);

		if (existingId === undefined || incomingId === undefined) continue;
		if (String(existingId) === String(incomingId)) return true;
	}

	return false;
}

function getUpdateIdentity(value: Item, field: string): unknown {
	const id = value[field];
	if (id === null) return undefined;

	return id;
}

function resolveVersionKey(hint: VersionHint): string | undefined {
	return (
		hint.explicitVersion ||
		hint.attachment?.parent?.versionKey ||
		hint.attachment?.version ||
		hint.page?.version ||
		undefined
	);
}

function resolveParentRef(hint: VersionHint): ParentRef | null {
	const attachmentParent = hint.attachment?.parent;
	const attachmentParentVersion = hint.explicitVersion || attachmentParent?.versionKey || hint.attachment?.version;

	if (attachmentParent && attachmentParentVersion) {
		return {
			collection: attachmentParent.collection,
			key: attachmentParent.key,
			versionKey: attachmentParentVersion,
		};
	}

	const pageVersion = hint.explicitVersion || hint.page?.version;

	if (hint.page?.collection && hint.page.item !== undefined && pageVersion) {
		return {
			collection: hint.page.collection,
			key: hint.page.item,
			versionKey: pageVersion,
		};
	}

	return null;
}

function refuse(token: WriteTargetRefusalToken, message: string): ResolveResult {
	return { kind: 'refuse', token, message };
}

export function findParentRelationCandidates(
	schema: SchemaOverview,
	parentCollection: string,
	targetCollection: string,
): ParentRelationCandidate[] {
	const candidates: ParentRelationCandidate[] = [];

	for (const relation of schema.relations) {
		if (isO2MRelation(relation, parentCollection, targetCollection)) {
			candidates.push({
				kind: 'o2m',
				parentField: relation.meta.one_field,
				childPkField: primaryKeyField(schema, targetCollection),
			});

			continue;
		}

		if (isParentJunctionRelation(relation, parentCollection)) {
			const partner = findJunctionPartner(schema.relations, relation, targetCollection);
			if (!partner) continue;

			const junctionPkField = primaryKeyField(schema, relation.collection);
			const childPkField = primaryKeyField(schema, targetCollection);
			const collectionField = partner.meta?.one_collection_field;

			if (collectionField) {
				candidates.push({
					kind: 'm2a',
					parentField: relation.meta.one_field,
					junctionCollection: relation.collection,
					junctionPkField,
					junctionField: relation.meta.junction_field,
					collectionField,
					childPkField,
				});
			} else {
				candidates.push({
					kind: 'm2m',
					parentField: relation.meta.one_field,
					junctionCollection: relation.collection,
					junctionPkField,
					junctionField: relation.meta.junction_field,
					childPkField,
				});
			}

			continue;
		}

		if (isM2ORelation(relation, parentCollection, targetCollection)) {
			candidates.push({
				kind: 'm2o',
				parentField: relation.field,
				childPkField: primaryKeyField(schema, targetCollection),
			});
		}
	}

	return candidates;
}

function isO2MRelation(
	relation: Relation,
	parentCollection: string,
	targetCollection: string,
): relation is RelationWithOneField {
	return (
		relation.collection === targetCollection &&
		relation.related_collection === parentCollection &&
		typeof relation.meta?.one_field === 'string' &&
		relation.meta.one_field.length > 0 &&
		!relation.meta.junction_field
	);
}

function isParentJunctionRelation(relation: Relation, parentCollection: string): relation is ParentJunctionRelation {
	return (
		relation.related_collection === parentCollection &&
		typeof relation.meta?.one_field === 'string' &&
		relation.meta.one_field.length > 0 &&
		typeof relation.meta?.junction_field === 'string' &&
		relation.meta.junction_field.length > 0
	);
}

function isM2ORelation(relation: Relation, parentCollection: string, targetCollection: string) {
	return (
		relation.collection === parentCollection &&
		relation.related_collection === targetCollection &&
		!relation.meta?.junction_field
	);
}

function findJunctionPartner(relations: Relation[], relation: Relation, targetCollection: string) {
	const junctionField = relation.meta?.junction_field;
	if (!junctionField) return null;

	return (
		relations.find((candidate) => {
			if (candidate.collection !== relation.collection) return false;
			if (candidate.field !== junctionField) return false;

			const allowedCollections = candidate.meta?.one_allowed_collections;

			if (candidate.meta?.one_collection_field && allowedCollections) {
				return allowedCollections.includes(targetCollection);
			}

			return candidate.related_collection === targetCollection;
		}) ?? null
	);
}

function primaryKeyField(schema: SchemaOverview, collection: string) {
	return schema.collections[collection]?.primary ?? 'id';
}

function getParentReadFields(candidate: ParentRelationCandidate): string[] {
	if (candidate.kind === 'm2o') return [`${candidate.parentField}.*`];

	if (candidate.kind === 'o2m') {
		return [`${candidate.parentField}.${candidate.childPkField}`];
	}

	if (candidate.kind === 'm2m') {
		return [
			`${candidate.parentField}.${candidate.junctionPkField}`,
			`${candidate.parentField}.${candidate.junctionField}.${candidate.childPkField}`,
		];
	}

	return [
		`${candidate.parentField}.${candidate.junctionPkField}`,
		`${candidate.parentField}.${candidate.collectionField}`,
		`${candidate.parentField}.${candidate.junctionField}.*`,
	];
}

function findTargetInParentItem(
	candidate: ParentRelationCandidate,
	parentItem: Item,
	targetCollection: string,
	targetKey: PrimaryKey,
): ParentRelation | null {
	if (candidate.kind === 'm2o') {
		const child = parentItem[candidate.parentField];
		if (!isObject(child)) return null;
		if (!sameKey(child[candidate.childPkField], targetKey)) return null;

		return candidate;
	}

	const relatedValue = parentItem[candidate.parentField];
	if (!Array.isArray(relatedValue)) return null;

	if (candidate.kind === 'o2m') {
		const child = relatedValue.find((item) => isObject(item) && sameKey(item[candidate.childPkField], targetKey));
		if (!child) return null;
		return candidate;
	}

	for (const junctionItem of relatedValue) {
		if (!isObject(junctionItem)) continue;

		const child = junctionItem[candidate.junctionField];
		if (!isObject(child)) continue;
		if (!sameKey(child[candidate.childPkField], targetKey)) continue;

		if (candidate.kind === 'm2a' && junctionItem[candidate.collectionField] !== targetCollection) {
			continue;
		}

		return { ...candidate, junctionItem };
	}

	return null;
}

export function prefixChildFields(relation: ParentRelation, childFields: string[]): string[] {
	if (relation.kind === 'm2o' || relation.kind === 'o2m') {
		return childFields.map((field) => `${relation.parentField}.${field}`);
	}

	const path = `${relation.parentField}.${relation.junctionField}`;
	const prefixed = childFields.map((field) => `${path}.${field}`);

	// M2A junctions are polymorphic; include the collection discriminator so post-save
	// readback can reject entries that point at another collection sharing the child PK.
	if (relation.kind === 'm2a') {
		return [`${relation.parentField}.${relation.collectionField}`, ...prefixed];
	}

	return prefixed;
}

export function getParentInitialValueFields(relation: ParentRelation): string[] {
	if (relation.kind === 'm2o') return [`${relation.parentField}.*`];
	if (relation.kind === 'o2m') return [`${relation.parentField}.*`];

	if (relation.kind === 'm2m') {
		return [
			`${relation.parentField}.${relation.junctionPkField}`,
			`${relation.parentField}.${relation.junctionField}.*`,
		];
	}

	return [
		`${relation.parentField}.${relation.junctionPkField}`,
		`${relation.parentField}.${relation.collectionField}`,
		`${relation.parentField}.${relation.junctionField}.*`,
	];
}

export function findParentInitialValue(
	relation: ParentRelation,
	parentItem: Item,
	targetCollection: string,
	targetKey: PrimaryKey,
): Item | null {
	if (relation.kind === 'm2o') {
		const child = parentItem[relation.parentField];
		if (!isObject(child)) return null;
		return sameKey(child[relation.childPkField], targetKey) ? child : null;
	}

	const relatedValue = parentItem[relation.parentField];
	if (!Array.isArray(relatedValue)) return null;

	if (relation.kind === 'o2m') {
		const child = relatedValue.find((item) => isObject(item) && sameKey(item[relation.childPkField], targetKey));
		return isObject(child) ? child : null;
	}

	for (const junctionItem of relatedValue) {
		if (!isObject(junctionItem)) continue;

		const child = junctionItem[relation.junctionField];
		if (!isObject(child)) continue;
		if (!sameKey(child[relation.childPkField], targetKey)) continue;

		if (relation.kind === 'm2a' && junctionItem[relation.collectionField] !== targetCollection) {
			continue;
		}

		return child;
	}

	return null;
}

function sameKey(left: unknown, right: PrimaryKey): boolean {
	return String(left) === String(right);
}
