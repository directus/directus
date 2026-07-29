import type { ASTVisitor, ValidationContext } from 'graphql';
import { GraphQLError } from 'graphql';

/**
 * graphql-js appends `Did you mean "…"?` hints to validation errors for unknown fields, types,
 * arguments and enum values. Those hints leak schema details even when introspection is disabled,
 * allowing a client to reconstruct the schema by probing for near-miss names.
 */
const SUGGESTION_REGEX = / ?Did you mean .+$/;

export function BlockFieldSuggestionsRule(context: ValidationContext): ASTVisitor {
	// Capture the original reporter before overriding it, so we don't recurse.
	const reportError = context.reportError.bind(context);

	context.reportError = (error: GraphQLError) => {
		if (SUGGESTION_REGEX.test(error.message)) {
			error = new GraphQLError(error.message.replace(SUGGESTION_REGEX, ''), {
				nodes: error.nodes ?? null,
				source: error.source ?? null,
				positions: error.positions ?? null,
				path: error.path ?? null,
				originalError: error.originalError ?? null,
				extensions: error.extensions,
			});
		}

		reportError(error);
	};

	// No hooks needed, this rule only intercepts errors.
	return {};
}
