<template>
	<div class="public-view" :class="{ branded: isBranded }">
		<div class="container" :class="{ wide }">
			<div class="title-box">
				<div v-if="info?.project?.project_logo" class="logo" :style="{ backgroundColor: info?.project.project_color }">
					<v-image :src="logoURL" :alt="info?.project.project_name || 'Logo'" />
				</div>
				<div v-else class="logo" :style="{ backgroundColor: info?.project?.project_color }">
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
			<img src="./bg-login.png" />

			<transition name="scale">
				<v-image v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="info?.project?.project_name" />
			</transition>
			<div class="note-container">
				<div v-if="info?.project?.public_note" v-md="info?.project.public_note" class="note" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useServerStore } from '@/stores/server';
import { storeToRefs } from 'pinia';
import { getRootPath } from '@/utils/get-root-path';
import { useI18n } from 'vue-i18n';
import { cssVar } from '@directus/shared/utils/browser';
import Color from 'color';
import { getTheme } from '@/utils/get-theme';

interface Props {
	wide?: boolean;
}

withDefaults(defineProps<Props>(), {
	wide: false,
});

const { t } = useI18n();
const serverStore = useServerStore();

const { info } = storeToRefs(serverStore);

const colors = computed(() => {
	const primary = info.value?.project?.project_color || 'var(--primary)';
	const primaryHex = primary.startsWith('var(--') ? cssVar(primary.substring(4, primary.length - 1)) : primary;
	const isDark = getTheme() === 'dark';
	const primaryColor = Color(primaryHex);

	const primaryColorHSL = primaryColor.hsl() as unknown as {
		model: 'hsl';
		color: [number, number, number];
		valpha: number;
	};

	/**
	 * The default light mode secondary color is based on the standard difference between Directus purple and pink, which is:
	 * primary = 250.9, 100, 63.3
	 * secondary = 320, 100, 80
	 * diff = +69.1, 0, +16.7
	 *
	 * For dark mode, we greatly reduce the lightness value to -50
	 */

	const secondaryColor = Color({
		h: primaryColorHSL.color[0] + (isDark ? -69.1 : 69.1),
		s: primaryColorHSL.color[1] + 0,
		l: primaryColorHSL.color[2] + (isDark ? -50 : 16.7),
	});

	const shades = [];

	for (let i = 1; i < 6; i++) {
		const color = Color(primaryColor).mix(secondaryColor, i / 10);
		shades.push(color.hex().toString());
	}

	return {
		primary: primaryColor.hex().toString(),
		secondary: secondaryColor.hex().toString(),
		shades: shades,
	};
});

const isBranded = computed(() => {
	return info.value?.project?.project_color ? true : false;
});

const hasCustomBackground = computed(() => {
	return !!info.value?.project?.public_background;
});

const artStyles = computed(() => {
	if (!hasCustomBackground.value) return null;

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

<style lang="scss" scoped>
.public-view {
	display: flex;
	width: 100%;
	height: 100%;

	:slotted(.v-icon) {
		--v-icon-color: var(--foreground-subdued);

		margin-left: 4px;
	}

	.container {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; /* (60 - 4 - 24) / 2 */

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

		/* Page Content Spacing */
		font-size: 15px;
		line-height: 24px;
		box-shadow: 0 0 40px 0 rgb(38 50 56 / 0.1);
		transition: max-width var(--medium) var(--transition);

		:slotted(.type-title) {
			font-weight: 800;
			font-size: 42px;
			line-height: 52px;
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
			width: 100%;
			height: 100%;
			position: absolute;
			left: 0;
			top: 0;
			z-index: -1;
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
		color: var(--foreground-subdued);
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
				color: var(--foreground-subdued);
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
		background-color: var(--brand);
		border-radius: calc(var(--border-radius) - 2px);

		img {
			width: 40px;
			height: 40px;
			object-fit: contain;
			object-position: center center;
		}
	}

	&.branded :deep(.v-button) {
		--v-button-background-color: var(--foreground-normal-alt);
		--v-button-background-color-hover: var(--foreground-normal-alt);
		--v-button-background-color-active: var(--foreground-normal-alt);
	}

	&.branded :deep(.v-input) {
		--v-input-border-color-focus: var(--foreground-normal);
		--v-input-box-shadow-color-focus: var(--foreground-normal);
	}

	&.branded :deep(.v-input.solid) {
		--v-input-border-color-focus: var(--foreground-subdued);
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
