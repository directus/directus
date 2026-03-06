<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { Field, ValidationError } from '@directus/types';
import { TabsTrigger } from 'reka-ui';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChip from '@/components/v-chip.vue';
import type { ComparisonContext } from '@/components/v-form/types';
import VIcon from '@/components/v-icon/v-icon.vue';
import { getFieldsInGroup } from '@/utils/get-fields-in-group';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		validationErrors?: ValidationError[];
		comparison?: ComparisonContext;
		badge?: string;
	}>(),
	{
		validationErrors: () => [],
	},
);

const { t } = useI18n();

const fieldsInSection = computed(() => {
	const fields: Field[] = [props.field];

	if (props.field.meta?.special?.includes('group')) {
		fields.push(...getFieldsInGroup(props.field.field, props.fields));
	}

	return fields;
});

const edited = computed(() => {
	if (!props.values) return false;
	const editedFields = Object.keys(props.values);
	return fieldsInSection.value.some((field) => editedFields.includes(field.field));
});

const validationMessages = computed(() => {
	const fieldNames = fieldsInSection.value.map((field) => field.field);

	const errors = props.validationErrors.reduce((acc, validationError) => {
		if (fieldNames.includes(validationError.field) === false) return acc;

		if (validationError.code === 'RECORD_NOT_UNIQUE') {
			acc.push(`${formatTitle(validationError.field)} ${t('validationError.unique').toLowerCase()}`);
		} else {
			acc.push(
				`${formatTitle(validationError.field)} ${t(
					`validationError.${validationError.type}`,
					validationError,
				).toLowerCase()}`,
			);
		}

		return acc;
	}, [] as string[]);

	return errors;
});

const { isFieldWithDifference, isRevisionUpdateOnly } = useComparisonIndicator();

function useComparisonIndicator() {
	const isFieldWithDifference = computed(() => props.comparison?.fields.has(props.field.field));

	const isRevisionUpdateOnly = computed(() => {
		return !isFieldWithDifference.value && props.comparison?.revisionFields?.has(props.field.field);
	});

	return { isFieldWithDifference, isRevisionUpdateOnly };
}
</script>

<template>
	<TabsTrigger
		:value="field.field"
		class="tab-trigger"
		:class="{
			'indicator-active': isFieldWithDifference,
			'indicator-muted': isRevisionUpdateOnly,
		}"
	>
		<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
		<span class="field-name">{{ field.name }}</span>
		<VChip v-if="badge" x-small>{{ badge }}</VChip>
		<VIcon
			v-if="validationMessages.length > 0"
			v-tooltip="validationMessages.join('\n')"
			class="warning"
			name="error"
			small
		/>
	</TabsTrigger>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.tab-trigger {
	position: relative;
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border: var(--theme--border-width) solid transparent;
	border-radius: var(--theme--border-radius);
	background-color: transparent;
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	font-size: var(--theme--form--field--label--font-size, 14px);
	font-weight: 600;
	transition:
		color var(--fast) var(--transition),
		background-color var(--fast) var(--transition),
		border-color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground-accent);
	}

	&[data-state='active'] {
		border-color: var(--theme--background-accent);
		background-color: var(--theme--background-accent);
		color: var(--theme--foreground-accent);

		.edit-dot {
			background-color: var(--theme--foreground);
		}
	}

	.field-name {
		transition: color var(--fast) var(--transition);
	}

	.v-chip {
		margin: 0;
		margin-inline-start: 8px;
	}

	.edit-dot {
		display: inline-block;
		inline-size: 4px;
		block-size: 4px;
		margin-inline-end: 4px;
		background-color: var(--theme--foreground-subdued);
		border-radius: 50%;
		flex-shrink: 0;
	}
}

.indicator-active {
	@include mixins.field-indicator;

	&::before {
		transition: background-color var(--slow) var(--transition);
	}
}

.indicator-muted {
	@include mixins.field-indicator('muted');

	&::before {
		transition: background-color var(--slow) var(--transition) var(--fast);
	}
}

.warning {
	margin-inline-start: 8px;
	color: var(--theme--danger);
}
</style>
