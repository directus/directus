<template>
	<div>Filter Setup</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'system-filter-setup',
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup() {},
});
</script>
