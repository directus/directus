<template>
	<v-checkbox
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label"
		:input-value="value"
		@change="$listeners.input"
		:style="{
			'--v-checkbox-color': color,
		}"
	/>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Boolean,
			default: null,
		},
		label: {
			type: String,
			default: null,
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
			default: 'var(--primary)',
		},
	},
});
</script>
