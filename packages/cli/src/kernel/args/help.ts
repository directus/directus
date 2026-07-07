import type { CommandDefinition, PluginDefinition } from '../plugins/define.js';
import { describeArgs, toKebab } from './parse.js';

function pad(left: string): string {
	return `  ${left}`.padEnd(28);
}

export function renderRootHelp(plugins: readonly PluginDefinition[]): string {
	const lines: string[] = ['Usage: d6s <command> [options]', ''];

	if (plugins.length === 0) {
		lines.push('No commands available yet — kernel scaffolding in progress.');
		return lines.join('\n');
	}

	lines.push('Commands:');

	for (const plugin of plugins) {
		for (const [name, entry] of Object.entries(plugin.commands)) {
			lines.push(pad(`${plugin.name} ${name}`) + entry.summary);
		}
	}

	lines.push('', "Run 'd6s <command> --help' for details.");
	return lines.join('\n');
}

export function renderCommandHelp(pluginName: string, command: CommandDefinition): string {
	const spec = describeArgs(command.args);
	const lines: string[] = [command.description, '', `Usage: d6s ${pluginName} ${command.name} [options]`, ''];

	if (spec.fields.size > 0) {
		lines.push('Options:');

		for (const [key, meta] of spec.fields) {
			const flag = `--${toKebab(key)}`;
			const suffix = spec.required.includes(key) ? ' (required)' : '';
			lines.push(pad(flag) + `${meta.description ?? ''}${suffix}`);
		}
	}

	return lines.join('\n');
}
