<template>
	<v-divider
		:inline-title="false"
		:class="{ margin: icon || title }"
		:style="{
			'--v-divider-color': color,
			'--v-divider-label-color': color,
		}"
		large
	>
		<template v-if="icon" #icon><v-icon :name="icon" /></template>
		<template v-if="title" #default>{{ title }}</template>
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

<style lang="scss" scoped>
.margin {
	margin-top: 48px;
}
</style>
