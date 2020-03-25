<template>
	<div id="app">
		<transition name="fade">
			<div class="hydrating" v-if="hydrating">
				<v-progress-circular indeterminate />
			</div>
		</transition>
		<router-view v-if="!hydrating" />
		<portal-target name="dialog-outlet" />
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@vue/composition-api';
import { useAppStore } from '@/stores/app';

export default defineComponent({
	setup() {
		const appStore = useAppStore();
		const { hydrating } = toRefs(appStore.state);

		return { hydrating };
	},
});
</script>

<style lang="scss" scoped>
#app {
	height: 100%;
}

.hydrating {
	position: fixed;
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: rgba(255, 255, 255, 0.5);
	backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
