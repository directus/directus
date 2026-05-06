<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	icon: string;
	title: string;
	variant?: 'default' | 'danger';
}>();
</script>

<template>
	<div class="section">
		<div class="section-header">
			<span class="section-title">
				<VIcon :name="icon" :class="props.variant" small />
				{{ title }}
			</span>
			<VDivider />
		</div>
		<slot />
	</div>
</template>

<style scoped>
.section {
	margin-block-start: 2.5rem;
}

.section-header {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-block-end: 1.5rem;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.375rem;
	font-weight: var(--theme--fonts--display--font-weight);
	font-family: var(--theme--fonts--display--font-family);
	color: var(--theme--foreground-accent);
	line-height: 1;
}

.danger {
	--v-icon-color: var(--theme--danger);
}
</style>
