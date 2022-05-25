<template>
	<v-item :value="field.field" scope="group-accordion" class="accordion-section">
		<template #default="{ active, toggle }">
			<div class="label type-title" :class="{ active, edited }" @click="handleModifier($event, toggle)">
				<v-icon class="icon" :class="{ active }" name="expand_more" />
				{{ field.name }}
				<v-icon v-if="field.meta?.required === true" class="required" sup name="star" />
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
import { merge } from 'lodash';
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
		group: {
			type: String,
			required: true,
		},

		multiple: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['apply', 'toggleAll'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsInSection = computed(() => {
			return props.fields
				.filter((field) => {
					if (field.meta?.group === props.group && field.meta?.id !== props.field.meta?.id) return false;
					return true;
				})
				.map((field) => {
					if (field.meta?.id === props.field.meta?.id) {
						return merge({}, field, {
							hideLabel: true,
						});
					}

					return field;
				});
		});

		const edited = computed(() => {
			if (!props.values) return false;

			const editedFields = Object.keys(props.values);
			return fieldsInSection.value.some((field) => editedFields.includes(field.field)) ? true : false;
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

		return { fieldsInSection, edited, handleModifier, validationMessage };

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
	color: var(--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);

	&:hover,
	&.active {
		color: var(--foreground-normal);
	}

	.required {
		--v-icon-color: var(--primary);

		margin-top: -12px;
		margin-left: 2px;
	}

	&.edited::before {
		position: absolute;
		top: 14px;
		left: -7px;
		display: block;
		width: 4px;
		height: 4px;
		background-color: var(--foreground-subdued);
		border-radius: 4px;
		content: '';
		pointer-events: none;
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
