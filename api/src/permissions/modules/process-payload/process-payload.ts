import { ForbiddenError } from '@directus/errors';
import type { Accountability, Filter, Item, PermissionsAction, PrimaryKey } from '@directus/types';
import { parseFilter, validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import { assign, difference, uniq } from 'lodash-es';
import { ItemsService } from '../../../services/index.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { extractRequiredDynamicVariableContext } from '../../utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../utils/fetch-dynamic-variable-data.js';
import { isFieldNullable } from './lib/is-field-nullable.js';

export interface ProcessPayloadOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	payload: Item;
	keys?: PrimaryKey[];
}

/**
 * @note this only validates the top-level fields. The expectation is that this function is called
 * for each level of nested insert separately
 */
export async function processPayload(options: ProcessPayloadOptions, context: Context) {
	let permissions;
	let permissionValidationRules: (Filter | null)[] = [];

	const policies = await fetchPolicies(options.accountability, context);

	if (!options.accountability.admin) {
		permissions = await fetchPermissions(
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

		permissionValidationRules = permissions.map(({ validation }) => validation);
	}

	const presets = (permissions ?? []).map((permission) => permission.presets);
	const payloadWithPresets = assign({}, ...presets, options.payload);

	const fields = Object.values(context.schema.collections[options.collection]?.fields ?? {});
	const fieldValidationRules: (Filter | null)[] = [];
	const fieldsToQuery: string[] = [];

	for (const field of fields) {
		if (!isFieldNullable(field)) {
			const isSubmissionRequired = options.action === 'create' && field.defaultValue === null;

			if (isSubmissionRequired) {
				fieldValidationRules.push({
					[field.field]: {
						_submitted: true,
					},
				});
			}

			fieldValidationRules.push({
				[field.field]: {
					_nnull: true,
				},
			});
		}

		const permissionContext = extractRequiredDynamicVariableContext(field.validation);

		const filterContext = await fetchDynamicVariableData(
			{
				accountability: options.accountability,
				policies,
				dynamicVariableContext: permissionContext,
			},
			context,
		);

		// only query fields not in the payload
		if (!(field.field in payloadWithPresets)) {
			fieldsToQuery.push(field.field);
		}

		const validationFilter = parseFilter(field.validation, options.accountability, filterContext);

		fieldValidationRules.push(validationFilter);
	}

	const validationRules = [...fieldValidationRules, ...permissionValidationRules].filter((rule): rule is Filter => {
		if (rule === null) return false;
		if (Object.keys(rule).length === 0) return false;
		return true;
	});

	if (validationRules.length > 0) {
		const validationErrors: InstanceType<typeof FailedValidationError>[] = [];

		if (options.keys && options.keys.length > 0) {
			const itemService = new ItemsService(options.collection, {
				accountability: null,
				schema: context.schema,
				knex: context.knex,
			});

			const existingItemsData = await itemService.readMany(options.keys, {
				fields: fieldsToQuery.length > 0 ? fieldsToQuery : null,
			});

			for (const existingItem of existingItemsData) {
				validationErrors.push(
					...validatePayload(
						{ _and: validationRules },
						{
							...existingItem,
							...payloadWithPresets,
						},
					)
						.map((error) =>
							error.details.map(
								(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)),
							),
						)
						.flat(),
				);
			}
		} else {
			validationErrors.push(
				...validatePayload({ _and: validationRules }, payloadWithPresets)
					.map((error) =>
						error.details.map((details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details))),
					)
					.flat(),
			);
		}

		if (validationErrors.length > 0) throw validationErrors;
	}

	return payloadWithPresets;
}
