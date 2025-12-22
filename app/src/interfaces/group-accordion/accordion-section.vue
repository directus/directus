<script setup lang="ts">
import TransitionExpand from '@/components/transition/expand.vue';
import VChip from '@/components/v-chip.vue';
import type { ComparisonContext } from '@/components/v-form/types';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VItem from '@/components/v-item.vue';
import { getFieldsInGroup } from '@/utils/get-fields-in-group';
import { Field, ValidationError } from '@directus/types';
import { merge } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		disabled?: boolean;
		nonEditable?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
		comparison?: ComparisonContext;
		primaryKey: number | string;
		loading?: boolean;
		validationErrors?: ValidationError[];
		badge?: string;
		group: string;
		multiple?: boolean;
		direction?: string;
	}>(),
	{
		batchActiveFields: () => [],
		validationErrors: () => [],
	},
);

const emit = defineEmits<{
	(e: 'apply', value: Record<string, unknown>): void;
	(e: 'toggleAll'): void;
}>();

const { t } = useI18n();

const { isFieldWithDifference, isRevisionUpdateOnly } = useComparisonIndicator();

const fieldsInSection = computed(() => {
	const fields: Field[] = [merge({}, props.field, { hideLabel: true })];

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

const validationMessage = computed(() => {
	const validationError = props.validationErrors.find((error) => error.field === props.field.field);
	if (validationError === undefined) return;

	if (validationError.code === 'RECORD_NOT_UNIQUE') {
		return t('validationError.unique');
	} else {
		return t(`validationError.${validationError.type}`, validationError);
	}
});

function handleModifier(event: MouseEvent, toggle: () => void) {
	if (props.multiple === false) {
		toggle();
		return;
	}

	if (event.shiftKey) {
		emit('toggleAll');
	} else {
		toggle();
	}
}

function useComparisonIndicator() {
	const isFieldWithDifference = computed(() => props.comparison?.fields.has(props.field.field));

	const isRevisionUpdateOnly = computed(() => {
		return !isFieldWithDifference.value && props.comparison?.revisionFields?.has(props.field.field);
	});

	return { isFieldWithDifference, isRevisionUpdateOnly };
}
</script>

<template>
	<VItem v-if="!field.meta?.hidden" :value="field.field" scope="group-accordion" class="accordion-section">
		<template #default="{ active, toggle }">
			<div
				:class="{
					'indicator-active': !active && isFieldWithDifference,
					'indicator-muted': (active && isFieldWithDifference) || isRevisionUpdateOnly,
				}"
			>
				<button
					type="button"
					class="label type-title"
					:class="{ active, edited }"
					@click="handleModifier($event, toggle)"
				>
					<span v-if="edited" v-tooltip="$t('edited')" class="edit-dot"></span>
					<VIcon class="icon" :class="{ active }" name="expand_more" />
					<span class="field-name">{{ field.name }}</span>
					<VIcon v-if="field.meta?.required === true" class="required" sup name="star" filled />
					<VChip v-if="badge" x-small>{{ badge }}</VChip>
					<VIcon v-if="!active && validationMessage" v-tooltip="validationMessage" class="warning" name="error" small />
				</button>

				<TransitionExpand>
					<div v-if="active">
						<VForm
							class="fields"
							:initial-values="initialValues"
							:fields="fieldsInSection"
							:model-value="values"
							:primary-key="primaryKey"
							:group="group"
							:validation-errors="validationErrors"
							:loading="loading"
							:batch-mode="batchMode"
							:disabled="disabled"
							:non-editable="nonEditable"
							:comparison="comparison"
							:direction="direction"
							:show-no-visible-fields="false"
							:show-validation-errors="false"
							@update:model-value="$emit('apply', $event)"
						/>
					</div>
				</TransitionExpand>
			</div>
		</template>
	</VItem>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.accordion-section {
	border-block-start: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
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

.label {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: 100%;
	padding: 8px 0;
	cursor: pointer;

	&:hover,
	&.active {
		.field-name,
		.icon {
			color: var(--theme--form--field--input--foreground);
		}
	}

	.field-name,
	.icon {
		color: var(--theme--form--field--input--foreground-subdued);
		transition: color var(--fast) var(--transition);
	}

	.required {
		--v-icon-color: var(--theme--primary);

		margin-block-start: -12px;
		margin-inline-start: 2px;
	}

	.v-chip {
		margin: 0;
		margin-inline-start: 8px;
	}

	.edit-dot {
		position: absolute;
		inset-block-start: 14px;
		inset-inline-start: -7px;
		display: block;
		inline-size: 4px;
		block-size: 4px;
		background-color: var(--theme--form--field--input--foreground-subdued);
		border-radius: 4px;
		content: '';
	}
}

.icon {
	margin-inline-end: 12px;
	transform: rotate(-90deg);
	transition: transform var(--fast) var(--transition);

	&.active {
		transform: rotate(0deg);
	}
}

.warning {
	margin-inline-start: 8px;
	color: var(--theme--danger);
}

.fields {
	padding: var(--theme--form--row-gap) 0;
}
</style>
