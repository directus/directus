<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VProgressLinear from '@/components/v-progress-linear.vue';
import { useRequestsStore } from '@/stores/requests';
import { useSettingsStore } from '@/stores/settings';
import { getAssetUrl } from '@/utils/get-asset-url';

const { t } = useI18n();

const requestsStore = useRequestsStore();
const settingsStore = useSettingsStore();

const customLogoPath = computed<string | null>(() => {
	if (settingsStore.settings === null) return null;
	if (!settingsStore.settings?.project_logo) return null;
	return getAssetUrl(settingsStore.settings.project_logo);
});

const showLoader = ref(false);

const { queueHasItems } = toRefs(requestsStore);

watch(
	() => queueHasItems.value,
	(hasItems) => {
		if (hasItems) showLoader.value = true;
	},
);

const url = computed(() => settingsStore.settings?.project_url);

const urlTooltip = computed(() => {
	return settingsStore.settings?.project_url ? t('view_project') : false;
});

function stopSpinnerIfQueueIsEmpty() {
	if (queueHasItems.value === false) showLoader.value = false;
}
</script>

<template>
	<component
		:is="url ? 'a' : 'div'"
		v-tooltip.right="urlTooltip"
		:href="url"
		:target="url ? '_blank' : undefined"
		:rel="url ? 'noopener noreferrer' : undefined"
		class="module-bar-logo"
		:class="{ loading: showLoader }"
	>
		<template v-if="customLogoPath">
			<Transition name="fade">
				<VProgressLinear v-if="showLoader" indeterminate rounded @animationiteration="stopSpinnerIfQueueIsEmpty" />
			</Transition>
			<img class="custom-logo" :src="customLogoPath" alt="Project Logo" />
		</template>
		<div v-else class="logo" :class="{ running: showLoader }" @animationiteration="stopSpinnerIfQueueIsEmpty" />
	</component>
</template>

<style lang="scss" scoped>
.module-bar-logo {
	--v-progress-linear-height: 2px;
	--v-progress-linear-color: var(--white);
	--v-progress-linear-background-color: rgb(255 255 255 / 0.5);

	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	inline-size: 60px;
	block-size: 60px;
	padding: 12px;
	background-color: var(--project-color);

	.v-progress-linear {
		position: absolute;
		inset-inline: 10px;
		inset-block-end: 5px;
		inline-size: 40px;
	}

	.custom-logo {
		display: block;
		inline-size: 40px;
		block-size: 40px;
		object-fit: contain;
	}

	.logo {
		position: absolute;
		inset-block-start: 18px;
		inset-inline-start: 10px;
		inline-size: 40px;
		block-size: 32px;
		margin: 0 auto;
		background-image: url('../../../assets/sprite.svg');
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

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

@keyframes run {
	100% {
		background-position: 100%;
	}
}
</style>
