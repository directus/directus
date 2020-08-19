<template>
	<v-field-template />
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			default: null,
			required: true,
		},
	},
});
</script>
