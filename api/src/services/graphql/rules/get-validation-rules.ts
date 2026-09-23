import { useEnv } from '@directus/env';
import type { ValidationRule } from 'graphql';
import { NoSchemaIntrospectionCustomRule, specifiedRules } from 'graphql';
import { BlockFieldSuggestionsRule } from './block-field-suggestions.js';
import { limitSensitiveMutations } from './limit-sensitive-mutations.js';

export interface GetValidationRulesOptions {
	operationName?: string | null | undefined;
}

/**
 * Build the GraphQL validation rules.
 */
export function getValidationRules({ operationName }: GetValidationRulesOptions = {}): ValidationRule[] {
	const { GRAPHQL_INTROSPECTION } = useEnv();

	const rules: ValidationRule[] = [...specifiedRules, limitSensitiveMutations(operationName)];

	if (!GRAPHQL_INTROSPECTION) {
		rules.push(NoSchemaIntrospectionCustomRule);
		rules.push(BlockFieldSuggestionsRule);
	}

	return rules;
}
