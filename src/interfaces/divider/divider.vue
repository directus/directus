<template>
	<v-divider
		:inline-title="false"
		:style="{
			'--v-divider-color': color,
			'--v-divider-label-color': color,
		}"
	>
		<template v-if="icon" #icon><v-icon :name="icon" /></template>
		{{ title }}
	</v-divider>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: null,
		},
		icon: {
			type: String,
			default: null,
		},
		title: {
			type: String,
			default: null,
		},
	},
});
</script>
