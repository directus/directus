<template>
	<v-list-item-icon>
		<v-icon :name="icon ?? 'label'" :color="color" />
	</v-list-item-icon>
	<v-list-item-content><v-text-overflow :text="name" :highlight="search" /></v-list-item-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		icon: {
			type: String,
			default: 'label',
		},
		color: {
			type: String,
			default: 'var(--foreground-normal)',
		},
		name: {
			type: String,
			required: true,
		},
		search: {
			type: String,
			default: null,
		},
	},
});
</script>
