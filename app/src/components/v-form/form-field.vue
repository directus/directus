<template>
	<div
		class="field"
		:key="field.field"
		:class="[(field.meta && field.meta.width) || 'full', { invalid: validationError }]"
	>
		<v-menu v-if="field.hideLabel !== true" placement="bottom-start" show-arrow :disabled="isDisabled">
			<template #activator="{ toggle, active }">
				<form-field-label
					:field="field"
					:toggle="toggle"
					:active="active"
					:disabled="isDisabled"
					:batch-mode="batchMode"
					:batch-active="batchActive"
					@toggle-batch="$emit('toggle-batch', $event)"
				/>
			</template>

			<form-field-menu
				:field="field"
				:value="_value"
				:initial-value="initialValue"
				@input="emitValue($event)"
				@unset="$emit('unset', $event)"
				@edit-raw="showRaw = true"
			/>
		</v-menu>
		<div class="label-spacer" v-else-if="['full', 'fill'].includes(field.meta && field.meta.width) === false" />

		<form-field-interface
			:value="_value"
			:field="field"
			:loading="loading"
			:batch-mode="batchMode"
			:batch-active="batchActive"
			:disabled="isDisabled"
			:primary-key="primaryKey"
			@input="emitValue($event)"
		/>

		<v-dialog v-model="showRaw" @esc="showRaw = false">
			<v-card>
				<v-card-title>{{ $t('edit_raw_value') }}</v-card-title>
				<v-card-text>
					<v-textarea class="raw-value" v-model="rawValue" :placeholder="$t('enter_raw_value')" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="showRaw = false">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<small class="note" v-if="field.meta && field.meta.note" v-html="marked(field.meta.note)" />

		<small class="validation-error" v-if="validationError">
			{{ $t(`validationError.${validationError.type}`, validationError) }}
		</small>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Field } from '@/types/';
import marked from 'marked';
import FormFieldLabel from './form-field-label.vue';
import FormFieldMenu from './form-field-menu.vue';
import FormFieldInterface from './form-field-interface.vue';
import { ValidationError } from './types';
import { getJSType } from '@/utils/get-js-type';
import { isEqual } from 'lodash';

export default defineComponent({
	components: { FormFieldLabel, FormFieldMenu, FormFieldInterface },
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActive: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: [String, Number, Object, Array, Boolean],
			default: undefined,
		},
		initialValue: {
			type: [String, Number, Object, Array, Boolean],
			default: undefined,
		},
		primaryKey: {
			type: [String, Number],
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationError: {
			type: Object as PropType<ValidationError>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const isDisabled = computed(() => {
			if (props.disabled) return true;
			if (props.field?.meta?.readonly === true) return true;
			if (props.batchMode && props.batchActive === false) return true;
			return false;
		});

		const defaultValue = computed(() => {
			const value = props.field.schema?.default_value;

			if (value !== undefined) return value;
			return null;
		});

		const _value = computed(() => {
			if (props.value !== undefined) return props.value;
			if (props.initialValue !== undefined) return props.initialValue;
			return defaultValue.value;
		});

		const { showRaw, rawValue } = useRaw();

		return { isDisabled, marked, _value, emitValue, showRaw, rawValue };

		function emitValue(value: any) {
			if (
				(isEqual(value, props.initialValue) ||
					(props.initialValue === undefined && isEqual(value, defaultValue.value))) &&
				props.batchMode === false
			) {
				emit('unset', props.field);
			} else {
				emit('input', value);
			}
		}

		function useRaw() {
			const showRaw = ref(false);

			const type = computed(() => {
				return getJSType(props.field.type);
			});

			const rawValue = computed({
				get() {
					switch (type.value) {
						case 'object':
							return JSON.stringify(_value.value, null, '\t');
						case 'string':
						case 'number':
						case 'boolean':
						default:
							return _value.value;
					}
				},
				set(newRawValue: string) {
					switch (type.value) {
						case 'string':
							emit('input', newRawValue);
							break;
						case 'number':
							emit('input', Number(newRawValue));
							break;
						case 'boolean':
							emit('input', newRawValue === 'true');
							break;
						case 'object':
							emit('input', JSON.parse(newRawValue));
							break;
						default:
							emit('input', newRawValue);
							break;
					}
				},
			});

			return { showRaw, rawValue };
		}
	},
});
</script>

<style lang="scss" scoped>
.field {
	position: relative;
}

.note {
	display: block;
	max-width: 520px;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}

.invalid {
	margin: -12px;
	padding: 12px;
	background-color: var(--danger-alt);
	border-radius: var(--border-radius);
	transition: var(--medium) var(--transition);
	transition-property: background-color, padding, margin;
}

.validation-error {
	display: block;
	margin-top: 4px;
	color: var(--danger);
	font-style: italic;
}

.raw-value {
	--v-textarea-font-family: var(--family-monospace);
}

.label-spacer {
	height: 28px;
}
</style>
