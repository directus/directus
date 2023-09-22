<template>
	<div ref="terminal" class="terminal"></div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Terminal } from 'xterm';

const props = defineProps<{
	terminal: Terminal | null;
}>();

const terminal = ref<HTMLElement | null>(null);

watch(
	() => props.terminal,
	() => {
		if (!terminal.value || !props.terminal) return;

		props.terminal.open(terminal.value);
	}
);
</script>

<style scoped lang="scss">
.terminal {
	width: 100%;
	height: 100%;
}
</style>
