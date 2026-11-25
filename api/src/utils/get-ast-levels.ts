import type { Filter, Query } from '@directus/types';
import { formatA2oKey } from '../permissions/modules/process-ast/utils/format-a2o-key.js';
import type {
	A2MNode,
	AST,
	FieldNode,
	FunctionFieldNode,
	M2ONode,
	NestedCollectionNode,
	O2MNode,
	VersionedNode,
} from '../types/ast.js';

type Children = (NestedCollectionNode | FieldNode | FunctionFieldNode)[];

/**
 * A collection read of the AST: the root, an m2o or o2m node, or one related collection of an a2o node. Its properties
 * read and write the node, so a2o nodes don't need to be handled separately.
 */
export type AstLevel = {
	node: AST | NestedCollectionNode;
	collection: string;
	/** Query path of the level, with `field:collection` for the related collections of a2o nodes */
	path: string[];
	parent: AstLevel | null;
	children: Children;
	query: Query;
	versioning: VersionedNode | undefined;
	cases: Filter[];
};

/**
 * Levels of the AST, parents before their children. The children of a level are read after it has been handled, so
 * they can be replaced while iterating.
 *
 * @param path - Query path of the root, for ASTs that are nested in a query
 */
export function* getAstLevels(ast: AST, path: string[] = []): Generator<AstLevel> {
	yield* walk(createLevel(ast, ast.name, path, null));
}

function* walk(level: AstLevel): Generator<AstLevel> {
	yield level;

	for (const child of level.children) {
		if (child.type === 'a2o') {
			for (const collection of child.names) {
				yield* walk(
					createA2OLevel(child, collection, [...level.path, formatA2oKey(child.fieldKey, collection)], level),
				);
			}
		} else if (child.type === 'm2o') {
			yield* walk(createLevel(child, child.relation.related_collection!, [...level.path, child.fieldKey], level));
		} else if (child.type === 'o2m') {
			yield* walk(createLevel(child, child.relation.collection, [...level.path, child.fieldKey], level));
		}
	}
}

function createLevel(
	node: AST | M2ONode | O2MNode,
	collection: string,
	path: string[],
	parent: AstLevel | null,
): AstLevel {
	return {
		node,
		collection,
		path,
		parent,
		get children() {
			return node.children;
		},
		set children(children) {
			node.children = children;
		},
		get query() {
			return node.query;
		},
		set query(query) {
			node.query = query;
		},
		get versioning() {
			return node.versioning;
		},
		set versioning(versioning) {
			if (versioning) node.versioning = versioning;
			else delete node.versioning;
		},
		get cases() {
			return node.cases;
		},
		set cases(cases) {
			node.cases = cases;
		},
	};
}

function createA2OLevel(node: A2MNode, collection: string, path: string[], parent: AstLevel): AstLevel {
	return {
		node,
		collection,
		path,
		parent,
		get children() {
			return node.children[collection] ?? [];
		},
		set children(children) {
			node.children[collection] = children;
		},
		get query() {
			return node.query[collection]!;
		},
		set query(query) {
			node.query[collection] = query;
		},
		get versioning() {
			return node.versioning?.[collection];
		},
		set versioning(versioning) {
			if (versioning) node.versioning = { ...node.versioning, [collection]: versioning };
			else delete node.versioning?.[collection];
		},
		get cases() {
			return node.cases[collection] ?? [];
		},
		set cases(cases) {
			node.cases[collection] = cases;
		},
	};
}
