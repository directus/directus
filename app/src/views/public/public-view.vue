<template>
	<div class="public-view" :class="{ branded: isBranded }">
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
			<svg v-if="!hasCustomBackground" viewBox="0 0 1152 1152" preserveAspectRatio="none" fill="none" class="fallback">
				<rect width="1152" height="1152" :fill="colors.primary" />
				<path
					d="M1152 409.138C1148.61 406.92 1146.7 405.765 1146.7 405.765L6.87761e-07 958.424L-7.3277e-07 1152L506.681 1152C558.985 1126.93 614.88 1101.25 672.113 1074.95C839.401 998.085 1018.12 915.967 1152 828.591L1152 409.138Z"
					:fill="colors.shades[0]"
				/>
				<path
					d="M1152 159.866C1130.19 146.319 1114.45 138.98 1114.45 138.98L-6.09246e-07 759.421L-3.66364e-07 1152L88.7501 1152C131.867 1108.8 194.289 1054.33 281.936 993.927C371.847 931.97 507.23 864.306 651.138 792.382C828.097 703.939 1017.95 609.052 1152 510.407L1152 159.866Z"
					:fill="colors.shades[1]"
				/>
				<path
					d="M772.894 -0.000472457L-4.49523e-07 457.782L-5.22658e-07 953.071C22.142 919.082 94.6279 821.1 262.854 696.786C351.427 631.334 485.624 558.338 628.272 480.744C816.642 378.28 1019.75 267.8 1152 156.087L1152 -0.000477328L772.894 -0.000472457Z"
					:fill="colors.shades[2]"
				/>
				<path
					d="M286.365 -0.000483108L-1.73191e-07 176.373L2.43255e-06 662.21C33.488 615.87 106.028 529.959 243.326 424.909C331.205 357.671 464.771 281.956 606.749 201.473C720.914 136.756 840.519 68.9554 946.182 -0.000479285L286.365 -0.000483108Z"
					:fill="colors.shades[3]"
				/>
				<path
					d="M0.00195277 363.139C37.1564 313.499 107.096 233.66 228.181 137.623C281.94 94.9838 353.09 48.7594 432.872 9.43526e-06L0.00195595 0L0.00195277 363.139Z"
					:fill="colors.shades[4]"
				/>
			</svg>

			<transition name="scale">
				<v-image v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="info?.project?.project_name" />
			</transition>
			<div class="note-container">
				<div v-if="info?.project?.public_note" v-md="info?.project.public_note" class="note" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { getRootPath } from '@/utils/get-root-path';
import { getTheme } from '@/utils/get-theme';
import { cssVar } from '@directus/utils/browser';
import Color from 'color';
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
