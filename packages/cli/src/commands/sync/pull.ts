import { dirname, join, relative } from 'node:path';
import { resolveCredential } from '../../kernel/config/credentials.js';
import { loadConfig, resolveProfile } from '../../kernel/config/file.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { fetchSnapshot } from '../../sync/api.js';
import { writeSnapshotFiles } from '../../sync/store.js';

export interface PullOptions {
	readonly from: string;
}

export async function pull(options: PullOptions, ctx: CliContext): Promise<void> {
	const loaded = loadConfig({ cwd: ctx.cwd, configPath: ctx.configPath });

	if (loaded === undefined) {
		throw new CliError('CONFIG', 'No directus.config.json found.', {
			hint: 'Create one first: d6s profile add <name> --url <url>',
		});
	}

	const { url } = resolveProfile(loaded.config, options.from);

	// Pull never prompts. Authentication decisions are recorded once at profile / scope-definition
	// time and only read back here, so a pull behaves identically locally and in CI.
	const resolution = resolveCredential({ target: 'profile', url, profileName: options.from });

	if (!resolution.found) {
		throw new CliError('AUTH', `No credential found for profile "${options.from}".`, {
			hint: `Set ${resolution.envVar}, or run d6s profile test ${options.from} to add one.`,
		});
	}

	const snapshot = await fetchSnapshot(resolution.credential);

	// Anchor artifacts to the config file's directory, not the invocation cwd, so they land in the
	// repo no matter where the command runs from. `directus/<project>/schema` is the committable
	// layout; the project slot is fixed to `default` until project config lands.
	const dir = join(dirname(loaded.path), 'directus', 'default', 'schema');

	const result = writeSnapshotFiles(dir, snapshot);
	const relativeDir = relative(ctx.cwd, dir);
	const collections = snapshot.collections.length;
	const removed = result.removed.length;

	const removedNote = removed > 0 ? ` Removed ${removed} stale ${removed === 1 ? 'file' : 'files'}.` : '';

	ctx.ui.success(
		`Pulled ${collections} ${collections === 1 ? 'collection' : 'collections'} from ${url} → ${relativeDir}.${removedNote}`,
	);

	ctx.ui.data({
		ok: true,
		source: url,
		dir: relativeDir,
		collections,
		fields: snapshot.fields.length,
		systemFields: snapshot.systemFields.length,
		relations: snapshot.relations.length,
		files: result.written.length,
		removed: result.removed,
	});
}
