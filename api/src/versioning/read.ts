import { ErrorCode, isDirectusError } from '@directus/errors';
import type { Accountability, Filter, Item, Query, Relation, SchemaOverview } from '@directus/types';
import { getRelationInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { isNil, uniq } from 'lodash-es';
import { getAstFromQuery } from '../database/get-ast-from-query/get-ast-from-query.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { runAst } from '../database/run-ast/run-ast.js';
import type { RunASTOptions } from '../database/run-ast/types.js';
import { processAst } from '../permissions/modules/process-ast/process-ast.js';
import { ItemsService } from '../services/items.js';
import { VERSION_FIELD, VERSION_SYSTEM_FIELDS } from '../services/version-tables/constants.js';
import { nestVersionSystemFields } from '../services/version-tables/utils.js';
import type { AST, FieldNode, VersionedAST, VersionReadMode } from '../types/ast.js';
import {
	deletePath,
	formatAggregate,
	getEngineFields,
	getRequestedRoots,
	getSubfields,
	injectPublishedSystemFields,
	trimSystemFields,
} from './fields.js';
import { validateLinkAccess } from './link-access.js';
import { createVirtualCollection } from './virtual-collection.js';

type Context = { knex: Knex; schema: SchemaOverview; accountability: Accountability | null };

/**
 * Run the AST of a versioned read against the combined rows of live items and versions. References to versions of
 * related items are resolved, and the version system fields are nested under `directus_version`.
 */
export async function runVersionedAst(
	ast: AST & { versioning: VersionedAST },
	schema: SchemaOverview,
	accountability: Accountability | null,
	options?: RunASTOptions,
): Promise<Item[]> {
	const { versioning, ...liveAst } = ast;
	const knex = options?.knex ?? getDatabase();
	const { primary } = schema.collections[versioning.collection]!;
	const isAggregate = Boolean(versioning.query.group || Object.keys(versioning.query.aggregate ?? {}).length > 0);
	const virtual = createVirtualCollection(knex, schema, versioning.collection, versioning.mode);

	const children = liveAst.children.map((child) => {
		if (child.type === 'm2o' || child.type === 'a2o') {
			return { ...child, relation: { ...child.relation, collection: virtual.name } };
		}

		if (child.type === 'o2m') return { ...child, relation: { ...child.relation, related_collection: virtual.name } };

		return child;
	});

	const hasPrimary = children.some((child) => child.type === 'field' && child.fieldKey === primary);
	const selected = isAggregate || hasPrimary ? versioning.select : [primary, ...versioning.select];

	const virtualAst: AST = {
		...liveAst,
		name: virtual.name,
		query: { ...liveAst.query, ...versioning.query },
		children: [
			...children,
			...selected.map(
				(field): FieldNode => ({ type: 'field', name: field, fieldKey: field, whenCase: [], alias: false }),
			),
		],
	};

	const items = ((await runAst(virtualAst, virtual.schema, accountability, {
		knex,
		source: virtual.source,
		...(options?.stripNonRequested !== undefined ? { stripNonRequested: options.stripNonRequested } : {}),
	})) ?? []) as Item[];

	if (isAggregate) return items.map((item) => formatAggregate(item, versioning.query));

	await resolveVersionReferences(
		versioning.collection,
		items,
		versioning.fields,
		{ knex, schema, accountability },
		versioning.mode,
	);

	return items.map(nestVersionSystemFields).map((item) => {
		for (const field of selected) {
			delete item[field];
		}

		for (const path of versioning.added) {
			deletePath(item, path);
		}

		injectPublishedSystemFields(item, versioning.fields);

		return item;
	});
}

/**
 * Resolve m2o references to versions of related items and the related items of o2m relations for versions,
 * which are stored in the shadow and link tables instead of the foreign key of the live relation
 */
async function resolveVersionReferences(
	collection: string,
	items: Item[],
	fields: string[],
	context: Context,
	mode: VersionReadMode,
) {
	const { schema } = context;

	for (const field of getRequestedRoots(schema, collection, fields)) {
		const subfields = getSubfields(fields, field);
		const { relation, relationType } = getRelationInfo(schema.relations, collection, field);

		if (relationType === 'm2o' || relationType === 'a2o') {
			await resolveM2O(items, relation!, subfields, context);
		} else if (relationType === 'o2m') {
			const versions = items.filter((item) => mode === 'versions' || item[VERSION_SYSTEM_FIELDS.type] !== 'published');

			await resolveO2M(versions, relation!, subfields, context);
		}
	}
}

/**
 * Replace the empty m2o field of versions that reference a version of the related item with that version. Without
 * requested subfields, or for related collections that aren't versioned, only `{ directus_version: { id } }` is set.
 */
async function resolveM2O(items: Item[], relation: Relation, subfields: string[], context: Context) {
	const { versioning } = getHelpers(context.knex);
	const referenceField = versioning.getVersionReferenceField(relation.field);
	const pending = items.filter((item) => isNil(item[relation.field]) && !isNil(item[referenceField]));

	if (pending.length === 0) return;

	const related = relation.related_collection;

	// a2o references and requests for keys only return the reference itself
	if (!related || subfields.length === 0 || !context.schema.collections[related]?.versioned) {
		for (const item of pending) {
			item[relation.field] = { [VERSION_FIELD]: { id: item[referenceField] } };
		}

		return;
	}

	const versions = await readVersionsById(
		related,
		subfields,
		pending.map((item) => item[referenceField]),
		context,
	);

	for (const item of pending) {
		item[relation.field] = versions.get(String(item[referenceField])) ?? null;
	}
}

/**
 * Set the o2m field of versions to their related items: live items linked through the link table and versions of
 * related items referencing them. Without requested subfields, only the keys and version ids are set.
 * Linked live items the user can't read are left out.
 */
async function resolveO2M(versions: Item[], relation: Relation, subfields: string[], context: Context) {
	const { knex, schema } = context;
	const field = relation.meta!.one_field!;
	const versionIds = versions.map((item) => item[VERSION_SYSTEM_FIELDS.id]).filter((id) => !isNil(id));

	if (versionIds.length === 0) return;

	const related = relation.collection;
	const { primary } = schema.collections[related]!;
	const { versioning } = getHelpers(knex);
	const linkTable = versioning.getLinkTableName(related);
	const shadowTable = versioning.getShadowTableName(related);
	const referenceField = versioning.getVersionReferenceField(relation.field);
	const children = new Map<string, unknown[]>();

	const addChild = (versionId: unknown, child: unknown) => {
		if (child === undefined) return;

		const key = String(versionId);
		children.set(key, [...(children.get(key) ?? []), child]);
	};

	// Live items linked to the versions
	if (schema.collections[linkTable]?.fields[relation.field]) {
		let links = await knex(linkTable).select(primary, relation.field).whereIn(relation.field, versionIds);

		const canReadLinks = await validateLinkAccess(
			{
				collection: related,
				action: 'read',
				keys: links.map((link) => link[primary]),
				accountability: context.accountability,
			},
			{ knex, schema },
		).then(
			() => true,
			(error) => {
				if (isDirectusError(error, ErrorCode.Forbidden)) return false;
				throw error;
			},
		);

		if (!canReadLinks) links = [];

		const liveItems =
			subfields.length > 0
				? await readLiveById(
						related,
						subfields,
						links.map((link) => link[primary]),
						context,
					)
				: null;

		for (const link of links) {
			addChild(link[relation.field], liveItems ? liveItems.get(String(link[primary])) : link[primary]);
		}
	}

	// Versions of related items that belong to the versions
	if (schema.collections[shadowTable]?.fields[referenceField]) {
		const references = await knex(shadowTable)
			.select(VERSION_SYSTEM_FIELDS.id, referenceField)
			.whereIn(referenceField, versionIds);

		const relatedVersions =
			subfields.length > 0
				? await readVersionsById(
						related,
						subfields,
						references.map((reference) => reference[VERSION_SYSTEM_FIELDS.id]),
						context,
					)
				: null;

		for (const reference of references) {
			const versionId = reference[VERSION_SYSTEM_FIELDS.id];

			addChild(
				reference[referenceField],
				relatedVersions ? relatedVersions.get(String(versionId)) : { [VERSION_FIELD]: { id: versionId } },
			);
		}
	}

	for (const item of versions) {
		item[field] = children.get(String(item[VERSION_SYSTEM_FIELDS.id])) ?? [];
	}
}

/**
 * Read versions of a collection by their version id, mapped by the stringified id
 */
async function readVersionsById(collection: string, subfields: string[], ids: unknown[], context: Context) {
	const { knex, schema, accountability } = context;

	const query: Query = {
		fields: [...subfields, `${VERSION_FIELD}.id`],
		filter: { [VERSION_FIELD]: { id: { _in: uniq(ids) } } } as Filter,
		limit: -1,
	};

	let ast = await getAstFromQuery({ collection, query, accountability, versioning: 'versions' }, { knex, schema });
	ast = await processAst({ ast, action: 'read', accountability }, { knex, schema });

	const items = (await runAst(ast, schema, accountability, { knex })) as Item[];

	return new Map(
		items.map((item) => {
			const id = String(item[VERSION_FIELD].id);
			trimSystemFields(item, subfields);
			return [id, item];
		}),
	);
}

/**
 * Read published live items of a collection by their primary key, mapped by the stringified key. The primary key is
 * only kept on the items if it was requested.
 */
async function readLiveById(collection: string, subfields: string[], keys: unknown[], context: Context) {
	const { knex, schema, accountability } = context;
	const { primary } = schema.collections[collection]!;
	const fields = uniq([...subfields, primary]);
	const filter = { [primary]: { _in: uniq(keys) } } as Filter;

	const service = new ItemsService(collection, { knex, schema, accountability });

	let items: Item[];

	if (schema.collections[collection]?.versioned) {
		items = await service.readByQuery({
			fields,
			filter: { _and: [filter, { [VERSION_FIELD]: { type: { _eq: 'published' } } }] } as Filter,
			limit: -1,
			version: 'true',
		});
	} else {
		const engineFields = getEngineFields(schema, collection, fields);

		items = await service.readByQuery({ fields: engineFields.fields, filter, limit: -1 });

		for (const item of items) {
			for (const path of engineFields.added) deletePath(item, path);
			injectPublishedSystemFields(item, fields);
		}
	}

	const keepPrimary = subfields.some((field) => field === '*' || field.split('.')[0] === primary);

	return new Map(
		items.map((item) => {
			const key = String(item[primary]);
			if (!keepPrimary) delete item[primary];
			return [key, item];
		}),
	);
}
