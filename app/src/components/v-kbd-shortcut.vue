<script setup lang="ts">
import VKbd, { type Props as VKbdProps } from '@/components/v-kbd.vue';

interface Props extends Omit<VKbdProps, 'value'> {
	/** Ordered list of key names forming the shortcut (e.g. ['meta', 's']) */
	value: string[];
}

defineProps<Props>();
</script>

<template>
	<span class="v-kbd-shortcut">
		<VKbd v-for="key in value" :key="key" :value="key" :size="size" :variant="variant" />
	</span>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-kbd-shortcut-gap  [0.125rem]

*/

.v-kbd-shortcut {
	display: inline-flex;
	align-items: center;
	gap: var(--v-kbd-shortcut-gap, 0.125rem);
}
</style>
