import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseCommandArgs } from './parse.js';

const schema = z.object({
	from: z.string().describe('Source profile'),
	project: z.string().optional(),
	collections: z.array(z.string()).default([]),
	count: z.number().default(1),
	mode: z.enum(['added', 'merge']).default('merge'),
	schemaOnly: z.boolean().default(false),
});

function parse(argv: string[]) {
	return parseCommandArgs(schema, argv);
}

describe('parseCommandArgs', () => {
	it('parses a required string flag', () => {
		const result = parse(['--from', 'local']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.values.from).toBe('local');
	});

	it('applies schema defaults for omitted flags', () => {
		const result = parse(['--from', 'local']);
		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.values.mode).toBe('merge');
			expect(result.value.values.count).toBe(1);
			expect(result.value.values.collections).toEqual([]);
			expect(result.value.values.schemaOnly).toBe(false);
		}
	});

	it('returns a usage error when a required flag is missing', () => {
		const result = parse([]);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.code).toBe('USAGE');
	});

	it('coerces number flags to numbers', () => {
		const result = parse(['--from', 'x', '--count', '5']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.values.count).toBe(5);
	});

	it('maps camelCase keys to --kebab-case flags', () => {
		const result = parse(['--from', 'x', '--schema-only']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.values.schemaOnly).toBe(true);
	});

	it('supports --no-<flag> negation for booleans', () => {
		const result = parse(['--from', 'x', '--no-schema-only']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.values.schemaOnly).toBe(false);
	});

	it('collects repeated array flags', () => {
		const result = parse(['--from', 'x', '--collections', 'a', '--collections', 'b']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.values.collections).toEqual(['a', 'b']);
	});

	it('rejects invalid enum values with a usage error', () => {
		const result = parse(['--from', 'x', '--mode', 'nope']);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.code).toBe('USAGE');
	});

	it('rejects unknown flags with a usage error', () => {
		const result = parse(['--from', 'x', '--bogus']);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.code).toBe('USAGE');
	});

	it('captures positional arguments', () => {
		const result = parse(['--from', 'x', 'one', 'two']);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.positionals).toEqual(['one', 'two']);
	});

	it('treats a --no-<flag> after `--` as a literal positional, not a negation', () => {
		const result = parse(['--from', 'x', '--', '--no-schema-only']);
		expect(result.ok).toBe(true);

		if (result.ok) {
			expect(result.value.positionals).toEqual(['--no-schema-only']);
			expect(result.value.values.schemaOnly).toBe(false); // default, untouched by the literal token
		}
	});
});
