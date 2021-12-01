<template>
	<v-checkbox
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label"
		:model-value="value"
		:indeterminate="value === null"
		:disabled="disabled"
		:style="{
			'--v-checkbox-color': colorOn,
			'--v-checkbox-unchecked-color': colorOff,
		}"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { i18n } from '@/lang';

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		label: {
			type: String,
			default: () => i18n.global.t('enabled'),
		},
		iconOn: {
			type: String,
			default: 'check_box',
		},
		iconOff: {
			type: String,
			default: 'check_box_outline_blank',
		},
		colorOn: {
			type: String,
			default: '#00C897',
		},
		colorOff: {
			type: String,
			default: '#B0BEC5',
		},
	},
	emits: ['input'],
});
</script>
