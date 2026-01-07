<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import VDetail from '@/components/v-detail.vue';
import { useValidationErrorDetails, type ValidationErrorWithDetails } from '@/composables/use-validation-error-details';
import { Field, ValidationError } from '@directus/types';
import ValidationNestedGroups from './validation-nested-groups.vue';
import {
	getReferencedFields,
	hasNestedGroups,
	parseValidationStructure,
	errorMatchesValidationRule,
} from '@/utils/format-validation-structure';
import { computed, toRef } from 'vue';

const props = defineProps<{
	validationErrors: ValidationError[];
	fields: Field[];
}>();

defineEmits(['scroll-to-field']);

const { validationErrorsWithDetails, getDefaultValidationMessage } = useValidationErrorDetails(
	toRef(() => props.validationErrors),
	toRef(() => props.fields),
);

function getNestedKey(validationError: ValidationErrorWithDetails) {
	return `${validationError.group ?? ''}::${validationError.field}`;
}

const displayValidationErrors = computed(() => {
	const seen = new Set<string>();

	const referencedFieldsMap = new Map<string, Set<string>>();

	props.fields.forEach((field) => {
		if (field.meta?.validation) {
			const referencedFields = getReferencedFields(field.meta.validation);

			referencedFields.forEach((referencedField) => {
				if (!referencedFieldsMap.has(referencedField)) {
					referencedFieldsMap.set(referencedField, new Set());
				}

				referencedFieldsMap.get(referencedField)!.add(field.field);
			});
		}
	});

	const fieldsWithNestedValidation = new Set(
		props.fields
			.filter((field) => field.meta?.validation && hasNestedGroups(field.meta.validation))
			.map((field) => field.field),
	);

	const fieldsWithNestedValidationErrors = new Set(
		validationErrorsWithDetails.value
			.filter((error) => error.hasNestedValidation && error.validationStructure)
			.map((error) => error.field),
	);

	const filteredErrors = validationErrorsWithDetails.value.filter((error) => {
		if (!error.hasNestedValidation || !error.validationStructure) {
			const errorField = props.fields.find((f) => f.field === error.field);

			if (errorField?.meta?.validation) {
				const matchesOwnValidation = errorMatchesValidationRule(
					{
						field: error.field,
						type: error.type,
						substring: error.substring,
						valid: error.valid,
						invalid: error.invalid,
					},
					errorField.meta.validation,
				);

				if (matchesOwnValidation) {
					return true;
				}
			}

			const referencingFields = referencedFieldsMap.get(error.field);

			if (referencingFields) {
				const shouldFilter = Array.from(referencingFields).some((referencingField) => {
					if (
						!fieldsWithNestedValidation.has(referencingField) &&
						!fieldsWithNestedValidationErrors.has(referencingField)
					) {
						return false;
					}

					const referencingFieldObj = props.fields.find((f) => f.field === referencingField);

					if (!referencingFieldObj?.meta?.validation) return false;

					return errorMatchesValidationRule(
						{
							field: error.field,
							type: error.type,
							substring: error.substring,
							valid: error.valid,
							invalid: error.invalid,
						},
						referencingFieldObj.meta.validation,
					);
				});

				if (shouldFilter) {
					return false;
				}
			}

			return true;
		}

		const key = getNestedKey(error);

		if (seen.has(key)) return false;

		seen.add(key);
		return true;
	});

	const allFieldsWithErrors = new Set(validationErrorsWithDetails.value.map((error) => error.field));
	const fieldsWithErrors = new Set(filteredErrors.map((error) => error.field));

	const virtualErrors: ValidationErrorWithDetails[] = [];

	props.fields.forEach((field) => {
		if (
			field.meta?.validation &&
			hasNestedGroups(field.meta.validation) &&
			!fieldsWithErrors.has(field.field) &&
			!fieldsWithNestedValidationErrors.has(field.field)
		) {
			const referencedFields = getReferencedFields(field.meta.validation);

			const matchingErrors = validationErrorsWithDetails.value.filter((error) => {
				if (!allFieldsWithErrors.has(error.field)) return false;
				if (!referencedFields.has(error.field)) return false;

				return errorMatchesValidationRule(
					{
						field: error.field,
						type: error.type,
						substring: error.substring,
						valid: error.valid,
						invalid: error.invalid,
					},
					field.meta?.validation,
				);
			});

			if (matchingErrors.length > 0) {
				const validationStructure = parseValidationStructure(field.meta.validation);

				if (validationStructure) {
					const fieldForError = props.fields.find((f) => f.field === field.field);

					const groupField = fieldForError?.meta?.group
						? props.fields.find((f) => f.field === fieldForError?.meta?.group)
						: null;

					virtualErrors.push({
						code: 'FAILED_VALIDATION',
						collection: fieldForError?.collection ?? '',
						field: field.field,
						type: 'nnull',
						hidden: fieldForError?.meta?.hidden,
						group: fieldForError?.meta?.group ?? null,
						fieldName: fieldForError?.name ?? field.field,
						groupName: groupField?.name ?? fieldForError?.meta?.group,
						customValidationMessage: fieldForError?.meta?.validation_message ?? null,
						validationStructure,
						hasNestedValidation: true,
					} as ValidationErrorWithDetails);
				}
			}
		}
	});

	return [...filteredErrors, ...virtualErrors];
});

