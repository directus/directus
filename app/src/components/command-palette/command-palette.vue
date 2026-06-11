<script setup lang="ts">
import { useShortcut } from '@directus/composables';
import { useEventListener } from '@vueuse/core';
import { ListboxRoot } from 'reka-ui';
import { nextTick, onMounted, ref, watch } from 'vue';
import { CommandRouterView } from './command-router-view';
import { registerBuiltInCommands } from './commands';
import { provideCommandPalette } from './composables/use-command-palette';
import { createCommandRouter, provideCommandRouter } from './composables/use-command-router';
import RootCommands from './root-commands.vue';

let commandsRegistered = false;

const active = ref(false);
const search = ref('');
const commandPalette = ref<{ $el: HTMLElement; highlightFirstItem: () => void } | null>(null);

const commandRouter = createCommandRouter({
	root: RootCommands,
});

provideCommandRouter(commandRouter);

const context = provideCommandPalette({
	search,
	loading: ref(false),
	router: commandRouter,
	close,
	clearSearch: clear,
});

onMounted(() => {
	if (!commandsRegistered) {
		registerBuiltInCommands();
		commandsRegistered = true;
	}
});

useEventListener(document, 'keydown', (event) => {
	const target = event.target as HTMLElement | null;

	if (target?.closest('input, textarea, [contenteditable="true"], .cm-editor')) return;
	if ((event.metaKey === false && event.ctrlKey === false) || event.key.toLowerCase() !== 'k') return;

	event.preventDefault();
	active.value = !active.value;
});

useEventListener(window, 'open-command-palette', () => {
	active.value = true;
});

useEventListener(
	() => commandPalette.value?.$el,
	'keydown',
	(e: KeyboardEvent) => {
		if (e.defaultPrevented) return;

		if (e.key === 'Backspace' && search.value === '' && commandRouter.pop()) {
			e.preventDefault();
		}
	},
);

// Block native pointerleave so reka-ui doesn't clear highlightedElement on open.
useEventListener(
	() => commandPalette.value?.$el,
	'pointerleave',
	(event) => {
		event.stopImmediatePropagation();
	},
	{ capture: true },
);

useShortcut('escape', (_event, cancelNext) => {
	if (active.value) {
		active.value = false;
		cancelNext();
	}
});

function highlightFirst() {
	nextTick(() => commandPalette.value?.highlightFirstItem());
}

watch(active, (isActive) => {
	if (isActive) {
		highlightFirst();
	} else {
		close();
	}
});

// Re-highlight when search input changes (filtering commands)
watch(search, highlightFirst);

// Re-highlight when navigating into/out of drilldown views + pop animation
watch(commandRouter.currentCommand, () => {
	highlightFirst();

	const el = commandPalette.value?.$el as HTMLElement | undefined;
	if (!el) return;

	el.classList.add('pop');

	setTimeout(() => {
		el.classList.remove('pop');
	}, 200);
});

// Re-highlight when async content finishes loading (e.g. collection search results).
watch(context.loading, (isLoading) => {
	if (!isLoading) {
		highlightFirst();
	}
});

function close() {
	active.value = false;
	clear();
	commandRouter.clear();
}

function clear() {
	context.search.value = '';
}
</script>

<template>
	<Teleport to="#dialog-outlet">
		<div v-if="active" class="command-palette-overlay">
			<div class="overlay-backdrop" @click="close" />
			<ListboxRoot ref="commandPalette" class="command-palette" model-value="" highlight-on-hover>
				<CommandRouterView />
			</ListboxRoot>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
.command-palette-overlay {
	position: fixed;
	inset: 0;
	z-index: 550;
}

.overlay-backdrop {
	position: absolute;
	inset: 0;
	background-color: var(--theme--foreground-subdued);
	opacity: 0.2;
}

.command-palette {
	position: relative;
	margin: 10vh auto auto;
	max-inline-size: 560px;
	background-color: var(--theme--background);
	border-radius: 8px;
	box-shadow: var(--theme--shadow);
	padding: var(--theme--spacing);
}

@keyframes pop {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(0.99);
	}

	100% {
		transform: scale(1);
	}
}

.pop {
	animation: pop 200ms ease;
}
</style>
