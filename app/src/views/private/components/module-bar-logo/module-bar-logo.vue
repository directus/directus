<template>
	<component :is="url ? 'a' : 'div'" :href="url" target="_blank" ref="noopener noreferer" class="module-bar-logo">
		<template v-if="customLogoPath">
			<v-progress-circular indeterminate v-if="showLoader" @animationiteration="stopRunningIfQueueIsEmpty" />
			<img v-else class="custom-logo" :src="customLogoPath" alt="Project Logo" />
		</template>
		<div v-else class="logo" :class="{ running: showLoader }" @animationiteration="stopRunningIfQueueIsEmpty" />
	</component>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { useSettingsStore, useRequestsStore } from '@/stores/';
import getRootPath from '../../../../utils/get-root-path';

export default defineComponent({
	setup() {
		const requestsStore = useRequestsStore();
		const settingsStore = useSettingsStore();

		const customLogoPath = computed<string | null>(() => {
			if (settingsStore.state.settings === null) return null;
			if (!settingsStore.state.settings?.project_logo) return null;
			return getRootPath() + `assets/${settingsStore.state.settings.project_logo}`;
		});

		const showLoader = ref(false);

		const queueHasItems = requestsStore.queueHasItems;

		watch(
			() => queueHasItems.value,
			(hasItems) => {
				if (hasItems) showLoader.value = true;
			}
		);

		const url = computed(() => settingsStore.state.settings?.project_url);

		return {
			customLogoPath,
			showLoader,
			stopRunningIfQueueIsEmpty,
			url,
		};

		function stopRunningIfQueueIsEmpty() {
			if (queueHasItems.value === false) showLoader.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.module-bar-logo {
	--v-progress-circular-color: var(--white);
	--v-progress-circular-background-color: rgba(255, 255, 255, 0.25);

	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
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
		background-image: url('./sprite.svg');
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
