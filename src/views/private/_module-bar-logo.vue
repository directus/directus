<template>
	<div class="module-bar-logo">
		<img class="custom-logo" v-if="customLogoPath" :src="customLogoPath" />
		<div
			v-else
			class="logo"
			:class="{ running: isRunning }"
			@animationiteration="stopRunningIfQueueIsEmpty"
		/>
	</div>
</template>

<script lang="ts">
import { createComponent, ref, computed, watch } from '@vue/composition-api';
import { useProjectsStore } from '@/stores/projects';
import { ProjectWithKey, ProjectError } from '@/stores/projects/types';
import { useRequestsStore } from '@/stores/requests';

export default createComponent({
	setup() {
		const projectsStore = useProjectsStore();
		const requestsStore = useRequestsStore();

		const customLogoPath = computed<string | null>(() => {
			if (projectsStore.currentProject.value === null) return null;
			if ((projectsStore.currentProject.value as ProjectError).error !== undefined) {
				return null;
			}
			const currentProject = projectsStore.currentProject.value as ProjectWithKey;
			return currentProject.api.project_logo?.full_url || null;
		});

		const isRunning = ref(false);

		const queueHasItems = requestsStore.queueHasItems;

		watch(
			() => queueHasItems.value,
			hasItems => {
				if (hasItems) isRunning.value = true;
			}
		);

		return { customLogoPath, isRunning, stopRunningIfQueueIsEmpty };

		function stopRunningIfQueueIsEmpty() {
			if (queueHasItems.value === false) isRunning.value = false;
		}
	}
});
</script>

<style lang="scss" scoped>
.module-bar-logo {
	position: relative;
	width: 64px;
	height: 64px;
	padding: 12px;
	background-color: var(--brand);

	.custom-logo {
		display: block;
		width: 40px;
		height: 40px;
		object-fit: contain;
	}

	.logo {
		position: absolute;
		top: 20px;
		left: 12px;
		width: 40px;
		height: 32px;
		margin: 0 auto;
		background-image: url('../../assets/sprite.svg');
		background-position: 0% 0%;
		background-size: 600px 32px;
	}

	.running {
		animation: 560ms run steps(14) infinite;
	}
}

@keyframes run {
	100% {
		background-position: 100%;
	}
}
</style>
