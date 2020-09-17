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
				@input="$emit('input', $event)"
				@unset="$emit('unset', $event)"
				@edit-raw="editRaw"
			/>
		</v-menu>

		<form-field-interface
			:value="_value"
			:field="field"
			:loading="loading"
			:batch-mode="batchMode"
			:batch-active="batchActive"
			:disabled="isDisabled"
			:primary-key="primaryKey"
			@input="$emit('input', $event)"
		/>

		<v-modal v-model="showRawModal" :title="$t('edit_raw_value')" :subtitle="$t(field.type)">
			<v-textarea v-model="rawString" :placeholder="$t('enter_raw_value')" />
			<template #footer>
				<v-button secondary @click="undoRaw">
					{{ $t('cancel') }}
				</v-button>
				<div class="spacer" />
				<v-button @click="saveRaw">
					{{ $t('save') }}
				</v-button>
			</template>
		</v-modal>

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

		const _value = computed(() => {
			if (props.value !== undefined) return props.value;
			if (props.initialValue !== undefined) return props.initialValue;
			return props.field.schema?.default_value;
		});

		const { showRawModal, rawString, editRaw, saveRaw, undoRaw, type } = useRaw();

		return { isDisabled, marked, _value, editRaw, saveRaw, undoRaw, showRawModal, rawString, type };

		function useRaw() {
			const showRawModal = ref(false);
			const rawString = ref('');

			const type = computed(() => {
				return getJSType(props.field.type);
			});

			const raw = computed({
				get() {
					const value = props.value || props.initialValue;

					if (type.value == 'string') return value;
					else if (['object', 'array'].includes(type.value)) return JSON.stringify(value, null, 4);
					else return String(value);
				},
				set(rawValue: string) {
					switch (type.value) {
						case 'string':
							emit('input', rawValue);
							break;
						case 'number':
							emit('input', Number(rawValue));
							break;
						case 'boolean':
							emit('input', rawValue == 'true');
							break;
						case 'object':
							if (Array.isArray(props.value)) {
								emit('input', Object.values(JSON.parse(rawValue)));
							} else {
								emit('input', JSON.parse(rawValue));
							}
							break;
						default:
							break;
					}
				},
			});

			function editRaw() {
				showRawModal.value = true;
				rawString.value = raw.value;
			}

			function undoRaw() {
				showRawModal.value = false;
				rawString.value = raw.value;
			}

			function saveRaw(rawValue: any) {
				showRawModal.value = false;
				raw.value = rawString.value;
			}

			return { showRawModal, rawString, editRaw, saveRaw, undoRaw, type };
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

.v-modal .v-textarea {
	--v-textarea-font-family: var(--family-monospace);

	height: 100%;
	max-height: unset;
}
</style>