function getErrorKey(validationError: ValidationErrorWithDetails) {
	if (validationError.hasNestedValidation && validationError.validationStructure) return getNestedKey(validationError);
	return `${getNestedKey(validationError)}::${validationError.type}`;
}
</script>

<template>
	<VNotice type="danger" class="full">
		<div class="validation-errors">
			<p>{{ $t('validation_errors_notice') }}</p>
			<ul class="validation-errors-list">
				<li
					v-for="validationError of displayValidationErrors"
					:key="getErrorKey(validationError)"
					class="validation-error"
				>
					<template v-if="validationError.hasNestedValidation && validationError.validationStructure">
						<VDetail class="field-detail" start-open>
							<template #activator="{ active, toggle }">
								<div class="field-row">
									<strong
										class="field"
										@click="$emit('scroll-to-field', validationError.group || validationError.field)"
									>
										<template v-if="validationError.field && validationError.hidden && validationError.group">
											{{
												`${validationError.fieldName} (${$t('hidden_in_group', {
													group: validationError.groupName,
												})}): `
											}}
										</template>
										<template v-else-if="validationError.field && validationError.hidden">
											{{ `${validationError.fieldName} (${$t('hidden')}): ` }}
										</template>
										<template v-else-if="validationError.field">{{ `${validationError.fieldName}: ` }}</template>
									</strong>
									<span class="field-message">
										{{ validationError.customValidationMessage ?? $t('validation_value_is_invalid') }}
									</span>
									<button
										type="button"
										class="field-toggle"
										:class="{ 'is-collapsed': !active }"
										:aria-label="$t('toggle')"
										:aria-expanded="active"
										@click.stop="toggle"
									>
										<VIcon name="expand_circle_down" small />
									</button>
								</div>
							</template>

							<ValidationNestedGroups
								:node="validationError.validationStructure"
								:parent-field="validationError.field"
								:fields="props.fields"
							/>
						</VDetail>
					</template>

					<template v-else>
						<strong class="field" @click="$emit('scroll-to-field', validationError.group || validationError.field)">
							<template v-if="validationError.field && validationError.hidden && validationError.group">
								{{
									`${validationError.fieldName} (${$t('hidden_in_group', {
										group: validationError.groupName,
									})}): `
								}}
							</template>
							<template v-else-if="validationError.field && validationError.hidden">
								{{ `${validationError.fieldName} (${$t('hidden')}): ` }}
							</template>
							<template v-else-if="validationError.field">{{ validationError.fieldName }}</template>
						</strong>
						<span v-if="validationError.field && !validationError.hidden">{{ `: ` }}</span>

						<template v-if="validationError.customValidationMessage">
							{{ validationError.customValidationMessage }}
						</template>

						<template v-else>{{ getDefaultValidationMessage(validationError) }}</template>
					</template>
				</li>
			</ul>
		</div>
	</VNotice>
</template>

<style lang="scss" scoped>
.validation-errors {
	--validation-errors-line-gap: 4px;
}

:deep(.v-notice) {
	inline-size: 100%;
}

:deep(.v-notice-content) {
	flex: 1 1 auto;
	min-inline-size: 0;
}

.validation-errors-list {
	margin-block: 4px 0;
	padding-inline-start: 24px;
	list-style: disc;
	color: var(--theme--danger);
	line-height: 1.2;

	.field {
		cursor: pointer;
		color: inherit;

		&:hover {
			text-decoration: underline;
		}
	}

	> li + li {
		margin-block-start: var(--validation-errors-line-gap, 4px);
	}
}

.field-detail {
	:deep(> .content) {
		margin-block: var(--validation-errors-line-gap, 4px) 0;
	}
}

.field-row {
	display: flex;
	align-items: center;
	gap: 6px;
	inline-size: 100%;
	min-inline-size: 0;
}

.field-message {
	color: inherit;
	min-inline-size: 0;
	overflow-wrap: anywhere;
	flex: 0 1 auto;
}

.field-toggle {
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border: 0;
	background: transparent;
	padding: 0;
	color: inherit;
	cursor: pointer;
}

.field-toggle :deep(.v-icon) {
	color: currentColor;
	transition: transform var(--fast) var(--transition);
	transform: rotate(0deg);
	transform-origin: center;
}

.field-toggle.is-collapsed :deep(.v-icon) {
	transform: rotate(90deg);
}
</style>
