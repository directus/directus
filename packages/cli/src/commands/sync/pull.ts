import { relative } from 'node:path';
import type { CliContext } from '../../kernel/run.js';
import { fetchSnapshot } from '../../sync/api.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { resolveTarget } from './resolve-target.js';

export interface PullOptions {
	readonly from: string;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const { url, credential, schemaDir } = resolveTarget(options.from, ctx);

	const snapshot = await fetchSnapshot(credential);

	const result = writeSnapshotFiles(schemaDir, snapshot);
	const relativeDir = relative(ctx.cwd, schemaDir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	const removedNote = removed > 0 ? ` Removed ${removed} stale ${removed === 1 ? 'file' : 'files'}.` : '';

	ctx.ui.success(
		`Pulled ${collections} ${collections === 1 ? 'collection' : 'collections'} from ${url} → ${relativeDir}.${removedNote}`,
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
	});
}
