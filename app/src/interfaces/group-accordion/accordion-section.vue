<template>
	<v-item :value="field.field" scope="group-accordion" class="accordion-section">
		<template #default="{ active, toggle }">
			<div class="label type-title" :class="{ active, edited }" @click="handleModifier($event, toggle)">
				<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
				<v-icon class="icon" :class="{ active }" name="expand_more" />
				<span class="field-name">{{ field.name }}</span>
				<v-icon v-if="field.meta?.required === true" class="required" sup name="star" filled />
				<v-chip v-if="badge" x-small>{{ badge }}</v-chip>
				<v-icon v-if="!active && validationMessage" v-tooltip="validationMessage" class="warning" name="error" small />
			</div>

			<transition-expand>
				<div v-if="active" class="fields">
					<v-form
						:initial-values="initialValues"
						:fields="fieldsInSection"
						:model-value="values"
						:primary-key="primaryKey"
						:group="group"
						:validation-errors="validationErrors"
						:loading="loading"
						:batch-mode="batchMode"
						:disabled="disabled"
						:direction="direction"
						:show-no-visible-fields="false"
						:show-validation-errors="false"
						@update:model-value="$emit('apply', $event)"
					/>
				</div>
			</transition-expand>
		</template>
	</v-item>
</template>

<script setup lang="ts">
import { Field, ValidationError } from '@directus/types';
import { isNil, merge } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		field: Field;
		fields: Field[];
		values: Record<string, unknown>;
		initialValues: Record<string, unknown>;
		disabled?: boolean;
		batchMode?: boolean;
		batchActiveFields?: string[];
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
	}
);

const emit = defineEmits<{
	(e: 'apply', value: Record<string, unknown>): void;
	(e: 'toggleAll'): void;
}>();

const { t } = useI18n();

const fieldsInSection = computed(() => {
	let fields: Field[] = [merge({}, props.field, { hideLabel: true })];

	if (props.field.meta?.special?.includes('group')) {
		fields.push(...getFieldsForGroup(props.field.meta?.field));
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

function getFieldsForGroup(group: null | string, passed: string[] = []): Field[] {
	const fieldsInGroup: Field[] = props.fields.filter((field) => {
		return field.meta?.group === group || (group === null && isNil(field.meta));
	});

	for (const field of fieldsInGroup) {
		if (field.meta?.special?.includes('group') && !passed.includes(field.meta!.field)) {
			passed.push(field.meta!.field);
			fieldsInGroup.push(...getFieldsForGroup(field.meta!.field, passed));
		}
	}

	return fieldsInGroup;
}
</script>

<style lang="scss" scoped>
.accordion-section {
	border-top: var(--border-width) solid var(--border-normal);

	&:last-child {
		border-bottom: var(--border-width) solid var(--border-normal);
	}
}

.label {
	position: relative;
	display: flex;
	align-items: center;
	margin: 8px 0;

	cursor: pointer;

	&:hover,
	&.active {
		.field-name,
		.icon {
			color: var(--foreground-normal);
		}
	}

	.field-name,
	.icon {
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);
	}

	.required {
		--v-icon-color: var(--primary);

		margin-top: -12px;
		margin-left: 2px;
	}

	.v-chip {
		margin: 0;
		margin-left: 8px;
	}

	.edit-dot {
		position: absolute;
		top: 14px;
		left: -7px;
		display: block;
		width: 4px;
		height: 4px;
		background-color: var(--foreground-subdued);
		border-radius: 4px;
		content: '';
	}
}

.icon {
	margin-right: 12px;
	transform: rotate(-90deg);
	transition: transform var(--fast) var(--transition);

	&.active {
		transform: rotate(0);
	}
}

.warning {
	margin-left: 8px;
	color: var(--danger);
}

.fields {
	margin: var(--form-vertical-gap) 0;
}
</style>
