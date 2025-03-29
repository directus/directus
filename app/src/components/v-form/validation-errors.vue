<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { ValidationError, Field } from '@directus/types';
import { formatFieldFunction } from '@/utils/format-field-function';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

const props = defineProps<{
	validationErrors: ValidationError[];
	fields: Field[];
}>();

defineEmits(['scroll-to-field']);

const { t } = useI18n();

const validationErrorsWithNames = computed<
	(ValidationError & { fieldName: string; groupName: string; customValidationMessage: string | null })[]
>(() => {
	return props.validationErrors.map(
		(validationError: ValidationError & { nestedNames?: Record<string, string>; validation_message?: string }) => {
			const { field: _fieldKey, fn: functionName } = extractFieldFromFunction(validationError.field);
			const [fieldKey, ...nestedFieldKeys] = _fieldKey.split('.');
			const field = props.fields.find((field) => field.field === fieldKey);
			const group = props.fields.find((field) => field.field === validationError.group);
			const fieldName = getFieldName() + getNestedFieldNames(nestedFieldKeys, validationError.nestedNames);

			return {
				...validationError,
				field: fieldKey,
				fieldName,
				groupName: group?.name ?? validationError.group,
				customValidationMessage: validationError.validation_message ?? field?.meta?.validation_message,
			};

			function getFieldName() {
				if (!field) return validationError.field;
				if (functionName) return formatFieldFunction(field.collection, validationError.field);
				return field.name;
			}

			function getNestedFieldNames(nestedFieldKeys: string[], nestedNames?: Record<string, string>) {
				if (!nestedFieldKeys?.length) return '';
				const separator = ' → ';
				return `${separator}${nestedFieldKeys.map((name) => nestedNames?.[name] ?? name).join(separator)}`;
			}
		},
	) as (ValidationError & { fieldName: string; groupName: string; customValidationMessage: string | null })[];
});
</script>

<template>
	<v-notice type="danger" class="full selectable">
		<div>
			<p>{{ t('validation_errors_notice') }}</p>
			<ul class="validation-errors-list">
				<li v-for="(validationError, index) of validationErrorsWithNames" :key="index" class="validation-error">
					<strong class="field" @click="$emit('scroll-to-field', validationError.group || validationError.field)">
						<template v-if="validationError.field && validationError.hidden && validationError.group">
							{{
								`${validationError.fieldName} (${t('hidden_in_group', {
									group: validationError.groupName,
								})})`
							}}
						</template>
						<template v-else-if="validationError.field && validationError.hidden">
							{{ `${validationError.fieldName} (${t('hidden')})` }}
						</template>
						<template v-else-if="validationError.field">{{ validationError.fieldName }}</template>
					</strong>
					<strong>{{ ': ' }}</strong>
					<template v-if="validationError.customValidationMessage">
						{{ validationError.customValidationMessage }}
						<v-icon
							v-tooltip="
								validationError.code === 'RECORD_NOT_UNIQUE'
									? t('validationError.unique', validationError)
									: t(`validationError.${validationError.type}`, validationError)
							"
							small
							right
							name="help"
						/>
					</template>
					<template v-else>
						<template v-if="validationError.code === 'RECORD_NOT_UNIQUE'">
							{{ t('validationError.unique', validationError) }}
						</template>
						<template v-else>
							{{ t(`validationError.${validationError.type}`, validationError) }}
						</template>
					</template>
				</li>
			</ul>
		</div>
	</v-notice>
</template>

<style lang="scss" scoped>
.validation-errors-list {
	margin-top: 4px;
	padding-left: 28px;

	.field {
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	.validation-error .v-icon {
		vertical-align: text-top;
		margin-left: 0 !important;
	}

	li:not(:last-child) {
		margin-bottom: 4px;
	}
}
</style>
