<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	color?: string;
	icon?: string;
	title?: string;
	inlineTitle?: boolean;
}>();
</script>

<template>
	<VDivider
		class="presentation-divider"
		:class="{ 'add-margin-block-start': icon || title }"
		:style="{
			'--v-divider-label-color': color,
			'--v-divider-color': 'var(--theme--border-color-subdued)',
		}"
		large
		:inline-title="inlineTitle"
	>
		<template v-if="icon" #icon><VIcon :name="icon" /></template>
		<template v-if="title" #default>{{ title }}</template>
	</VDivider>
</template>

<style lang="scss" scoped>
.add-margin-block-start {
	margin-block-start: 40px;
}
</style>
