<template>
	<div id="app" :style="brandStyle">
		<transition name="fade">
			<div class="hydrating" v-if="hydrating">
				<v-progress-circular indeterminate />
			</div>
		</transition>
		<router-view v-if="!hydrating" />

		<portal-target name="outlet" multiple />
	</div>
</template>

<script lang="ts">
import { defineComponent, toRefs, watch, computed } from '@vue/composition-api';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';
import { useProjectsStore } from '@/stores/projects';

export default defineComponent({
	setup() {
		const appStore = useAppStore();
		const userStore = useUserStore();
		const projectsStore = useProjectsStore();

		const { hydrating } = toRefs(appStore.state);

		const brandStyle = computed(() => {
			return {
				'--brand': projectsStore.currentProject.value?.color || 'var(--primary)',
			};
		});

		watch(
			() => userStore.state.currentUser,
			(newUser) => {
				document.body.classList.remove('dark');
				document.body.classList.remove('light');
				document.body.classList.remove('auto');

				if (newUser !== undefined && newUser !== null) {
					document.body.classList.add(newUser.theme);
				} else {
					// Default to light mode
					document.body.classList.add('light');
				}
			}
		);

		return { hydrating, brandStyle };
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
