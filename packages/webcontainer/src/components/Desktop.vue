<template>
	<div id="desktop">
		<div class="main-view">
			<template v-for="window in windows" :key="window.id">
				<Transition name="window">
					<Window v-show="window.open" :window="window" @minimize="toggle" @focus="focus" @close="remove">
						<component :is="window.component" :webcontainer="webcontainerInstance" v-bind="window.options" />
					</Window>
				</Transition>
			</template>
		</div>
		<Taskbar :windows="windows" @select="selectTaskbar" @add="add" />
	</div>
</template>

<script setup lang="ts">
import Taskbar from './Taskbar.vue';
import { ref, watch } from 'vue';
import Window from './Window.vue';
import { useOS } from '../composables/useOS';
import { useWindows } from '../composables/useWindows';

export interface Window {
	id: number;
	name: string;
	icon: string;
	open: boolean;
	focus: number;
	component: string;
}

const browserURL = ref<string>('loading.html');

const { webcontainerInstance } = useOS(browserURL);
const { add, remove, focus, toggle, windows } = useWindows();

watch(webcontainerInstance, (webcontainer) => {
	if (!webcontainer) return;

	webcontainer.on('server-ready', (port, newURL) => {
		console.log('server-ready', port, newURL);

		add('Browser', {
			initialUrl: newURL,
		});
	});
});

function selectTaskbar(window: string) {
	const existing = windows.value.find((w) => w.name === window);

	if (existing) {
		toggle(existing.id);
		return;
	}

	add(window);
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

		.window {
			transition: opacity var(--fast) var(--transition), top var(--fast) var(--transition);

			&-enter-active,
			&-leave-active {
				opacity: 1;
				top: 0px;
			}

			&-enter-from,
			&-leave-to {
				opacity: 0;
				top: 20px;
			}
		}
	}
}
</style>
