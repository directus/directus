<template>
	<div id="desktop">
		<div class="main-view">
			<Window v-show="openWindows.includes('Terminal')" v-model:window="windows[0]" @focus="focus">
				<Terminal :terminal="terminal" />
			</Window>
			<Window v-show="openWindows.includes('Browser')" v-model:window="windows[1]" @focus="focus">
				<Browser :url="browserURL" />
			</Window>
			<Window v-show="openWindows.includes('Explorer')" v-model:window="windows[2]" @focus="focus">
				<Explorer :webcontainer="webcontainerInstance" />
			</Window>
			<Window v-show="openWindows.includes('Website')" v-model:window="windows[3]" @focus="focus">
				<Website :url="browserURL" />
			</Window>
		</div>
		<Taskbar v-model:windows="windows" @focus="focus" />
	</div>
</template>

<script setup lang="ts">
import Taskbar, { Task } from './Taskbar.vue';
import { computed, ref } from 'vue';
import Window from './Window.vue';
import Terminal from './Terminal.vue';
import Browser from './Browser.vue';
import { useOS } from '../composables/useOS';
import Explorer from './Explorer.vue';
import Website from './Website.vue';

export interface Window {
	name: string;
	icon: string;
	active: boolean;
	focus: number;
}

const browserURL = ref<string>('loading.html');

const windows = ref<Window[]>([
	{
		name: 'Terminal',
		icon: 'terminal',
		active: true,
		focus: 1,
	},
	{
		name: 'Browser',
		icon: 'browser',
		active: true,
		focus: 2,
	},
	{
		name: 'Explorer',
		icon: 'explorer',
		active: false,
		focus: 3,
	},
	{
		name: 'Website',
		icon: 'website',
		active: false,
		focus: 4,
	},
]);

const openWindows = computed(() =>
	windows.value.reduce((acc, window) => {
		if (window.active) acc.push(window.name);
		return acc;
	}, [] as string[])
);

const { terminal, webcontainerInstance } = useOS(browserURL);

function focus(window: string) {
	windows.value = windows.value.map((w) => {
		w.focus += 1;

		if (w.name === window) {
			w.active = true;
			w.focus = 1;
		}

		return w;
	});
}
</script>

<style scoped lang="scss">
#desktop {
	width: 100%;
	height: 100vh;
	background: var(--background-subdued);

	display: grid;
	grid-template-rows: 1fr 40px;

	.main-view {
		width: 100%;
		height: 100%;
		background-image: url('../assets/images/desktop-background2.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;

		position: relative;
	}
}
</style>
