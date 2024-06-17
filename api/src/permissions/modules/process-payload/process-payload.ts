import { ForbiddenError } from '@directus/errors';
import type { Accountability, Item, PermissionsAction } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import { assign, difference, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

export interface ProcessPayloadOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	payload: Item;
}

/**
 * @note this only validates the top-level fields. The expectation is that this function is called
 * for each level of nested insert separately
 */
export async function processPayload(options: ProcessPayloadOptions, context: Context) {
	if (options.accountability.admin) {
		return options.payload;
	}

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = await fetchPermissions(
		{ action: options.action, policies, collections: [options.collection], accountability: options.accountability },
		context,
	);

	if (permissions.length === 0) {
		throw new ForbiddenError({
			reason: `You don't have permission to "${options.action}" from collection "${options.collection}" or it does not exist.`,
		});
	}

	const fieldsAllowed = uniq(permissions.map(({ fields }) => fields ?? []).flat());

	if (fieldsAllowed.includes('*') === false) {
		const fieldsUsed = Object.keys(options.payload);
		const notAllowed = difference(fieldsUsed, fieldsAllowed);

		if (notAllowed.length > 0) {
			const fieldStr = notAllowed.map((field) => `"${field}"`).join(', ');

			throw new ForbiddenError({
				reason:
					notAllowed.length === 1
						? `You don't have permission to access field ${fieldStr} in collection "${options.collection}" or it does not exist.`
						: `You don't have permission to access fields ${fieldStr} in collection "${options.collection}" or they do not exist.`,
			});
		}
	}

	const fieldValidationRules = Object.values(context.schema.collections[options.collection]?.fields ?? {}).map(
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
			...validatePayload({ _and: validationRules }, options.payload)
				.map((error) => {
					return error.details.map(
						(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)),
					);
				})
				.flat(),
		);

		if (validationErrors.length > 0) throw validationErrors;
	}

	const presets = permissions.map((permission) => permission.presets ?? {});

	return assign({}, ...presets, options.payload);
}
