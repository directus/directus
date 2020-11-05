<template>
	<component
		:is="url ? 'a' : 'div'"
		:href="url"
		target="_blank"
		ref="noopener noreferer"
		class="module-bar-logo"
		:class="{ loading: showLoader }"
		v-tooltip.right="urlTooltip"
	>
		<template v-if="customLogoPath">
			<transition name="fade">
				<v-progress-linear
					indeterminate
					rounded
					v-if="showLoader"
					@animationiteration="stopSpinnerIfQueueIsEmpty"
				/>
			</transition>
			<img class="custom-logo" :src="customLogoPath" alt="Project Logo" />
		</template>
		<div v-else class="logo" :class="{ running: showLoader }" @animationiteration="stopSpinnerIfQueueIsEmpty" />
	</component>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { useSettingsStore, useRequestsStore } from '@/stores/';
import { getRootPath } from '@/utils/get-root-path';
import i18n from '@/lang';
import { addTokenToURL } from '@/api';

export default defineComponent({
	setup() {
		const requestsStore = useRequestsStore();
		const settingsStore = useSettingsStore();

		const customLogoPath = computed<string | null>(() => {
			if (settingsStore.state.settings === null) return null;
			if (!settingsStore.state.settings?.project_logo) return null;
			return addTokenToURL(getRootPath() + `assets/${settingsStore.state.settings.project_logo}`);
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

		const urlTooltip = computed(() => {
			return settingsStore.state.settings?.project_url ? i18n.t('view_project') : false;
		});

		return {
			customLogoPath,
			showLoader,
			stopSpinnerIfQueueIsEmpty,
			url,
			urlTooltip,
		};

		function stopSpinnerIfQueueIsEmpty() {
			if (queueHasItems.value === false) showLoader.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.module-bar-logo {
	--v-progress-linear-height: 2px;
	--v-progress-linear-color: var(--white);
	--v-progress-linear-background-color: rgba(255, 255, 255, 0.5);

	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	padding: 12px;
	background-color: var(--brand);

	.v-progress-linear {
		position: absolute;
		right: 12px;
		bottom: 5px;
		left: 12px;
		width: 40px;
	}

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

.fade-enter-active {
	transition: opacity var(--slow) var(--transition);
}

.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}

@keyframes run {
	100% {
		background-position: 100%;
	}
}
</style>
