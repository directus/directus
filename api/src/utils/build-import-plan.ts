import { InvalidPayloadError, UnprocessableContentError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';

/**
 * A single collection worth of data as provided to the relational import endpoint.
 */
export interface ImportCollectionData {
	collection: string;
	items: Record<string, unknown>[];
}

/**
 * An owning foreign key field (many-to-one or any-to-one) on a collection.
 */
export interface FkFieldInfo {
	field: string;
	/** The related collection for a m2o relation. `null` for a2o (target is dynamic per item). */
	target: string | null;
	/** For a2o: the sibling field that holds the name of the target collection. */
	collectionField: string | null;
	/** For a2o: the collections the relation is allowed to point at. */
	allowedCollections: string[] | null;
	/** Whether the foreign key field itself is nullable. */
	nullable: boolean;
}

export interface ImportPlan {
	order: string[];
	deferred: { collection: string; field: string }[];
	fkFields: Map<string, FkFieldInfo[]>;
	relationalFields: Map<string, Set<string>>;
}

interface Edge {
	from: string;
	to: string;
	field: string;
	nullable: boolean;
}

/**
 * Analyse the requested collections against the schema and produce an import plan: a topological
 * order that respects foreign key dependencies, the set of fields that need to be deferred to a
 * second pass to break nullable cycles, and the relational field metadata used for validation and
 * ID remapping.
 */
export function buildImportPlan(input: ImportCollectionData[], schema: SchemaOverview): ImportPlan {
	const nodes = new Set<string>();

	for (const { collection } of input) {
		if (!schema.collections[collection]) {
			throw new InvalidPayloadError({ reason: `Unknown collection "${collection}"` });
		}

		if (nodes.has(collection)) {
			throw new InvalidPayloadError({ reason: `Duplicate collection "${collection}" in import payload` });
		}

		nodes.add(collection);
	}

	const fkFields = new Map<string, FkFieldInfo[]>();
	const relationalFields = new Map<string, Set<string>>();

	for (const collection of nodes) {
		fkFields.set(collection, []);
		relationalFields.set(collection, new Set());
	}

	// Collect owning FK fields (m2o/a2o) and all relational fields (incl. o2m aliases) per collection
	for (const relation of schema.relations) {
		const isA2O = Boolean(relation.meta?.one_collection_field && relation.meta?.one_allowed_collections);

		// Owning side: `relation.collection` holds the foreign key in `relation.field`
		if (nodes.has(relation.collection)) {
			const nullable = schema.collections[relation.collection]?.fields[relation.field]?.nullable ?? true;

			fkFields.get(relation.collection)!.push({
				field: relation.field,
				target: isA2O ? null : relation.related_collection,
				collectionField: relation.meta?.one_collection_field ?? null,
				allowedCollections: relation.meta?.one_allowed_collections ?? null,
				nullable,
			});

			relationalFields.get(relation.collection)!.add(relation.field);
		}

		// One side: `relation.related_collection` exposes the o2m/alias field in `relation.meta.one_field`
		if (relation.related_collection && nodes.has(relation.related_collection) && relation.meta?.one_field) {
			relationalFields.get(relation.related_collection)!.add(relation.meta.one_field);
		}
	}

	// Build dependency edges (from -> to means `from` depends on `to`) for targets present in the import
	let edges: Edge[] = [];

	for (const [collection, fields] of fkFields) {
		for (const info of fields) {
			const targets = info.target ? [info.target] : (info.allowedCollections ?? []);

			for (const target of targets) {
				if (nodes.has(target)) {
					edges.push({ from: collection, to: target, field: info.field, nullable: info.nullable });
				}
			}
		}
	}

	const deferred: { collection: string; field: string }[] = [];
	const deferredKeys = new Set<string>();

	// Break cycles by deferring nullable edges; unresolvable (all non-nullable) cycles throw
	for (;;) {
		const scc = findCycleComponent([...nodes], edges);
		if (!scc) break;

		const sccSet = new Set(scc);
		const internalEdges = edges.filter((edge) => sccSet.has(edge.from) && sccSet.has(edge.to));

		const nullableEdges = internalEdges
			.filter((edge) => edge.nullable)
			.sort((a, b) => a.from.localeCompare(b.from) || a.field.localeCompare(b.field) || a.to.localeCompare(b.to));

		if (nullableEdges.length === 0) {
			const involved = internalEdges
				.map((edge) => `${edge.from}.${edge.field} -> ${edge.to}`)
				.sort()
				.join(', ');

			throw new UnprocessableContentError({
				reason: `Unresolvable cyclical relation between [${[...scc].sort().join(', ')}] with non-nullable keys (${involved})`,
			});
		}

		const chosen = nullableEdges[0]!;
		const key = `${chosen.from}::${chosen.field}`;

		if (!deferredKeys.has(key)) {
			deferredKeys.add(key);
			deferred.push({ collection: chosen.from, field: chosen.field });
		}

		// Remove every edge originating from the deferred field (a2o fields can have multiple edges)
		edges = edges.filter((edge) => !(edge.from === chosen.from && edge.field === chosen.field));
	}

	const order = topologicalSort([...nodes], edges);

	return { order, deferred, fkFields, relationalFields };
}

/**
 * Return the members of a strongly connected component that contains a cycle (size > 1 or a
 * self-loop), or `null` when the graph is acyclic. Uses Tarjan's algorithm.
 */
function findCycleComponent(nodes: string[], edges: Edge[]): string[] | null {
	const adjacency = new Map<string, string[]>();
	for (const node of nodes) adjacency.set(node, []);
	for (const edge of edges) adjacency.get(edge.from)!.push(edge.to);

	const selfLoops = new Set(edges.filter((edge) => edge.from === edge.to).map((edge) => edge.from));

	const index = new Map<string, number>();
	const lowlink = new Map<string, number>();
	const onStack = new Set<string>();
	const stack: string[] = [];
	let counter = 0;
	let result: string[] | null = null;

	// Iterative Tarjan to avoid deep recursion on large inputs
	for (const start of nodes) {
		if (index.has(start)) continue;

		const callStack: { node: string; next: number }[] = [{ node: start, next: 0 }];

		while (callStack.length > 0) {
			const frame = callStack[callStack.length - 1]!;
			const { node } = frame;

			if (frame.next === 0) {
				index.set(node, counter);
				lowlink.set(node, counter);
				counter++;
				stack.push(node);
				onStack.add(node);
			}

			const neighbours = adjacency.get(node)!;

			if (frame.next < neighbours.length) {
				const next = neighbours[frame.next]!;
				frame.next++;

				if (!index.has(next)) {
					callStack.push({ node: next, next: 0 });
				} else if (onStack.has(next)) {
					lowlink.set(node, Math.min(lowlink.get(node)!, index.get(next)!));
				}

				continue;
			}

			if (lowlink.get(node) === index.get(node)) {
				const component: string[] = [];
				let member: string;

				do {
					member = stack.pop()!;
					onStack.delete(member);
					component.push(member);
				} while (member !== node);

				if (component.length > 1 || selfLoops.has(node)) {
					result = component;
				}
			}

			callStack.pop();

			if (callStack.length > 0) {
				const parent = callStack[callStack.length - 1]!.node;
				lowlink.set(parent, Math.min(lowlink.get(parent)!, lowlink.get(node)!));
			}

			if (result) return result;
		}
	}

	return result;
}

/**
 * Kahn's algorithm. `edges` are dependency edges (from depends on to), so targets are emitted
 * before their dependents. Ties are broken alphabetically for deterministic output.
 */
function topologicalSort(nodes: string[], edges: Edge[]): string[] {
	const dependencies = new Map<string, Set<string>>();
	const dependents = new Map<string, Set<string>>();

	for (const node of nodes) {
		dependencies.set(node, new Set());
		dependents.set(node, new Set());
	}

	for (const edge of edges) {
		if (edge.from === edge.to) continue;
		dependencies.get(edge.from)!.add(edge.to);
		dependents.get(edge.to)!.add(edge.from);
	}

	const order: string[] = [];
	const ready = nodes.filter((node) => dependencies.get(node)!.size === 0).sort();

	while (ready.length > 0) {
		const node = ready.shift()!;
		order.push(node);

		for (const dependent of [...dependents.get(node)!].sort()) {
			const deps = dependencies.get(dependent)!;
			deps.delete(node);

			if (deps.size === 0) {
				const insertAt = ready.findIndex((n) => n > dependent);
				if (insertAt === -1) ready.push(dependent);
				else ready.splice(insertAt, 0, dependent);
			}
		}
	}

	if (order.length !== nodes.length) {
		// Should never happen: cycles are broken before sorting
		throw new UnprocessableContentError({ reason: 'Unable to resolve a valid import order' });
	}

	return order;
}
