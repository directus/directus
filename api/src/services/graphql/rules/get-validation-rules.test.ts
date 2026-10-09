import { useEnv } from '@directus/env';
import { NoSchemaIntrospectionCustomRule } from 'graphql';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BlockFieldSuggestionsRule, getValidationRules } from './index.js';

vi.mock('@directus/env', () => ({ useEnv: vi.fn() }));

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ GRAPHQL_INTROSPECTION: true });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getValidationRules', () => {
	test('omits the introspection rules when introspection is enabled', () => {
		const rules = getValidationRules();

		expect(rules).not.toContain(NoSchemaIntrospectionCustomRule);
		expect(rules).not.toContain(BlockFieldSuggestionsRule);
	});

	test('adds the introspection rules when introspection is disabled', () => {
		vi.mocked(useEnv).mockReturnValue({ GRAPHQL_INTROSPECTION: false });

		const rules = getValidationRules();

		expect(rules).toContain(NoSchemaIntrospectionCustomRule);
		expect(rules).toContain(BlockFieldSuggestionsRule);
	});
});
