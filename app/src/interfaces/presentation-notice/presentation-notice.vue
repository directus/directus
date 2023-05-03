<template>
	<div class="presentation-notice">
		<v-notice :icon="icon" :type="color">
			<div v-md="text" />
		</v-notice>
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		color?: string;
		icon?: string;
		text?: string;
	}>(),
	{
		color: 'normal',
		icon: 'info',
		text: 'No text configured...',
	}
);
</script>

<style lang="scss" scoped>
:deep(a) {
	color: var(--primary);

	&:hover {
		color: var(--primary-125);
	}
}
</style>
