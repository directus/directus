<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { getRootPath } from '@/utils/get-root-path';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	wide?: boolean;
}

withDefaults(defineProps<Props>(), {
	wide: false,
});

const { t } = useI18n();
const serverStore = useServerStore();

const { info } = storeToRefs(serverStore);

const hasCustomBackground = computed(() => {
	return !!info.value?.project?.public_background;
});

const artStyles = computed(() => {
	if (!hasCustomBackground.value) return {};

	const url = getRootPath() + `assets/${info.value!.project?.public_background}`;

	return {
		background: `url(${url})`,
		backgroundSize: 'cover',
		backgroundPosition: 'center center',
	};
});

const foregroundURL = computed(() => {
	if (!info.value?.project?.public_foreground) return null;
	return '/assets/' + info.value.project?.public_foreground;
});

const logoURL = computed<string | null>(() => {
	if (!info.value?.project?.project_logo) return null;
	return '/assets/' + info.value.project?.project_logo;
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
					<v-image :src="logoURL" :alt="info?.project.project_name || 'Logo'" />
				</div>
				<div
					v-else
					class="logo"
					:style="info?.project?.project_color ? { backgroundColor: info.project.project_color } : {}"
				>
					<img src="./logo-light.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<h1 class="type-title">{{ info?.project?.project_name }}</h1>
					<p class="subtitle">{{ info?.project?.project_descriptor ?? t('application') }}</p>
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
				<div><div></div></div>
				<div><div></div></div>
				<div><div></div></div>
			</div>

			<transition name="scale">
				<v-image v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="info?.project?.project_name" />
			</transition>
			<div class="note-container">
				<div v-if="info?.project?.public_note" v-md="info?.project.public_note" class="note" />
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.public-view {
	display: flex;
	width: 100%;
	height: 100%;

	:slotted(.v-icon) {
		--v-icon-color: var(--theme--foreground-subdued);

		margin-left: 4px;
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
		width: 100%;
		max-width: 500px;
		height: 100%;
		padding: 20px;
		overflow-x: hidden;
		overflow-y: auto;
		background: var(--theme--public--background);
		color: var(--theme--public--foreground);

		/* Page Content Spacing */
		font-size: 15px;
		line-height: 24px;
		box-shadow: 0 0 40px 0 rgb(38 50 56 / 0.1);
		transition: max-width var(--medium) var(--transition);

		:slotted(.type-title) {
			font-size: 42px;
			line-height: 52px;
			color: var(--theme--public--foreground-accent);
		}

		.content {
			width: 340px;
			max-width: 100%;
		}

		&.wide {
			max-width: 872px;

			.content {
				width: 712px;
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
		height: 100%;
		background-position: center center;
		background-size: cover;

		.fallback {
			position: absolute;
			background-color: var(--theme--public--art--background);
			width: 100%;
			height: 100%;
			left: 0;
			top: 0;
			z-index: -1;
			overflow: hidden;

			> div {
				position: absolute;

				> div {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					animation-iteration-count: infinite;
					animation-timing-function: ease-in-out;
					transform-origin: center center;
				}
			}

			> div:nth-child(1) {
				bottom: -25%;
				left: -25%;
				height: 50%;
				width: 50%;
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
				bottom: -25%;
				left: 15%;
				height: 40%;
				width: 60%;
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
				bottom: -20%;
				left: 75%;
				height: 20%;
				width: 40%;
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
			width: 80%;
			max-width: 400px;
		}

		.note-container {
			position: absolute;
			right: 0;
			bottom: 34px;
			left: 0;
			display: flex;
			align-items: flex-end;
			justify-content: center;
			height: 10px;

			.note {
				max-width: 340px;
				margin: 0 auto;
				padding: 8px 12px;
				color: var(--white);
				font-size: 15px;
				line-height: 24px;
				background-color: rgb(38 50 56 / 0.2);
				border-radius: 6px;
				backdrop-filter: blur(2px);
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
		width: max-content;
		max-width: 100%;
		height: 64px;

		.title {
			margin-top: 2px;
			margin-left: 16px;

			h1 {
				font-weight: 700;
				font-size: 18px;
				line-height: 18px;
			}

			.subtitle {
				width: 100%;
				color: var(--theme--foreground-subdued);
			}
		}
	}

	.logo {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background-color: var(--project-color);
		border-radius: calc(var(--theme--border-radius) - 2px);

		img {
			width: 40px;
			height: 40px;
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
