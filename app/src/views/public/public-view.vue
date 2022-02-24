<template>
	<div class="public-view" :class="{ branded: isBranded }">
		<div class="container" :class="{ wide }">
			<div class="title-box">
				<div v-if="branding?.project_logo" class="logo" :style="{ backgroundColor: branding.project_color }">
					<img :src="logoURL" :alt="branding.project_name || 'Logo'" />
				</div>
				<div v-else class="logo" :style="{ backgroundColor: branding.project_color }">
					<img src="./logo-light.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<h1 class="type-title">{{ branding?.project_name }}</h1>
					<p class="subtitle">{{ branding?.project_descriptor ?? t('application') }}</p>
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
			<transition name="scale">
				<img v-if="foregroundURL" class="foreground" :src="foregroundURL" :alt="branding?.project_name" />
			</transition>
			<div class="note-container">
				<div v-if="branding?.public_note" v-md="branding.public_note" class="note" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { defineComponent, computed } from 'vue';
import { useServerStore } from '@/stores';
import { getRootPath } from '@/utils/get-root-path';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		wide: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const { t } = useI18n();
		const serverStore = useServerStore();

		const isBranded = computed(() => {
			return serverStore.info?.project?.project_color ? true : false;
		});

		const backgroundStyles = computed<string>(() => {
			const defaultColor = '#263238';

			if (serverStore.info?.project?.public_background) {
				const url = getRootPath() + `assets/${serverStore.info.project?.public_background}`;
				return `url(${url})`;
			}

			return serverStore.info?.project?.project_color || defaultColor;
		});

		const artStyles = computed(() => ({
			background: backgroundStyles.value,
			backgroundSize: 'cover',
			backgroundPosition: 'center center',
		}));

		const foregroundURL = computed(() => {
			if (!serverStore.info?.project?.public_foreground) return null;
			return getRootPath() + `assets/${serverStore.info.project?.public_foreground}`;
		});

		const logoURL = computed<string | null>(() => {
			if (!serverStore.info?.project?.project_logo) return null;
			return getRootPath() + `assets/${serverStore.info.project?.project_logo}`;
		});

		return {
			version,
			artStyles,
			branding: serverStore.info?.project,
			foregroundURL,
			logoURL,
			isBranded,
			t,
		};
	},
});
</script>

<style lang="scss" scoped>
.public-view {
	display: flex;
	width: 100%;
	height: 100%;
	color: #263238;

	:slotted(.v-icon) {
		--v-icon-color: var(--foreground-subdued);

		margin-left: 4px;
	}

	.container {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; // (60 - 4 - 24) / 2

		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 100%;
		max-width: 500px;
		height: 100%;
		padding: 20px;
		overflow-x: hidden;
		overflow-y: auto;

		// Page Content Spacing
		font-size: 15px;
		line-height: 24px;
		background-color: #fff;
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

		@media (min-width: 600px) {
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

		@media (min-width: 600px) {
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
