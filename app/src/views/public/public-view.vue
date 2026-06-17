<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, defineAsyncComponent } from 'vue';
import VImage from '@/components/v-image.vue';
import VLicenseBadge from '@/components/v-license-badge.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useServerStore } from '@/stores/server';
import { getAssetUrl } from '@/utils/get-asset-url';

// Lazy-loaded so three.js/TresJS split into their own chunk instead of the eager router bundle.
const ShaderBackground = defineAsyncComponent(() => import('./components/shader-background.vue'));

interface Props {
	wide?: boolean;
}

withDefaults(defineProps<Props>(), {
	wide: false,
});

const serverStore = useServerStore();

const { info } = storeToRefs(serverStore);

const hasCustomBackground = computed(() => {
	return !!info.value?.project?.public_background;
});

const customBackgroundIsVideo = computed(() => info.value?.project?.public_background?.type?.startsWith('video/'));
const customBackgroundUrl = computed(() => getAssetUrl(info.value?.project?.public_background?.id ?? ''));

const artStyles = computed(() => {
	if (!hasCustomBackground.value) return {};

	return {
		background: `url(${customBackgroundUrl.value})`,
		backgroundSize: 'cover',
		backgroundPosition: 'center center',
	};
});

const foregroundURL = computed(() => {
	if (!info.value?.project?.public_foreground) return null;
	return getAssetUrl(info.value.project?.public_foreground);
});

const logoURL = computed<string | null>(() => {
	if (!info.value?.project?.project_logo) return null;
	return getAssetUrl(info.value.project?.project_logo);
});
</script>

