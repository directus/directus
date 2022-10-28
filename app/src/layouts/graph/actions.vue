<template>
	<div>
        <v-icon v-if="props.running" name="pause" @click="modelRunning = false" />
        <v-icon v-else name="play_arrow" @click="modelRunning = true" />
    </div>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';

interface Props {
    running: boolean;
}

const props = defineProps<Props>()

const emit = defineEmits(['update:running']);

const modelRunning = useSync(props, 'running', emit);
</script>

<style lang="scss" scoped>
.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;

	@media (min-width: 600px) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
