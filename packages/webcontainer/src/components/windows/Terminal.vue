<template>
	<div ref="terminalEl" class="terminal"></div>
</template>

<script setup lang="ts">
import { WebContainer } from '@webcontainer/api';
import { onMounted, ref } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const props = defineProps<{
	webcontainer: WebContainer | null;
}>();

const terminalEl = ref<HTMLElement | null>(null);
let terminal: Terminal | null = null;

onMounted(async () => {
	if (!terminalEl.value) return;

	console.log('mounted', props.webcontainer);

	const fitAddon = new FitAddon();

	terminal = new Terminal({
		convertEol: true,
	});

	terminal.loadAddon(fitAddon);

	terminal.open(terminalEl.value);

	fitAddon.fit();

	console.log('terminal');

	const shellProcess = await startShell(terminal);

	new ResizeObserver(() => {
		fitAddon.fit();

		shellProcess?.resize({
			cols: terminal!.cols,
			rows: terminal!.rows,
		});
	}).observe(terminalEl.value);
});

async function startShell(terminal: Terminal) {
	if (props.webcontainer === null) return;

	console.log('starting shell');

	const shellProcess = await props.webcontainer.spawn('jsh', {
		terminal: {
			cols: terminal.cols,
			rows: terminal.rows,
		},
	});

	shellProcess.output.pipeTo(
		new WritableStream({
			write(data) {
				terminal.write(data);
			},
		})
	);

	const input = shellProcess.input.getWriter();

	terminal.onData((data) => {
		input.write(data);
	});

	return shellProcess;
}
</script>

<style scoped lang="scss">
.terminal {
	width: 100%;
	height: 100%;

	background-color: black;
}
</style>
