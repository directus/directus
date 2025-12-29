<script lang="ts" setup>
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	icon?: string;
	iconColor?: string;
	showBack?: boolean;
	backTo?: string;
}>();
</script>

<template>
	<VButton
		v-if="showBack"
		class="back-button"
		rounded
		icon
		secondary
		exact
		small
		:to="backTo"
		@click="!backTo ? $router.back() : undefined"
	>
		<VIcon name="arrow_back" small />
	</VButton>

	<div v-else-if="icon" class="icon">
		<VIcon :name="icon" :color="iconColor" small />
	</div>
</template>

<style scoped>
.back-button,
.icon {
	flex-shrink: 0;
}

.back-button {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-active: var(--theme--foreground);
}

.icon {
	inline-size: 36px;
	block-size: 36px;
	border-radius: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--theme--background-normal);
}
</style>
