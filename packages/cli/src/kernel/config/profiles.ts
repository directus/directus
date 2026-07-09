import { type CliError, cliError, err, ok, type Result } from '../result.js';
import type { Config, Profile } from './file.js';

// A miss names the known profiles so a typo is fixable without opening the file.
export function resolveProfile(config: Config, name: string): Result<Profile, CliError> {
	const profile = config.profiles[name];

	if (profile === undefined) {
		const known = Object.keys(config.profiles);

		return err(
			cliError('CONFIG', `Unknown profile: "${name}"`, {
				hint:
					known.length > 0 ? `Known profiles: ${known.join(', ')}` : 'No profiles are defined in directus.config.json.',
			}),
		);
	}

	return ok(profile);
}
