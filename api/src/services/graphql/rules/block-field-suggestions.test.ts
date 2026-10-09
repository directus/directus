import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { describe, expect, test } from 'vitest';
import { BlockFieldSuggestionsRule } from './block-field-suggestions.js';

const schema = buildSchema(/* GraphQL */ `
	enum Color {
		RED
		GREEN
	}

	type Query {
		article(color: Color): String
	}
`);

function validateQuery(query: string, withRule: boolean) {
	const rules = withRule ? [...specifiedRules, BlockFieldSuggestionsRule] : [...specifiedRules];
	return validate(schema, parse(query), rules);
}

describe('BlockFieldSuggestionsRule', () => {
	test('graphql-js leaks field names via suggestions by default', () => {
		// Sanity check: without the rule, the near-miss field name is leaked back to the client.
		const errors = validateQuery('{ artical }', false);

		expect(errors[0]?.message).toContain('Did you mean');
		expect(errors[0]?.message).toContain('article');
	});

	test('strips field suggestions from unknown-field errors', () => {
		const errors = validateQuery('{ artical }', true);

		expect(errors).toHaveLength(1);
		expect(errors[0]?.message).not.toContain('Did you mean');
		expect(errors[0]?.message).not.toContain('article');
		// The error is still reported, just without the leak.
		expect(errors[0]?.message).toContain('Cannot query field "artical"');
	});

	test('strips argument suggestions', () => {
		const errors = validateQuery('{ article(colr: RED) }', true);

		expect(errors.some((error) => /Did you mean/.test(error.message))).toBe(false);
	});

	test('strips enum value suggestions', () => {
		const errors = validateQuery('{ article(color: REDD) }', true);

		expect(errors.some((error) => /Did you mean/.test(error.message))).toBe(false);
	});

	test('preserves the error location', () => {
		const errors = validateQuery('{ artical }', true);

		// nodes/locations must survive the message rewrite so error paths still point at the field.
		expect(errors[0]?.nodes?.length).toBeGreaterThan(0);
		expect(errors[0]?.locations?.length).toBeGreaterThan(0);
	});
});
