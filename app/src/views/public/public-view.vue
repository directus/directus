<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import Experience from './components/experience.vue';
import VImage from '@/components/v-image.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useServerStore } from '@/stores/server';
import { getAssetUrl } from '@/utils/get-asset-url';

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
					<VImage :src="logoURL" :alt="info?.project.project_name || 'Logo'" />
				</div>
				<div
					v-else
					class="logo"
					:style="info?.project?.project_color ? { backgroundColor: info.project.project_color } : {}"
				>
					<img src="./logo-light.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<h1 class="type-title"><VTextOverflow :text="info?.project?.project_name" placement="bottom" /></h1>
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
			<div v-if="!hasCustomBackground" class="fallback">
				<Experience />
			</div>

			<video v-else-if="customBackgroundIsVideo" :src="customBackgroundUrl" autoplay muted loop />

			<Transition name="scale">
				<VImage v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="info?.project?.project_name" />
			</Transition>
			<div class="note-container">
				<div v-if="info?.project?.public_note" v-md="info?.project.public_note" class="note" />
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.public-view {
	display: flex;
	inline-size: 100%;
	block-size: 100%;

	:slotted(.v-icon) {
		--v-icon-color: var(--theme--foreground-subdued);

		margin-inline-start: 4px;
	}

	.container {
		--theme--form--column-gap: var(--theme--public--form--column-gap);
		--theme--form--row-gap: var(--theme--public--form--row-gap);
		--theme--form--field--input--background-subdued: var(--theme--public--form--field--input--background);
		--theme--form--field--input--background: var(--theme--public--form--field--input--background);
		--theme--form--field--input--border-color-focus: var(--theme--public--form--field--input--border-color-focus);
		--theme--form--field--input--border-color-hover: var(--theme--public--form--field--input--border-color-hover);
		--theme--form--field--input--border-color: var(--theme--public--form--field--input--border-color);
		--theme--form--field--input--box-shadow-focus: var(--theme--public--form--field--input--box-shadow-focus);
		--theme--form--field--input--box-shadow-hover: var(--theme--public--form--field--input--box-shadow-hover);
		--theme--form--field--input--box-shadow: var(--theme--public--form--field--input--box-shadow);
		--theme--form--field--input--foreground-subdued: var(--theme--public--form--field--input--foreground-subdued);
		--theme--form--field--input--foreground: var(--theme--public--form--field--input--foreground);
		--theme--form--field--input--height: var(--theme--public--form--field--input--height);
		--theme--form--field--input--padding: var(--theme--public--form--field--input--padding);
		--theme--form--field--label--font-family: var(--theme--public--form--field--label--font-family);
		--theme--form--field--label--foreground: var(--theme--public--form--field--label--foreground);

		z-index: 2;
		display: flex;
		flex-shrink: 0;
		flex-direction: column;
		justify-content: space-between;
		inline-size: 100%;
		max-inline-size: 500px;
		block-size: 100%;
		padding: 20px;
		overflow: hidden auto;
		background: var(--theme--public--background);
		color: var(--theme--public--foreground);

		/* Page Content Spacing */
		font-size: 15px;
		line-height: 24px;
		box-shadow: 0 0 40px 0 rgb(38 50 56 / 0.1);
		transition: max-inline-size var(--medium) var(--transition);

		:slotted(.type-title) {
			font-size: 42px;
			line-height: 52px;
			color: var(--theme--public--foreground-accent);
		}

		.content {
			inline-size: 340px;
			max-inline-size: 100%;
		}

		&.wide {
			max-inline-size: 872px;

			.content {
				inline-size: 712px;
			}
		}

		@media (min-width: 500px) {
			padding: 40px 80px;
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

		video {
			inline-size: 100%;
			block-size: 100%;
			object-fit: cover;
			position: absolute;
			z-index: -1;
			inset-block-start: 0;
			inset-inline-start: 0;
		}

		.fallback {
			position: absolute;
			background-color: var(--theme--public--art--background);
			inline-size: 100%;
			block-size: 100%;
			inset-inline-start: 0;
			inset-block-start: 0;
			z-index: -1;
			overflow: hidden;

			> div {
				position: absolute;

				> div {
					position: absolute;
					inset-block-start: 0;
					inset-inline-start: 0;
					inline-size: 100%;
					block-size: 100%;
					border-radius: 50%;
					animation-iteration-count: infinite;
					animation-timing-function: ease-in-out;
					transform-origin: center center;
				}
			}

			> div:nth-child(1) {
				inset-block-end: -25%;
				inset-inline-start: -25%;
				block-size: 50%;
				inline-size: 50%;
				filter: blur(100px);
				z-index: 3;

				> div {
					background-color: var(--theme--public--art--primary);
					opacity: 0.5;
					animation-name: floating1;
					animation-duration: calc(33s / var(--theme--public--art--speed));
				}
			}

			> div:nth-child(2) {
				inset-block-end: -25%;
				inset-inline-start: 15%;
				block-size: 40%;
				inline-size: 60%;
				filter: blur(150px);
				z-index: 2;

				> div {
					background: linear-gradient(
						107.7deg,
						var(--theme--public--art--primary) 0%,
						var(--theme--public--art--secondary) 50%
					);
					opacity: 0.7;
					animation-name: floating2;
					animation-duration: calc(19s / var(--theme--public--art--speed));
				}
			}

			> div:nth-child(3) {
				inset-block-end: -20%;
				inset-inline-start: 75%;
				block-size: 20%;
				inline-size: 40%;
				filter: blur(50px);
				z-index: 1;

				> div {
					background-color: var(--theme--public--art--primary);
					opacity: 0.6;
					animation-name: floating3;
					animation-duration: calc(27s / var(--theme--public--art--speed));
				}
			}

			@keyframes floating1 {
				0% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
				10% {
					transform: translate(25%, -20%) scale(1.5, 1) rotate(0deg);
				}
				20% {
					transform: translate(10%, -25%) scale(1, 1.5) rotate(0deg);
				}
				30% {
					transform: translate(00%, -20%) scale(1, 1.5) rotate(-45deg);
				}
				40% {
					transform: translate(10%, -30%) scale(1, 2) rotate(0deg);
				}
				50% {
					transform: translate(15%, -35%) scale(2, 0.5) rotate(45deg);
				}
				60% {
					transform: translate(10%, -30%) scale(1, 2) rotate(90deg);
				}
				70% {
					transform: translate(25%, -10%) scale(1, 1.5) rotate(45deg);
				}
				80% {
					transform: translate(40%, 20%) scale(1.5, 0.5) rotate(-45deg);
				}
				90% {
					transform: translate(15%, -20%) scale(2, 1.5) rotate(0deg);
				}
				100% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
			}

			@keyframes floating2 {
				0% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
				20% {
					transform: translate(-10%, -05%) scale(1.5, 1.5) rotate(15deg);
				}
				40% {
					transform: translate(00%, -15%) scale(2, 0.5) rotate(-45deg);
				}
				60% {
					transform: translate(-15%, -10%) scale(1.5, 1) rotate(45deg);
				}
				80% {
					transform: translate(-25%, -05%) scale(2.5, 0.5) rotate(180deg);
				}
				100% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
			}

			@keyframes floating3 {
				0% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
				25% {
					transform: translate(-10%, -10%) scale(2, 1) rotate(-15deg);
				}
				50% {
					transform: translate(-20%, -05%) scale(1, 0.5) rotate(45deg);
				}
				75% {
					transform: translate(-15%, -15%) scale(2, 1.5) rotate(180deg);
				}
				100% {
					transform: translate(00%, 00%) scale(1, 1) rotate(0deg);
				}
			}
		}

		.foreground {
			inline-size: 80%;
			max-inline-size: 400px;
		}

		.note-container {
			position: absolute;
			inset-inline: 0;
			inset-block-end: 34px;
			display: flex;
			align-items: flex-end;
			justify-content: center;
			block-size: 10px;

			.note {
				max-inline-size: 340px;
				margin: 0 auto;
				padding: 8px 12px;
				color: var(--white);
				font-size: 15px;
				line-height: 24px;
				background-color: rgb(38 50 56 / 0.2);
				border-radius: 6px;
				backdrop-filter: blur(2px);
				overflow-wrap: break-word;
			}
		}

		@media (min-width: 500px) {
			display: flex;
		}
	}

	.notice {
		display: flex;
		color: var(--theme--foreground-subdued);
	}

	.title-box {
		display: flex;
		align-items: center;
		inline-size: max-content;
		max-inline-size: 100%;
		block-size: 64px;

		.title {
			margin-block-start: 2px;
			margin-inline-start: 16px;
			overflow: hidden;

			h1 {
				font-weight: 700;
				font-size: 18px;
				line-height: 18px;
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
		inline-size: 56px;
		block-size: 56px;
		background-color: var(--project-color);
		border-radius: calc(var(--theme--border-radius) - 2px);

		img {
			inline-size: 40px;
			block-size: 40px;
			object-fit: contain;
			object-position: center center;
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
@/utils/get-appearance
