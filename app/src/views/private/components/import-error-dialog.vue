<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import type { ImportRowLine, ImportRowRange } from '@directus/validation';
import type { APIError } from '@/types/error';
import { useFieldsStore } from '@/stores/fields';

interface Props {
	errors: APIError[];
	collection: string;
}

const props = defineProps<Props>();

const fieldsStore = useFieldsStore();

const modelValue = defineModel<boolean>({ required: true });

const { t } = useI18n();

function closeDialog() {
	modelValue.value = false;
}

function formatRows(rows: Array<ImportRowLine | ImportRowRange>): string {
	return rows
		.map((r) => {
			if (r.type === 'line') return r.row.toString();
			return `${r.start}-${r.end}`;
		})
		.join(', ');
}

function getErrorMessage(error: APIError): string {
	const field = fieldsStore.getField(props.collection, error.extensions.field);
	const customMessage = field?.meta?.validation_message;

	return customMessage || error.message;
}

const totalErrors = computed(() => props.errors.length);

const errorSummary = computed(() => t('import_data_error_summary', { count: totalErrors.value }));

const formattedErrors = computed(() => {
	return props.errors.map((error) => ({
		...error,
		formattedRows: formatRows(error.extensions.rows),
		message: getErrorMessage(error),
		rowCount: error.extensions.rows.length,
	}));
});
</script>

<template>
	<v-dialog v-model="modelValue" persistent>
		<v-card>
			<v-card-title>{{ t('import_data_errors') }}</v-card-title>
			<div class="dialog-content">
				<v-notice type="danger">
					<div>
						<p>{{ errorSummary }}</p>
						<ul class="validation-errors-list">
							<li v-for="(error, index) in formattedErrors" :key="index" class="validation-error">
								<strong v-if="error.rowCount > 0">
									{{
										$t(
											'import_data_error_row',
											{ count: error.rowCount, rows: error.formattedRows },
											{ escapeParameter: true },
										)
									}}
								</strong>
								<span>{{ error.message }}</span>
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
</style>

