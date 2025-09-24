<script setup lang="ts">
import { formatValidationErrorMessage, type ValidationErrorWithDetails } from '@/utils/format-validation-error';
import { useI18n } from 'vue-i18n';

interface Props {
	errors: ValidationErrorWithDetails[];
}

defineProps<Props>();

const modelValue = defineModel<boolean>({ required: true });

const { t, te } = useI18n();

function closeDialog() {
	modelValue.value = false;
}
</script>

<template>
	<v-dialog v-model="modelValue" persistent>
		<v-card>
			<v-card-title>{{ $t('import_data_errors') }}</v-card-title>
			<div class="dialog-content">
				<v-notice type="danger" multiline>
					<div class="error-content">
						{{ t('validation_errors_notice') }}
						<ul class="validation-errors-list">
							<li v-for="(validationError, index) in errors" :key="index" class="validation-error">
								<strong>
									<span>
										{{ validationError.count > 1 ? `Rows ${validationError.rows}` : `Row ${validationError.rows}` }}
									</span>
									<template v-if="validationError.field">
										<strong>&nbsp;({{ validationError.field }})</strong>
									</template>
									<span>:</span>
								</strong>
								<span>&nbsp;{{ formatValidationErrorMessage(validationError, t, te) }}</span>
							</li>
						</ul>
					</div>
				</v-notice>
			</div>
			<v-card-actions>
				<v-button @click="closeDialog">{{ t('dismiss') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.dialog-content {
	padding: var(--v-card-padding, 16px);
	padding-block-start: 12px;
	padding-block-end: 0 !important;
}

.validation-errors-list {
	margin-block-start: 8px;
	padding-inline-start: 20px;
	list-style-type: disc;

	.validation-error {
		&:last-child {
			margin-block-end: 0;
		}
	}
}

.error-content {
	white-space: pre-wrap;
	overflow-wrap: break-word;
}
</style>
