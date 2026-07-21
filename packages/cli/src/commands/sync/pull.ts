import { relative } from 'node:path';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchSnapshot, type SnapshotScope } from '../../sync/api.js';
import { type WriteScope, writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

export interface PullOptions {
	readonly from: string;
	readonly collections?: string;
	readonly excludeCollections?: string;
}

// A resolved scope carries both wire and store shapes plus the surfaces that must report it: the
// api scope the server narrows on, the store scope that decides which local artifacts to mirror,
// the machine payload's `scope` value, and the human line's trailing note. No scope → undefined
// everywhere, so an unscoped pull is byte-for-byte the pre-scope behavior.
interface ResolvedScope {
	readonly api: SnapshotScope;
	readonly write: WriteScope;
	readonly payload: { include: string[] } | { exclude: string[] };
	readonly note: string;
}

function parseList(raw: string): string[] {
	return raw
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

// Mutual exclusivity is surfaced client-side with a clean USAGE message rather than as a server 400,
// and an empty list (all-whitespace or bare flag) is refused naming the flag the operator passed.
function resolveScope(options: PullOptions): ResolvedScope | undefined {
	if (options.collections !== undefined && options.excludeCollections !== undefined) {
		throw new CliError('USAGE', 'Pass --collections or --exclude-collections, not both.');
	}

	if (options.collections !== undefined) {
		const include = parseList(options.collections);

		if (include.length === 0) {
			throw new CliError('USAGE', '--collections needs at least one collection name.');
		}

		return {
			api: { include },
			write: { inScope: (name) => include.includes(name) },
			payload: { include },
			note: ` (scoped to: ${include.join(', ')})`,
		};
	}

	if (options.excludeCollections !== undefined) {
		const exclude = parseList(options.excludeCollections);

		if (exclude.length === 0) {
			throw new CliError('USAGE', '--exclude-collections needs at least one collection name.');
		}

		return {
			api: { exclude },
			write: { inScope: (name) => !exclude.includes(name) },
			payload: { exclude },
			note: ` (excluding: ${exclude.join(', ')})`,
		};
	}

	return undefined;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir } = resolveTarget(options.from, ctx);

	const scope = resolveScope(options);

	const snapshot = await fetchSnapshot(credential, scope?.api);

	const result = writeSnapshotFiles(schemaDir, snapshot, scope?.write);
	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	const removedNote = removed > 0 ? ` Removed ${removed} stale ${removed === 1 ? 'file' : 'files'}.` : '';

	ctx.ui.success(
		`Pulled ${collections} ${collections === 1 ? 'collection' : 'collections'} from ${url} → ${relativeDir}.${removedNote}${scope?.note ?? ''}`,
	);

	ctx.ui.data({
		kind: 'PullReport',
		formatVersion: 1,
		ok: true,
		source: url,
		profile: options.from,
		dir: relativeDir,
		collections,
		fields: snapshot.fields.length,
		systemFields: snapshot.systemFields.length,
		relations: snapshot.relations.length,
		files: result.written.length,
		removed: result.removed,
		// Always present so a consumer never has to guess whether a pull was scoped: the scope the
		// server narrowed on, or null for a full pull.
		scope: scope?.payload ?? null,
	});
}
