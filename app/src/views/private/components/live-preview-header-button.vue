<script setup lang="ts">
import VButton, { type VButtonEmits, type VButtonProps } from '@/components/v-button.vue';

withDefaults(defineProps<Pick<VButtonProps, 'to' | 'href' | 'target' | 'disabled' | 'active'>>(), {
	/** Must be explicitly undefined */
	active: undefined,
});

defineEmits<VButtonEmits>();
</script>

<template>
	<VButton v-bind="$props" icon x-small @click="$emit('click', $event)">
		<slot />
	</VButton>
</template>

<style lang="scss" scoped>
.v-button {
	--v-button-color: var(--theme--navigation--modules--button--foreground);
	--v-button-color-hover: var(--theme--navigation--modules--button--foreground-hover);
	--v-button-color-active: var(--theme--navigation--modules--button--foreground-active);
	--v-button-background-color: var(--theme--navigation--modules--button--background);
	--v-button-background-color-hover: var(--theme--navigation--modules--button--background-hover);
	--v-button-background-color-active: var(--theme--navigation--modules--button--background-active);
}
</style>
