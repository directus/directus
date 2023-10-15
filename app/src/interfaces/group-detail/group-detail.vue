<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { Field, ValidationError } from '@directus/types';
import { isEqual } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		primaryKey: number | string;
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		disabled?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
		loading?: boolean;
		validationErrors?: ValidationError[];
		badge?: string;
		start?: 'open' | 'closed';
		headerIcon?: string;
		headerColor?: string;
		direction?: string;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
		start: 'open',
	}
);

defineEmits(['apply']);

const { t } = useI18n();

const detailOpen = ref(props.start === 'open');

// In case that conditions change the start prop after the group already got rendered
// caused by the async loading of data to run the conditions against
watch(
	() => props.loading,
	(newVal) => {
		if (!newVal) detailOpen.value = props.start === 'open';
	}
);

const edited = computed(() => {
	if (!props.values) return false;

	const editedFields = Object.keys(props.values);
	return props.fields.some((field) => editedFields.includes(field.field));
});

const validationMessages = computed(() => {
	if (!props.validationErrors) return;

	const fields = props.fields.map((field) => field.field);

	const errors = props.validationErrors.reduce((acc, validationError) => {
		if (fields.includes(validationError.field) === false) return acc;

		if (validationError.code === 'RECORD_NOT_UNIQUE') {
			acc.push(`${formatTitle(validationError.field)} ${t('validationError.unique').toLowerCase()}`);
		} else {
			acc.push(
				`${formatTitle(validationError.field)} ${t(
					`validationError.${validationError.type}`,
					validationError
				).toLowerCase()}`
			);
		}

		return acc;
	}, [] as string[]);

	if (errors.length === 0) return [];

	return errors;
});

watch(validationMessages, (newVal, oldVal) => {
	if (!validationMessages.value) return;
	if (isEqual(newVal, oldVal)) return;
	detailOpen.value = validationMessages.value.length > 0;
});
</script>

<template>
	<v-detail v-model="detailOpen" :start-open="start === 'open'" class="group-detail">
		<template #activator="{ toggle, active }">
			<v-divider
				:style="{
					'--v-divider-label-color': headerColor,
				}"
				:class="{ active, edited }"
				:inline-title="false"
				large
				@click="toggle"
			>
				<template v-if="headerIcon" #icon><v-icon :name="headerIcon" class="header-icon" /></template>
				<template v-if="field.name">
					<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
					<span class="title">{{ field.name }}</span>
				</template>
				<v-icon
					v-if="!active && validationMessages!.length > 0"
					v-tooltip="validationMessages!.join('\n')"
					class="warning"
					name="error"
					small
				/>
				<v-icon class="expand-icon" name="expand_more" />
			</v-divider>
		</template>

		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta?.field"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			:disabled="disabled"
			:badge="badge"
			:direction="direction"
			:show-no-visible-fields="false"
			:show-validation-errors="false"
			@update:model-value="$emit('apply', $event)"
		/>
	</v-detail>
</template>

<style scoped>
.v-form {
	padding-top: calc(var(--form-vertical-gap) / 2);
}

.v-divider {
	cursor: pointer;
}

.v-divider .expand-icon {
	float: right;
	transform: rotate(90deg) !important;
	transition: transform var(--fast) var(--transition);
}

.v-divider.active .expand-icon {
	transform: rotate(0) !important;
}

.v-divider :deep(.type-text) {
	position: relative;
}

.v-divider.edited:not(.active) .edit-dot {
	position: absolute;
	top: 7px;
	left: -7px;
	display: block;
	width: 4px;
	height: 4px;
	background-color: var(--theme--form--field--input--foreground-subdued);
	border-radius: 4px;
	content: '';
}

.header-icon {
	margin-right: 12px !important;
}

.warning {
	margin-left: 8px;
	color: var(--theme--danger);
}
</style>
