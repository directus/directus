import { isPublishedVersionKey } from '@directus/constants';
import type { Item, PrimaryKey, Relation, SchemaOverview } from '@directus/types';
import { isDetailedUpdateSyntax } from './is-detailed-update-syntax.js';
import { isObject } from './is-object.js';

export const REFUSAL = {
	VERSIONING_REQUIRED: '[VERSIONING_REQUIRED]',
	NO_KEYS: '[VERSIONING_REQUIRED:NO_KEYS]',
	NO_PUBLISHED_SINGLETON: '[VERSIONING_REQUIRED:NO_PUBLISHED_SINGLETON]',
	NO_PARENT_CONTEXT: '[VERSIONING_REQUIRED:NO_PARENT_CONTEXT]',
	NO_PARENT_PATH: '[VERSIONING_REQUIRED:NO_PARENT_PATH]',
	MULTI_RELATION: '[VERSIONING_REQUIRED:MULTI_RELATION]',
	RELATED_NOT_FOUND: '[VERSIONING_REQUIRED:RELATED_ITEM_NOT_FOUND]',
	STALE_ATTACHMENT: '[VERSIONING_REQUIRED:STALE_ATTACHMENT]',
} as const;

export type RefusalToken = (typeof REFUSAL)[keyof typeof REFUSAL];

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
	| { kind: 'parent-version'; parent: ParentRef; relation: ParentRelation };

export type ResolveResult = WriteTarget | { kind: 'refuse'; token: RefusalToken; message: string };

type ParentRelationCandidate =
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
			return refuse(REFUSAL.VERSIONING_REQUIRED, 'Updates to versioned collections require a draft version.');
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
			return refuse(REFUSAL.NO_PARENT_CONTEXT, 'A parent item is required to save this child item to a version.');
		}

		return { kind: 'published', collection: input.target.collection, key: input.target.key };
	}

	const parentIsVersioned = await input.collectionHasVersioning(parent.collection);

	if (!parentIsVersioned || isPublishedVersionKey(parent.versionKey)) {
		return { kind: 'published', collection: input.target.collection, key: input.target.key };
	}

	const candidates = findParentRelationCandidates(input.schema, parent.collection, input.target.collection);

	if (candidates.length === 0) {
		return refuse(REFUSAL.NO_PARENT_PATH, 'No relation path exists from the parent item to this target item.');
	}

	const matches: ParentRelation[] = [];

	for (const candidate of candidates) {
		const parentItem = await input.readParent(parent, getParentReadFields(candidate));
		if (!parentItem) continue;

		const relation = findTargetInParentItem(candidate, parentItem, input.target.collection, input.target.key);
		if (relation) matches.push(relation);
	}

	if (matches.length > 1) {
		return refuse(REFUSAL.MULTI_RELATION, 'Multiple parent relations contain this target item.');
	}

	if (matches.length === 0) {
		const token = hint.attachment ? REFUSAL.STALE_ATTACHMENT : REFUSAL.RELATED_NOT_FOUND;
		const message = hint.attachment
			? 'The visual element no longer matches the parent item.'
			: 'The target item was not found in the parent version.';

		return refuse(token, message);
	}

	return { kind: 'parent-version', parent, relation: matches[0]! };
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

export function mergeNestedRelationDeltaInto(target: Item, source: Item): Item {
	for (const [field, incoming] of Object.entries(source)) {
		const existing = target[field];

		if (isDetailedUpdateSyntax(existing) && isDetailedUpdateSyntax(incoming)) {
			target[field] = {
				create: [...existing.create, ...incoming.create],
				update: [...existing.update, ...incoming.update],
				delete: [...existing.delete, ...incoming.delete],
			};

			continue;
		}

		target[field] = incoming;
	}

	return target;
}

function resolveVersionKey(hint: VersionHint): string | undefined {
	return (
		normalizeVersionKey(hint.explicitVersion) ??
		normalizeVersionKey(hint.attachment?.parent?.versionKey) ??
		normalizeVersionKey(hint.attachment?.version) ??
		normalizeVersionKey(hint.page?.version)
	);
}

function resolveParentRef(hint: VersionHint): ParentRef | null {
	const attachmentParent = hint.attachment?.parent;
	const attachmentParentVersion =
		normalizeVersionKey(attachmentParent?.versionKey) ?? normalizeVersionKey(hint.attachment?.version);

	if (attachmentParent && attachmentParentVersion) {
		return {
			collection: attachmentParent.collection,
			key: attachmentParent.key,
			versionKey: attachmentParentVersion,
		};
	}

	const pageVersion = normalizeVersionKey(hint.page?.version);

	if (hint.page?.collection && hint.page.item !== undefined && pageVersion) {
		return {
			collection: hint.page.collection,
			key: hint.page.item,
			versionKey: pageVersion,
		};
	}

	return null;
}

function normalizeVersionKey(versionKey: string | null | undefined): string | undefined {
	if (!versionKey) return undefined;
	return versionKey;
}

function refuse(token: RefusalToken, message: string): ResolveResult {
	return { kind: 'refuse', token, message: `${token} ${message}` };
}

function findParentRelationCandidates(
	schema: SchemaOverview,
	parentCollection: string,
	targetCollection: string,
): ParentRelationCandidate[] {
	const candidates: ParentRelationCandidate[] = [];

	for (const relation of schema.relations) {
		if (isO2MRelation(relation, parentCollection, targetCollection)) {
			candidates.push({
				kind: 'o2m',
				parentField: relation.meta.one_field!,
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
					parentField: relation.meta.one_field!,
					junctionCollection: relation.collection,
					junctionPkField,
					junctionField: relation.meta.junction_field!,
					collectionField,
					childPkField,
				});
			} else {
				candidates.push({
					kind: 'm2m',
					parentField: relation.meta.one_field!,
					junctionCollection: relation.collection,
					junctionPkField,
					junctionField: relation.meta.junction_field!,
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

function isO2MRelation(relation: Relation, parentCollection: string, targetCollection: string) {
	return (
		relation.collection === targetCollection &&
		relation.related_collection === parentCollection &&
		typeof relation.meta?.one_field === 'string' &&
		relation.meta.one_field.length > 0 &&
		!relation.meta.junction_field
	);
}

function isParentJunctionRelation(relation: Relation, parentCollection: string) {
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
		!relation.meta?.junction_field &&
		!relation.meta?.one_field
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

function sameKey(left: unknown, right: PrimaryKey): boolean {
	return String(left) === String(right);
}
