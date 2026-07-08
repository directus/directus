import { kebabCase } from 'lodash-es';
import type { CommandDefinition, CommandGroup } from '../command.js';
import { describeArgs } from './parse.js';

function pad(left: string): string {
	return `  ${left}`.padEnd(28);
}

export function renderRootHelp(groups: readonly CommandGroup[]): string {
	const lines: string[] = ['Usage: d6s <command> [options]', ''];

	if (groups.length === 0) {
		lines.push('No commands available yet — kernel scaffolding in progress.');
		return lines.join('\n');
	}

	lines.push('Commands:');

	for (const group of groups) {
		for (const command of Object.values(group.commands)) {
			lines.push(pad(`${group.name} ${command.name}`) + command.description);
		}
	}

	lines.push('', "Run 'd6s <command> --help' for details.");
	return lines.join('\n');
}

export function renderCommandHelp(groupName: string, command: CommandDefinition): string {
	const spec = describeArgs(command.args);
	const lines: string[] = [command.description, '', `Usage: d6s ${groupName} ${command.name} [options]`, ''];

	if (spec.fields.size > 0) {
		lines.push('Options:');

		for (const [key, meta] of spec.fields) {
			const flag = `--${kebabCase(key)}`;
			const suffix = spec.required.includes(key) ? ' (required)' : '';
			lines.push(pad(flag) + `${meta.description ?? ''}${suffix}`);
		}
	}

	return lines.join('\n');
}
