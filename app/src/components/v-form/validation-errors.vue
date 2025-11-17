<script setup lang="ts">
import { ValidationError, Field } from '@directus/types';
import { useValidationErrorDetails } from '@/composables/use-validation-error-details';
import { toRef } from 'vue';

const props = defineProps<{
	validationErrors: ValidationError[];
	fields: Field[];
}>();

defineEmits(['scroll-to-field']);

const { validationErrorsWithDetails, getDefaultValidationMessage } = useValidationErrorDetails(
	toRef(props.validationErrors),
	toRef(props.fields),
);
</script>

<template>
	<v-notice type="danger" class="full">
		<div>
			<p>{{ $t('validation_errors_notice') }}</p>
			<ul class="validation-errors-list">
				<li v-for="(validationError, index) of validationErrorsWithDetails" :key="index" class="validation-error">
					<strong class="field" @click="$emit('scroll-to-field', validationError.group || validationError.field)">
						<template v-if="validationError.field && validationError.hidden && validationError.group">
							{{
								`${validationError.fieldName} (${$t('hidden_in_group', {
									group: validationError.groupName,
								})})`
							}}
						</template>
						<template v-else-if="validationError.field && validationError.hidden">
							{{ `${validationError.fieldName} (${$t('hidden')})` }}
						</template>
						<template v-else-if="validationError.field">{{ validationError.fieldName }}</template>
					</strong>
					<strong>{{ ': ' }}</strong>

					<template v-if="validationError.customValidationMessage">
						{{ validationError.customValidationMessage }}
						<v-icon v-tooltip="getDefaultValidationMessage(validationError)" small right name="help" />
					</template>

					<template v-else>{{ getDefaultValidationMessage(validationError) }}</template>
				</li>
			</ul>
		</div>
	</v-notice>
</template>

<style lang="scss" scoped>
.validation-errors-list {
	margin-block-start: 4px;
	padding-inline-start: 28px;

	.field {
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}
	}

	.validation-error .v-icon {
		vertical-align: text-top;
		margin-inline-start: 0 !important;
	}

	li:not(:last-child) {
		margin-block-end: 4px;
	}
}
</style>
