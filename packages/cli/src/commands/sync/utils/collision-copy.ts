import { isEqual } from 'lodash-es';
import type { SyncMode } from '../../../kernel/config/mode.js';
import type { CliContext } from '../../../kernel/run.js';
import { byCodepoint } from './codepoint.js';
import { normalizeInstanceUrl } from './id-map.js';
import type { CollectionReconcile, ReconcileInput } from './reconcile.js';
import { displayProjectPath, type Target } from './resolve-target.js';
import { allResources, type Resource } from './resources.js';

/** One source record whose natural key matches several target records. */
export type Ambiguity = CollectionReconcile['ambiguous'][number] & { readonly collection: string };

const UNNAMED_IDENTITY = 'with this identity';

/** undefined when the value carries nothing a reader could search for. */
export function scalar(value: unknown): string | undefined {
	let rendered: string | undefined;

	// JSON.stringify, not String: quotes tell the string "null" from null, and it escapes ESC bytes headed
	// for a terminal.
	if (typeof value === 'string') rendered = value === '' ? undefined : JSON.stringify(value);
	if (typeof value === 'number' || typeof value === 'boolean' || value === null) rendered = String(value);
	if (rendered === undefined) return undefined;

	return rendered.length > 60 ? `${rendered.slice(0, 59)}…` : rendered;
}

/** Names a record the way its Data Studio list would, falling back to the bare ID. */
export function recordLabel(
	record: Record<string, unknown> | undefined,
	primaryKey: string,
	fallbackId: string,
): string {
	if (record === undefined) return fallbackId;

	for (const field of ['name', 'email', 'key', 'title', 'collection', 'action']) {
		const value = scalar(record[field]);
		if (value !== undefined) return `${value} — ${String(record[primaryKey] ?? fallbackId)}`;
	}

	return String(record[primaryKey] ?? fallbackId);
}

/** Composite keys name every field: a record needing three fields to identify it has no readable label. */
function identityPhrase(input: ReconcileInput | undefined, source: Record<string, unknown> | undefined): string {
	if (input === undefined || source === undefined) return UNNAMED_IDENTITY;

	const rendered: { field: string; value: string }[] = [];

	for (const field of input.naturalKey) {
		const value = scalar(source[field]);

		// The unused half of an either/or key (an access grant carries a role or a user) names nothing.
		if (value === undefined || value === 'null') continue;

		rendered.push({ field, value });
	}

	if (rendered.length === 0) return UNNAMED_IDENTITY;

	const only = rendered.length === 1 ? rendered[0] : undefined;

	if (only?.field === 'name') return `named ${only.value}`;

	return `with ${rendered.map((entry) => `${entry.field} ${entry.value}`).join(', ')}`;
}

/** undefined for a resource with no stable item route. */
export function itemUiUrl(instance: string, resource: Resource | undefined, id: string): string | undefined {
	if (resource?.appRoute === undefined) return undefined;
	return `${normalizeInstanceUrl(instance)}${resource.appRoute}/${encodeURIComponent(id)}`;
}

export function collisionLines(
	item: Ambiguity,
	ambiguities: readonly Ambiguity[],
	inputs: readonly ReconcileInput[],
	target: Target,
	ctx: CliContext,
): [string, string] {
	const input = inputs.find((candidate) => candidate.collection === item.collection);
	const source = input?.sourceRecords.find((record) => String(record[input.primaryKey]) === item.sourceId);
	const resource = allResources().find((candidate) => candidate.collection === item.collection);
	const singular = resource?.singular ?? 'record';
	const plural = resource?.plural ?? 'records';

	const local = ambiguities.filter(
		(candidate) => candidate.collection === item.collection && candidate.key === item.key,
	).length;

	const projectPath = ctx.ui.style.strong(displayProjectPath(ctx.cwd, target.projectDir));

	return [
		`${projectPath} contains ${local} ${local === 1 ? singular : plural} ${identityPhrase(input, source)}.`,
		`${ctx.ui.style.strong(target.profile)} — ${ctx.ui.style.muted(target.url)} contains ${item.targetIds.length} matching ${item.targetIds.length === 1 ? singular : plural}.`,
	];
}

export function differenceHint(
	source: Record<string, unknown> | undefined,
	target: Record<string, unknown> | undefined,
	primaryKey: string,
	mode: SyncMode,
): string {
	if (source === undefined || target === undefined) return 'Uses this existing target record';

	const differences: string[] = [];

	for (const field of [...new Set([...Object.keys(source), ...Object.keys(target)])].sort(byCodepoint)) {
		if (field === primaryKey || isEqual(source[field], target[field])) continue;

		const before = scalar(source[field]);
		const after = scalar(target[field]);

		differences.push(
			before === undefined || after === undefined
				? `${field}: values differ`
				: `${field}: local ${before}, target ${after}`,
		);
	}

	if (differences.length === 0) return 'Same synced values; only the ID differs';

	const shown = differences.slice(0, 2).join('; ');
	const detail = differences.length > 2 ? `${shown}; +${differences.length - 2} more differences` : shown;

	const effect =
		mode === 'add' ? 'Add keeps the target unchanged' : `${mode === 'merge' ? 'Merge' : 'Mirror'} updates the target`;

	return `${effect}; ${detail}`;
}
