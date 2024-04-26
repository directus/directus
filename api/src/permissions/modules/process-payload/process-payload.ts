import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PermissionsAction, SchemaOverview } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import type { Knex } from 'knex';
import { difference, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';

/**
 * @note this only validates the top-level fields. The expectation is that this function is called
 * for each level of nested insert separately
 */
export async function processPayload(
	knex: Knex,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
	payload: Item,
) {
	if (accountability.admin) {
		return;
	}

	const policies = await fetchPolicies(knex, schema, accountability);
	const permissions = await fetchPermissions(knex, schema, action, policies, [collection]);

	if (permissions.length === 0) {
		throw new ForbiddenError({
			reason: `You don't have permission to "${action}" from collection "${collection}" or it does not exist.`,
		});
	}

	const fieldsAllowed = uniq(permissions.map(({ fields }) => fields ?? []).flat());

	if (fieldsAllowed.includes('*') === false) {
		const fieldsUsed = Object.keys(payload);
		const notAllowed = difference(fieldsUsed, fieldsAllowed);

		if (notAllowed.length > 0) {
			const fieldStr = notAllowed.map((field) => `"${field}"`).join(', ');

			throw new ForbiddenError({
				reason:
					notAllowed.length === 1
						? `You don't have permission to access field ${fieldStr} in collection "${collection}" or it does not exist.`
						: `You don't have permission to access fields ${fieldStr} in collection "${collection}" or they do not exist.`,
			});
		}
	}

	const fieldValidationRules = Object.values(schema.collections[collection]!.fields).map(
		(field) => field.validation ?? {},
	);

	const permissionValidationRules = permissions.map(({ validation }) => validation ?? {});

	const validationRules = [...fieldValidationRules, ...permissionValidationRules].filter((rule) => {
		if (rule === null) return false;
		if (Object.keys(rule).length === 0) return false;
		return true;
	});

	if (validationRules.length > 0) {
		const validationErrors: InstanceType<typeof FailedValidationError>[] = [];

		validationErrors.push(
			...validatePayload({ _and: validationRules }, payload)
				.map((error) => {
					return error.details.map(
						(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)),
					);
				})
				.flat(),
		);

		if (validationErrors.length > 0) throw validationErrors;
	}

	// TODO Merge and inject presets.. maybe? Usage is super low, discuss whether to ignore it here
	// and move them to "dynamic default values"
	// If we're gonna modify payload, don't forget to cloneDeep. Don't want to mutate the original
}
