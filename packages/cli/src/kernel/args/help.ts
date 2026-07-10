import { kebabCase } from 'lodash-es';
import type { CommandDefinition, CommandGroup } from '../command.js';
import { describeArgs } from './parse.js';

function pad(left: string): string {
	return `  ${left}`.padEnd(28);
}

// One `<group> <command>  description` line per command in the given groups.
function commandLines(groups: readonly CommandGroup[]): string[] {
	return groups.flatMap((group) =>
		Object.values(group.commands).map((command) => pad(`${group.name} ${command.name}`) + command.description),
	);
}

export function renderRootHelp(groups: readonly CommandGroup[]): string {
	return [
		'Usage: d6s <command> [options]',
		'',
		'Commands:',
		...commandLines(groups),
		'',
		"Run 'd6s <command> --help' for details.",
	].join('\n');
}

export function renderGroupHelp(group: CommandGroup): string {
	return [
		group.description,
		'',
		`Usage: d6s ${group.name} <command> [options]`,
		'',
		'Commands:',
		...commandLines([group]),
		'',
		`Run 'd6s ${group.name} <command> --help' for details.`,
	].join('\n');
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
