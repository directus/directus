<template>
	<v-item :value="field.field" scope="group-accordion" class="accordion-section">
		<template #default="{ active, toggle }">
			<div class="label type-title" :class="{ active }" @click="handleModifier($event, toggle)">
				<v-icon class="icon" :class="{ active }" name="expand_more" />
				{{ field.name }}
			</div>

			<transition-expand>
				<div v-show="active" class="fields">
					<v-form
						:initial-values="initialValues"
						:fields="fieldsInSection"
						:model-value="values"
						:primary-key="primaryKey"
						:group="group"
						:validation-errors="validationErrors"
						:loading="loading"
						:batch-mode="batchMode"
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
			type: Number,
			required: true,
		},

		multiple: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['apply', 'toggleAll'],
	setup(props, { emit }) {
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

		return { fieldsInSection, handleModifier };

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

<style scoped>
.accordion-section {
	border-top: var(--border-width) solid var(--border-normal);
}

.accordion-section:last-child {
	border-bottom: var(--border-width) solid var(--border-normal);
}

.label {
	display: flex;
	align-items: center;
	margin: 8px 0;
	color: var(--foreground-subdued);
	cursor: pointer;
	transition: color var(--fast) var(--transition);
}

.label:hover,
.label.active {
	color: var(--foreground-normal);
}

.icon {
	margin-right: 12px;
	transform: rotate(-90deg);
	transition: transform var(--fast) var(--transition);
}

.icon.active {
	transform: rotate(0);
}

.fields {
	margin: var(--form-vertical-gap) 0;
}
</style>
