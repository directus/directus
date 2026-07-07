import type { CommandManifestEntry, PluginDefinition } from './plugins/define.js';
import { type CliError, cliError, err, ok, type Result } from './result.js';

export interface Registry {
	readonly plugins: readonly PluginDefinition[];
	resolve(pluginName: string, commandName: string): CommandManifestEntry | undefined;
	commandPaths(): string[];
}

export function createRegistry(plugins: readonly PluginDefinition[]): Result<Registry, CliError> {
	const byName = new Map<string, PluginDefinition>();

	for (const plugin of plugins) {
		if (byName.has(plugin.name)) {
			return err(cliError('CONFIG', `Duplicate plugin name registered: "${plugin.name}"`));
		}

		byName.set(plugin.name, plugin);
	}

	const registry: Registry = {
		plugins,
		resolve(pluginName, commandName) {
			return byName.get(pluginName)?.commands[commandName];
		},
		commandPaths() {
			const paths: string[] = [];

			for (const plugin of plugins) {
				for (const name of Object.keys(plugin.commands)) {
					paths.push(`${plugin.name} ${name}`);
				}
			}

			return paths;
		},
	};

	return ok(registry);
}
