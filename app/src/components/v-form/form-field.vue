<template>
	<div class="field" :key="field.field" :class="field.meta.width">
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

		<small class="note" v-if="field.meta.note" v-html="marked(field.meta.note)" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Field } from '@/types/';
import marked from 'marked';
import FormFieldLabel from './form-field-label.vue';
import FormFieldMenu from './form-field-menu.vue';
import FormFieldInterface from './form-field-interface.vue';

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
	},
	setup(props) {
		const isDisabled = computed(() => {
			if (props.disabled) return true;
			if (props.field.meta.readonly) return true;
			if (props.batchMode && props.batchActive === false) return true;
			return false;
		});

		const _value = computed(() => {
			if (props.value !== undefined) return props.value;
			if (props.initialValue !== undefined) return props.initialValue;
			return props.field.schema?.default_value;
		});

		return { isDisabled, marked, _value };
	},
});
</script>

<style lang="scss" scoped>
.note {
	display: block;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
