<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, toRef } from 'vue';
import type { ImportRowLines, ImportRowRange } from '@directus/validation';
import type { APIError } from '@/types/error';
import { useFieldsStore } from '@/stores/fields';
import { useValidationErrorDetails } from '@/composables/use-validation-error-details';
import { VALIDATION_TYPES } from '@/constants';
import { ValidationError } from '@directus/types';

interface Props {
	errors: APIError[];
	collection: string;
}

type ValidationErrorWithRows = ValidationError & {
	rows: ImportRowLines[] | ImportRowRange[];
};

const props = defineProps<Props>();

const fieldsStore = useFieldsStore();

const modelValue = defineModel<boolean>({ required: true });

const { t } = useI18n();

const validationErrors = computed<ValidationError[]>(() =>
	props.errors.map(
		(err: APIError) =>
			({
				...err.extensions,
				collection: props.collection,
			}) as ValidationError,
	),
);

const validationTypesErrors = computed<ValidationError[]>(() =>
	validationErrors.value.filter((err: ValidationError) => VALIDATION_TYPES.includes(err?.code)),
);

const otherErrors = computed<(ValidationError & { fieldName?: string; customValidationMessage?: string })[]>(() =>
	validationErrors.value.filter((err: ValidationError) => !VALIDATION_TYPES.includes(err?.code)),
);

const { validationErrorsWithDetails, getDefaultValidationMessage } = useValidationErrorDetails(
	validationTypesErrors,
	toRef(fieldsStore.getFieldsForCollection(props.collection)),
);

const formattedErrors = computed(() => {
	return [
		...validationErrorsWithDetails.value.map((err) => ({ ...err, message: getDefaultValidationMessage(err) })),
		...otherErrors.value.map((err) => ({ ...err, message: t(`errors.${err.code}`, err) })),
	].map((err) => ({
		...err,
		formattedRows: formatRows((err as any as ValidationErrorWithRows).rows),
		rowCount: (err as any as ValidationErrorWithRows).rows.length,
	}));
});

function formatRows(rows: Array<ImportRowLines | ImportRowRange>): string {
	return rows
		.map((r) => {
			if (r.type === 'lines') return r.rows.join(', ');
			return `${r.start}–${r.end}`;
		})
		.join(', ');
}

function closeDialog() {
	modelValue.value = false;
}
</script>

<template>
	<v-dialog v-model="modelValue" persistent>
		<v-card>
			<v-card-title>{{ t('import_data_errors') }}</v-card-title>
			<v-card-text class="validation-errors-wrapper">
				<v-notice type="danger" multiline>
					<p>{{ $t('import_data_validation_errors_notice') }}</p>
					<ul class="validation-errors-list">
						<li v-for="(error, index) in formattedErrors" :key="index" class="validation-error">
							<strong v-if="error.rowCount > 0">
								{{
									$t('import_data_error_row', {
										rows: error.formattedRows,
										field: error?.fieldName ? ` (${error.fieldName})` : '',
									}) + ' '
								}}
							</strong>

							<template v-if="error.customValidationMessage">
								{{ error.customValidationMessage }}
								<v-icon v-tooltip="error.message" small right name="help" />
							</template>
							<template v-else>
								<span>{{ error.message }}</span>
							</template>
						</li>
					</ul>
				</v-notice>
			</v-card-text>
			<v-card-actions>
				<v-button @click="closeDialog">{{ $t('dismiss') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.v-card-text.validation-errors-wrapper {
	padding-block: 12px 0;
}

.validation-errors-list {
	padding-inline-start: 20px;
	list-style-type: disc;

	.validation-error {
		margin-block-start: 4px;
	}
}
</style>