<template>
	<div class="public-view">
		<div class="container" :class="{ wide }">
			<div class="title-box">
				<div
					v-if="info?.project?.project_logo"
					class="logo"
					:style="info?.project.project_color ? { backgroundColor: info.project.project_color } : {}"
				>
					<VImage :src="logoURL!" :alt="info?.project.project_name || 'Logo'" />
				</div>
				<div
					v-else
					class="logo"
					:style="info?.project?.project_color ? { backgroundColor: info.project.project_color } : {}"
				>
					<img src="./logo-light.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<h1 class="title-heading"><VTextOverflow :text="info?.project?.project_name ?? ''" placement="bottom" /></h1>
					<VTextOverflow
						class="subtitle"
						:text="info?.project?.project_descriptor ?? $t('application')"
						placement="bottom"
					/>
				</div>
			</div>

			<div class="content">
				<slot />
			</div>
			<div class="notice">
				<slot name="notice" />
			</div>
		</div>
		<div class="art" :style="artStyles">
			<ShaderBackground v-if="!hasCustomBackground" :project-color="info?.project?.project_color" />

			<video v-else-if="customBackgroundIsVideo" :src="customBackgroundUrl" autoplay muted loop />

			<Transition name="scale">
				<VImage v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="info?.project?.project_name" />
			</Transition>
			<div class="note-container">
				<div v-if="info?.project?.public_note" v-md="info?.project.public_note" class="note" />
			</div>
		</div>

		<VLicenseBadge />
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.public-view {
	--public-view--container--padding-x: 1.125rem;
	--public-view--container--padding-y: 1.125rem;

	@media (width >= 28.125rem) {
		--public-view--container--padding-x: 4.5rem;
		--public-view--container--padding-y: 2.25rem;
	}

	display: flex;
	inline-size: 100%;
	block-size: 100%;

	:slotted(.v-icon) {
		--v-icon-color: var(--theme--foreground-subdued);

		margin-inline-start: 0.25rem;
	}

	.container {
		--theme--form--column-gap: var(--theme--public--form--column-gap);
		--theme--form--row-gap: var(--theme--public--form--row-gap);
		--theme--form--field--input--background-subdued: var(--theme--public--form--field--input--background);
		--theme--form--field--input--background: var(--theme--public--form--field--input--background);
		--theme--form--field--input--border-color-hover: var(--theme--public--form--field--input--border-color-hover);
		--theme--form--field--input--border-color: var(--theme--public--form--field--input--border-color);
		--theme--form--field--input--box-shadow: var(--theme--public--form--field--input--box-shadow);
		--theme--form--field--input--focus-ring-color: var(--theme--public--form--field--input--focus-ring-color);
		--theme--form--field--input--foreground-subdued: var(--theme--public--form--field--input--foreground-subdued);
		--theme--form--field--input--foreground: var(--theme--public--form--field--input--foreground);
		--theme--form--field--input--height: var(--theme--public--form--field--input--height);
		--theme--form--field--input--padding: var(--theme--public--form--field--input--padding);
		--theme--form--field--label--font-family: var(--theme--public--form--field--label--font-family);
		--theme--form--field--label--foreground: var(--theme--public--form--field--label--foreground);
		--public-view--container--max-width: 28.125rem;
		--public-view--container--content--width: 19.125rem;

		z-index: 2;
		display: flex;
		flex-shrink: 0;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		inline-size: 100%;
		max-inline-size: var(--public-view--container--max-width);
		block-size: 100%;
		padding: var(--public-view--container--padding-y) var(--public-view--container--padding-x);
		overflow: hidden auto;
		background: var(--theme--public--background);
		color: var(--theme--public--foreground);

		/* Page Content Spacing */
		font-size: 0.875rem;
		line-height: 1.5714;
		box-shadow: 0 0 40px 0 rgb(38 50 56 / 0.1);
		transition: max-inline-size var(--medium) var(--transition);

		:slotted(.type-display.type-display-public) {
			font-size: 2.375rem;
			line-height: 1.2368;
			color: var(--theme--public--foreground-accent);
		}

		.content {
			inline-size: 100%;
			max-inline-size: var(--public-view--container--content--width);
		}

		&.wide {
			--public-view--container--max-width: 49.0625rem;
			--public-view--container--content--width: 40.0625rem;
		}
	}

	.art {
		position: relative;
		z-index: 1;
		display: none;
		flex-grow: 1;
		align-items: center;
		justify-content: center;
		block-size: 100%;
		background-position: center center;
		background-size: cover;
		container-type: inline-size;

		video {
			inline-size: 100%;
			block-size: 100%;
			object-fit: cover;
			position: absolute;
			z-index: -1;
			inset-block-start: 0;
			inset-inline-start: 0;
		}

		.foreground {
			inline-size: 80%;
			max-inline-size: 22.5rem;
		}

		.note-container {
			position: absolute;
			inset-inline: 0;
			inset-block-end: 1.9375rem;
			display: none;
			align-items: flex-end;
			justify-content: center;
			block-size: 0.5625rem;

			@container (inline-size >= 20.5rem) {
				display: flex;
			}

			.note {
				max-inline-size: 19.125rem;
				margin: 0 auto;
				padding: 0.4375rem 0.6875rem;
				color: var(--white);
				font-size: 0.875rem;
				line-height: 1.5714;
				background-color: rgb(38 50 56 / 0.2);
				border-radius: 0.3125rem;
				backdrop-filter: blur(0.125rem);
				overflow-wrap: break-word;
			}
		}

		@media (width >= 28.125rem) {
			display: flex;
		}
	}

	.notice {
		display: flex;
		inline-size: 100%;
		max-inline-size: var(--public-view--container--content--width);
		color: var(--theme--foreground-subdued);
	}

	.title-box {
		display: flex;
		align-items: center;
		inline-size: 100%;
		max-inline-size: var(--public-view--container--content--width);

		.title {
			margin-block-start: 0.125rem;
			margin-inline-start: 0.875rem;
			overflow: hidden;

			.title-heading {
				color: var(--theme--foreground-accent);
				font-size: 1rem;
				line-height: 1;
				font-weight: 700;
			}

			.subtitle {
				color: var(--theme--foreground-subdued);
			}
		}
	}

	.logo {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 3.125rem;
		block-size: 3.125rem;
		background-color: var(--project-color);
		border-radius: calc(var(--theme--border-radius) - 0.125rem);

		img {
			inline-size: 2.25rem;
			block-size: 2.25rem;
			object-fit: contain;
			object-position: center center;
		}
	}

	@include mixins.breakpoint-down('xl') {
		.license-badge {
			display: none;
		}
	}
}

.scale-enter-active,
.scale-leave-active {
	transition: all 600ms var(--transition);
}

.scale-enter-from,
.scale-leave-to {
	position: absolute;
	transform: scale(0.95);
	opacity: 0;
}
</style>
