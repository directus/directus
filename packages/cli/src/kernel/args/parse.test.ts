import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { isCliError } from '../error.js';
import { parseCommandArgs } from './parse.js';

const schema = z.object({
	from: z.string().describe('Source profile'),
	collections: z.array(z.string()).default([]),
	count: z.number().default(1),
	mode: z.enum(['added', 'merge']).default('merge'),
	schemaOnly: z.boolean().default(false),
});

// Run the parser and return the CliError it throws, so a test can assert on the
// code without a bare try/catch in every case.
function usageError(argv: string[]): unknown {
	try {
		parseCommandArgs(schema, argv);
	} catch (error) {
		return error;
	}

	throw new Error('expected parseCommandArgs to throw');
}

describe('parseCommandArgs', () => {
	it('parses a required string flag', () => {
		expect(parseCommandArgs(schema, ['--from', 'local']).values.from).toBe('local');
	});

	it('applies schema defaults for omitted flags', () => {
		const { values } = parseCommandArgs(schema, ['--from', 'local']);

		expect(values.mode).toBe('merge');
		expect(values.count).toBe(1);
		expect(values.collections).toEqual([]);
		expect(values.schemaOnly).toBe(false);
	});

	it('throws a usage error when a required flag is missing', () => {
		const error = usageError([]);
		expect(isCliError(error) && error.code).toBe('USAGE');
	});

	it('coerces number flags to numbers', () => {
		expect(parseCommandArgs(schema, ['--from', 'x', '--count', '5']).values.count).toBe(5);
	});

	it('maps camelCase keys to --kebab-case flags', () => {
		expect(parseCommandArgs(schema, ['--from', 'x', '--schema-only']).values.schemaOnly).toBe(true);
	});

	it('supports --no-<flag> negation for booleans', () => {
		expect(parseCommandArgs(schema, ['--from', 'x', '--no-schema-only']).values.schemaOnly).toBe(false);
	});

	it('collects repeated array flags', () => {
		expect(
			parseCommandArgs(schema, ['--from', 'x', '--collections', 'a', '--collections', 'b']).values.collections,
		).toEqual(['a', 'b']);
	});

	it('throws a usage error for invalid enum values', () => {
		const error = usageError(['--from', 'x', '--mode', 'nope']);
		expect(isCliError(error) && error.code).toBe('USAGE');
	});

	it('throws a usage error for unknown flags', () => {
		const error = usageError(['--from', 'x', '--bogus']);
		expect(isCliError(error) && error.code).toBe('USAGE');
	});

	it('captures positional arguments', () => {
		expect(parseCommandArgs(schema, ['--from', 'x', 'one', 'two']).positionals).toEqual(['one', 'two']);
	});

	it('treats a --no-<flag> after `--` as a literal positional, not a negation', () => {
		const { values, positionals } = parseCommandArgs(schema, ['--from', 'x', '--', '--no-schema-only']);

		expect(positionals).toEqual(['--no-schema-only']);
		expect(values.schemaOnly).toBe(false); // default, untouched by the literal token
	});
});
