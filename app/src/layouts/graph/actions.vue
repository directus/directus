<template>
	<v-button icon rounded secondary @click="modelRunning = !modelRunning">
		<v-icon v-if="props.running" name="pause" />
		<v-icon v-else name="play_arrow" />
	</v-button>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';

interface Props {
	running: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:running']);

const modelRunning = useSync(props, 'running', emit);
</script>

<style lang="scss" scoped>
.v-button {
	margin-right: 8px;
}
</style>
