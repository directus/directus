<script setup lang="ts">
import { useServerStore } from '@/stores/server';
import { getAppearance } from '@/utils/get-appearance';
import { getRootPath } from '@/utils/get-root-path';
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
	const primary = info.value?.project?.project_color || 'var(--theme--primary)';
	const primaryHex = primary.startsWith('var(--') ? cssVar(primary.substring(4, primary.length - 1)) : primary;
	const isDark = getAppearance() === 'dark';
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

			<svg v-if="!hasCustomBackground" width="1152" height="1152" viewBox="0 0 1152 1152" preserveAspectRatio="none" fill="#000000" class="fallback" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="#0E1C2F"/>
				<g opacity="0.8" filter="url(#effect_0)">
					<path
						id="glow_2"
						d="M1244.95 1024.64C1458.24 1232.7 1362.96 1641.34 1288.66 1819.65C1148.47 2092.65 792.036 2082.84 631.34 2043.82C514.214 2020.37 270.279 1854.02 231.549 1376.16C183.136 778.846 544.019 915.217 759.647 1223.22C975.275 1531.23 978.333 764.565 1244.95 1024.64Z"
						:fill="colors.secondary"
					/>
				</g>
				<g opacity="0.6" filter="url(#effect_0)">
					<path
						id="glow_1"
						d="M619.661 1912.72C468.717 2211.44 -4.26421 2245.54 -221.887 2225.26C-564.154 2165.79 -675.964 1779.47 -689.086 1593.74C-704.037 1460.04 -608.551 1142.32 -106.997 941.082C519.946 689.531 496.915 1122.91 239.093 1457.52C-18.7299 1792.13 808.34 1539.33 619.661 1912.72Z"
						:fill="colors.primary"
					/>
				</g>
				<defs>
					<filter id="effect_0" x="-200" y="-200" width="1552" height="1552" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
						<feFlood flood-opacity="0" result="BackgroundImageFix"/>
						<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
						<feGaussianBlur stdDeviation="100" result="effect1_foregroundBlur_397_96"/>
					</filter>
				</defs>
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

			#glow_1 {
				animation-name: floating_1;
				animation-duration: 27s;
				animation-iteration-count: infinite;
				animation-timing-function: ease-in-out;
				transform-origin: center center;
			}

			#glow_2 {
				animation-name: floating_2;
				animation-duration: 17s;
				animation-iteration-count: infinite;
				animation-timing-function: ease-in-out;
				transform-origin: center center;
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

@keyframes floating_1 {
	0% {
		transform: translate(0, 0px) rotate(0deg) scale(1.0, 1.0);
	}
	25% {
		transform: translate(25%, -25%) rotate(45deg) scale(1.5, 1.0);
	}
	50% {
		transform: translate(30%, -30%) rotate(0deg) scale(1.0, 1.5);
	}
	75% {
		transform: translate(50%, 10%) rotate(25deg) scale(1.0, 1.5);
	}
	100% {
		transform: translate(0, -0px) rotate(0deg) scale(1.0, 1.0);
	}
}

@keyframes floating_2 {
	0% {
		transform: translate(0, 0px) rotate(0deg) scale(1.0, 1.0);
	}
	20% {
		transform: translate(-10%, -25%) rotate(25deg) scale(1.5, 1.5);
	}
	40% {
		transform: translate(0%, -15%) rotate(40deg) scale(1.5, 1.0);
	}
	60% {
		transform: translate(-5%, -15%) rotate(30deg) scale(1.5, 1.5);
	}
	80% {
		transform: translate(-10%, -30%) rotate(0deg) scale(2.5, 1.5);
	}
	100% {
		transform: translate(0, -0px) rotate(0deg) scale(1.0, 1.0);
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
