<template>
	<v-item :value="field.field" scope="group-accordion" class="accordion-section">
		<template #default="{ active, toggle }">
			<div class="label type-title" :class="{ active, edited }" @click="handleModifier($event, toggle)">
				<span v-if="edited" v-tooltip="t('edited')" class="edit-dot"></span>
				<v-icon class="icon" :class="{ active }" name="expand_more" />
				<span class="field-name">{{ field.name }}</span>
				<v-icon v-if="field.meta?.required === true" class="required" sup name="star" />
				<v-chip v-if="badge" x-small>{{ badge }}</v-chip>
				<v-icon
					v-if="!active && validationMessage"
					v-tooltip="validationMessage"
					class="warning"
					name="error_outline"
					small
				/>
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
						nested
						@update:model-value="$emit('apply', $event)"
					/>
				</div>
			</transition-expand>
		</template>
	</v-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { merge, isNil } from 'lodash';
import { Field } from '@directus/shared/types';
import { ValidationError } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	name: 'AccordionSection',
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
		badge: {
			type: String,
			default: null,
		},
		group: {
			type: String,
			required: true,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['apply', 'toggleAll'],
	setup(props, { emit }) {
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

		return { t, fieldsInSection, edited, handleModifier, validationMessage };

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
	},
});
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
