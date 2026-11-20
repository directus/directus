<script setup lang="ts">
import VNotice from '@/components/v-notice.vue';

withDefaults(
	defineProps<{
		color?: string;
		icon?: string;
		text?: string;
	}>(),
	{
		color: 'normal',
		icon: 'info',
	},
);
</script>

<template>
	<div class="presentation-notice">
		<VNotice :icon="icon" :type="color">
			<div v-md="text ?? $t('interfaces.presentation-notice.no_text')" />
		</VNotice>
	</div>
</template>

<style lang="scss" scoped>
:deep(a) {
	color: var(--theme--primary);

	&:hover {
		color: var(--theme--primary-accent);
	}
}

:deep(code) {
	padding: 0.125rem 0.25rem;
	font-family: var(--theme--fonts--monospace--font-family), monospace;
	font-size: 0.875em;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	white-space: nowrap;
}
</style>
