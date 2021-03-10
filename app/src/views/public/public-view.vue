<template>
	<div class="public-view" :class="{ branded: isBranded }">
		<div class="container" :class="{ wide }">
			<div class="title-box">
				<div v-if="branding && branding.project_logo" class="logo" :style="{ backgroundColor: branding.project_color }">
					<img :src="logoURL" :alt="branding.project_name || 'Logo'" />
				</div>
				<div v-else class="logo" :style="{ backgroundColor: branding.project_color }">
					<img src="./logo-light.svg" alt="Directus" class="directus-logo" />
				</div>
				<div class="title">
					<h1 class="type-title">{{ branding && branding.project_name }}</h1>
					<p class="subtitle">Admin App</p>
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
				<img class="foreground" v-if="foregroundURL" :src="foregroundURL" :alt="branding && branding.project_name" />
			</transition>
			<div class="note-container">
				<div class="note" v-if="branding && branding.public_note" v-html="marked(branding.public_note)" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { version } from '../../../package.json';
import { defineComponent, computed } from '@vue/composition-api';
import { useServerStore } from '@/stores';
import marked from 'marked';
import { getRootPath } from '../../utils/get-root-path';

export default defineComponent({
	props: {
		wide: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const serverStore = useServerStore();

		const isBranded = computed(() => {
			return serverStore.state.info?.project?.project_color ? true : false;
		});

		const backgroundStyles = computed<string>(() => {
			const defaultColor = '#263238';

			if (serverStore.state.info?.project?.public_background) {
				const url = getRootPath() + `assets/${serverStore.state.info.project?.public_background}`;
				return `url(${url})`;
			}

			return serverStore.state.info?.project?.project_color || defaultColor;
		});

		const artStyles = computed(() => ({
			background: backgroundStyles.value,
			backgroundSize: 'cover',
			backgroundPosition: 'center center',
		}));

		const foregroundURL = computed(() => {
			if (!serverStore.state.info?.project?.public_foreground) return null;
			return getRootPath() + `assets/${serverStore.state.info.project?.public_foreground}`;
		});

		const logoURL = computed<string | null>(() => {
			if (!serverStore.state.info?.project?.project_logo) return null;
			return getRootPath() + `assets/${serverStore.state.info.project?.project_logo}`;
		});

		return {
			version,
			artStyles,
			marked,
			branding: serverStore.state.info?.project,
			foregroundURL,
			logoURL,
			isBranded,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.public-view {
	display: flex;
	width: 100%;
	height: 100%;
	color: #263238;

	&.branded {
		::v-deep {
			.v-button {
				--v-button-background-color: var(--foreground-normal-alt);
				--v-button-background-color-hover: var(--foreground-normal-alt);
				--v-button-background-color-activated: var(--foreground-normal-alt);
			}

			.v-input {
				--v-input-border-color-focus: var(--foreground-normal);
			}
		}
	}

	.container {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; // (60 - 4 - 24) / 2

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
		box-shadow: 0 0 40px 0 rgba(0, 0, 0, 0.25);
		transition: max-width var(--medium) var(--transition);

		.type-title {
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

		@include breakpoint(small) {
			padding: 40px 80px;
		}
	}

	.art {
		position: relative;
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
				background-color: rgba(38, 50, 56, 0.25);
				border-radius: 6px;
				backdrop-filter: blur(2px);
			}
		}

		@include breakpoint(small) {
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
				color: var(--foreground-subdued);
				color: var(--brand);
				font-weight: 700;
				font-size: 24px;
				line-height: 24px;
			}
			.subtitle {
				width: 100%;
				color: var(--foreground-subdued);
				color: var(--brand);
				opacity: 0.6;
			}
		}
	}

	.logo {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background-color: var(--brand);
		border-radius: var(--border-radius);

		img {
			width: 40px;
			height: 40px;
			object-fit: contain;
			object-position: center center;
		}
	}

	.v-icon {
		--v-icon-color: var(--foreground-subdued);

		margin-left: 4px;
	}
}

.scale-enter-active,
.scale-leave-active {
	transition: all 600ms var(--transition);
}

.scale-enter,
.scale-leave-to {
	position: absolute;
	transform: scale(0.95);
	opacity: 0;
}
</style>
