<template>
	<v-checkbox
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label"
		:modelValue="value"
		:indeterminate="value === null"
		:disabled="disabled"
		@update:modelValue="$attrs.onInput"
		:style="{
			'--v-checkbox-color': color,
		}"
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
			default: i18n.global.t('enabled'),
		},
		iconOn: {
			type: String,
			default: 'check_box',
		},
		iconOff: {
			type: String,
			default: 'check_box_outline_blank',
		},
		color: {
			type: String,
			default: '#00C897',
		},
	},
});
</script>
