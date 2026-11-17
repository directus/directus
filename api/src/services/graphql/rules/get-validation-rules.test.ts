import { NoSchemaIntrospectionCustomRule } from 'graphql';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { resetEnv, setEnv } from '../../../test-utils/env.js';
import { BlockFieldSuggestionsRule, getValidationRules } from './index.js';

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../../../test-utils/env.js');
	return mockUseEnv();
});

beforeEach(() => {
	resetEnv();
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
		setEnv({ GRAPHQL_INTROSPECTION: false });

		const rules = getValidationRules();

		expect(rules).toContain(NoSchemaIntrospectionCustomRule);
		expect(rules).toContain(BlockFieldSuggestionsRule);
	});
});
