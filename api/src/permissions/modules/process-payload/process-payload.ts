import type { Accountability, Filter, Item, PermissionsAction } from '@directus/types';
import { parseFilter, validatePayload } from '@directus/utils';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
import { assign, difference, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { extractRequiredDynamicVariableContext } from '../../utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../utils/fetch-dynamic-variable-data.js';
import { contextHasDynamicVariables } from '../process-ast/utils/context-has-dynamic-variables.js';
import {
	createCollectionForbiddenError,
	createFieldsForbiddenError,
} from '../process-ast/utils/validate-path/create-error.js';
import { isFieldNullable } from './lib/is-field-nullable.js';

export interface ProcessPayloadOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	payload: Item;
	nested: string[];
}

/**
 * @note this only validates the top-level fields. The expectation is that this function is called
 * for each level of nested insert separately
 */
export async function processPayload(options: ProcessPayloadOptions, context: Context) {
	let permissions;
	let permissionValidationRules: (Filter | null)[] = [];

	let policies: string[] = [];

	if (!options.accountability.admin) {
		policies = await fetchPolicies(options.accountability, context);

		permissions = await fetchPermissions(
			{ action: options.action, policies, collections: [options.collection], accountability: options.accountability },
			context,
		);

		if (permissions.length === 0) {
			throw createCollectionForbiddenError('', options.collection);
		}

		const fieldsAllowed = uniq(permissions.map(({ fields }) => fields ?? []).flat());

		if (fieldsAllowed.includes('*') === false) {
			const fieldsUsed = Object.keys(options.payload);
			const notAllowed = difference(fieldsUsed, fieldsAllowed);

			if (notAllowed.length > 0) {
				throw createFieldsForbiddenError('', options.collection, notAllowed);
			}
		}

		permissionValidationRules = permissions.map(({ validation }) => validation);
	}

	const fields = Object.values(context.schema.collections[options.collection]?.fields ?? {});

	const fieldValidationRules: (Filter | null)[] = [];

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

		if (field.validation) {
			const permissionContext = extractRequiredDynamicVariableContext(field.validation);

			const filterContext = contextHasDynamicVariables(permissionContext)
				? await fetchDynamicVariableData(
						{
							accountability: options.accountability,
							policies,
							dynamicVariableContext: permissionContext,
						},
						context,
					)
				: undefined;

			const validationFilter = parseFilter(field.validation, options.accountability, filterContext);

			fieldValidationRules.push(validationFilter);
		}
	}

	const presets = (permissions ?? []).map((permission) => permission.presets);

	const payloadWithPresets = assign({}, ...presets, options.payload);

	const validationRules = [...fieldValidationRules, ...permissionValidationRules].filter((rule): rule is Filter => {
		if (rule === null) return false;
		if (Object.keys(rule).length === 0) return false;
		return true;
	});

	if (validationRules.length > 0) {
		const validationErrors: InstanceType<typeof FailedValidationError>[] = [];

		validationErrors.push(
			...validatePayload({ _and: validationRules }, payloadWithPresets)
				.map((error) =>
					error.details.map(
						(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details, options.nested)),
					),
				)
				.flat(),
		);

		if (validationErrors.length > 0) throw validationErrors;
	}

	return payloadWithPresets;
}
