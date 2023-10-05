<script setup lang="ts">
defineProps<{
	color?: string;
	icon?: string;
	title?: string;
	inlineTitle?: boolean;
}>();
</script>

<template>
	<v-divider
		:class="{ 'add-margin-top': icon || title }"
		:style="{
			'--v-divider-label-color': color,
			'--v-divider-color': 'var(--border-subdued)',
		}"
		large
		:inline-title="inlineTitle"
	>
		<template v-if="icon" #icon><v-icon :name="icon" /></template>
		<template v-if="title" #default>{{ title }}</template>
	</v-divider>
</template>

<style lang="scss" scoped>
.add-margin-top {
	margin-top: 40px;
}
</style>
