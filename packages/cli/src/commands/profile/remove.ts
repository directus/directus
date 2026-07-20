import { clearCredential } from '../../kernel/config/credentials.js';
import { removeProfile } from '../../kernel/config/file.js';
import type { CliContext } from '../../kernel/run.js';

export function remove(name: string, ctx: CliContext): void {
	const url = removeProfile({ cwd: ctx.cwd, configPath: ctx.configPath }, name);
	ctx.ui.success(`Removed profile "${name}".`);

	if (url !== undefined) {
		try {
			clearCredential(url, name);
		} catch {
			ctx.ui.warn('Removed the profile, but could not clear its saved credential.');
		}
	}

	ctx.ui.data({ removed: name });
}
