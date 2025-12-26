<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import VDetail from '@/components/v-detail.vue';
import { useValidationErrorDetails, type ValidationErrorWithDetails } from '@/composables/use-validation-error-details';
import { Field, ValidationError } from '@directus/types';
import ValidationNestedGroups from './validation-nested-groups.vue';
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

	return validationErrorsWithDetails.value.filter((error) => {
		if (!error.hasNestedValidation || !error.validationStructure) return true;
		const key = getNestedKey(error);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
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
												})})`
											}}
										</template>
										<template v-else-if="validationError.field && validationError.hidden">
											{{ `${validationError.fieldName} (${$t('hidden')})` }}
										</template>
										<template v-else-if="validationError.field">{{ validationError.fieldName }}</template>
									</strong>
									<span v-if="validationError.field">:</span>
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

							<ValidationNestedGroups :node="validationError.validationStructure" />
						</VDetail>
					</template>

					<template v-else>
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
						<span v-if="validationError.field">:</span>

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
		margin-block-start: var(--validation-errors-line-gap, 4px);
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
