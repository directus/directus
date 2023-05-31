<template>
	<div ref="livePreviewEl" class="live-preview" :class="{ fullscreen }">
		<div class="header">
			<v-button
				v-tooltip.bottom.end="t(inPopup ? 'live_preview.close_window' : 'live_preview.new_window')"
				x-small
				rounded
				icon
				secondary
				@click="emit('new-window')"
			>
				<v-icon small :name="inPopup ? 'exit_to_app' : 'open_in_new'" outline />
			</v-button>
			<v-button
				v-tooltip.bottom.end="t('live_preview.refresh')"
				x-small
				icon
				rounded
				secondary
				:disabled="isRefreshing"
				@click="refresh(null)"
			>
				<v-progress-circular v-if="isRefreshing" indeterminate x-small />
				<v-icon v-else small name="refresh" />
			</v-button>
			<span class="url">
				<v-text-overflow :text="url" placement="bottom" />
			</span>
			<div class="spacer" />
			<div class="dimensions" :class="{ disabled: fullscreen }">
				<input
					:value="displayWidth"
					class="width"
					:disabled="fullscreen"
					@input="width = Number(($event as any).target.value)"
				/>
				<v-icon x-small name="close" />
				<input
					:value="displayHeight"
					class="height"
					:disabled="fullscreen"
					@input="height = Number(($event as any).target.value)"
				/>
				<v-select
					v-model="zoom"
					inline
					:items="[
						{ text: '25%', value: 0.25 },
						{ text: '50%', value: 0.5 },
						{ text: '75%', value: 0.75 },
						{ text: '100%', value: 1 },
						{ text: '150%', value: 1.5 },
						{ text: '200%', value: 2 },
					]"
					:disabled="fullscreen"
				/>
			</div>
			<v-button
				v-tooltip.bottom.start="t('live_preview.change_size')"
				x-small
				icon
				rounded
				:secondary="fullscreen"
				@click="toggleFullscreen"
			>
				<v-icon small name="devices" />
			</v-button>
		</div>
		<div class="container">
			<div class="iframe-view" :style="iframeViewStyle">
				<div
					ref="resizeHandle"
					class="resize-handle"
					:style="{
						width: width ? `${width}px` : '100%',
						height: height ? `${height}px` : '100%',
						resize: fullscreen ? 'none' : 'both',
						transform: `scale(${zoom})`,
						transformOrigin: zoom >= 1 ? 'top left' : 'center center',
					}"
				>
					<iframe id="frame" ref="frameEl" :src="url" @load="onIframeLoad" />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useElementSize } from '@directus/composables';
import { CSSProperties, computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

declare global {
	interface Window {
		refreshLivePreview: (url: string | null) => void;
	}
}

defineProps<{
	url: string;
	inPopup?: boolean;
}>();

const emit = defineEmits<{
	'new-window': [];
}>();

const { t } = useI18n();

const width = ref<number>();
const height = ref<number>();
const zoom = ref<number>(1);
const displayWidth = ref<number>();
const displayHeight = ref<number>();
const isRefreshing = ref(false);

const resizeHandle = ref<HTMLDivElement>();
const livePreviewEl = ref<HTMLElement>();

const livePreviewSize = useElementSize(livePreviewEl);

const iframeViewStyle = computed(() => {
	const style: CSSProperties = {};

	if (zoom.value <= 1) {
		style.placeItems = 'center';
	}

	if (zoom.value > 1 && width.value && height.value) {
		const paddingWidth = (livePreviewSize.width.value - width.value * zoom.value) / 2;
		const paddingLeft = Math.max((livePreviewSize.width.value - width.value * zoom.value) / 2, 48);
		style.paddingLeft = `${paddingLeft}px`;

		if (paddingWidth < 48) {
			const iframeViewWidth = 48 + width.value * zoom.value + 48;
			style.width = `${iframeViewWidth}px`;
		}

		const paddingHeight = (livePreviewSize.height.value - 44 - height.value * zoom.value) / 2;
		const paddingTop = Math.max(paddingHeight, 48);
		style.paddingTop = `${paddingTop}px`;

		if (paddingHeight < 48) {
			const iframeViewHeight = 48 + height.value * zoom.value + 48;
			style.height = `${iframeViewHeight}px`;
		}
	}

	return style;
});

const fullscreen = computed(() => {
	return width.value === undefined && height.value === undefined;
});

function toggleFullscreen() {
	if (fullscreen.value) {
		width.value = 400;
		height.value = 600;
	} else {
		width.value = undefined;
		height.value = undefined;
		zoom.value = 1;
	}
}

const frameEl = ref<HTMLIFrameElement>();

function refresh(url: string | null) {
	if (!frameEl.value) return;

	isRefreshing.value = true;

	// this is technically a self-assignment, but it works to refresh the iframe
	const newSrc = url || frameEl.value.src;
	frameEl.value.src = newSrc;
}

function onIframeLoad() {
	isRefreshing.value = false;
}

window.refreshLivePreview = refresh;

onMounted(() => {
	if (!resizeHandle.value) return;

	new ResizeObserver(() => {
		if (!resizeHandle.value) return;

		displayWidth.value = resizeHandle.value.offsetWidth;
		displayHeight.value = resizeHandle.value.offsetHeight;

		if (width.value === undefined && height.value === undefined) return;

		width.value = resizeHandle.value.offsetWidth;
		height.value = resizeHandle.value.offsetHeight;
	}).observe(resizeHandle.value);
});
</script>

<style>
#split-content {
	background-color: var(--background-subdued);
}
</style>

<style scoped lang="scss">
.live-preview {
	width: 100%;
	height: 100%;

	.header {
		.v-button.secondary {
			--v-button-background-color: var(--background-subdued);
		}

		width: 100%;
		color: var(--foreground-inverted);
		background-color: var(--background-inverted);
		height: 44px;
		display: flex;
		align-items: center;
		z-index: 10;
		gap: 8px;
		padding: 0px 8px;

		.url {
			color: var(--foreground-subdued);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.spacer {
			flex: 1;
		}

		.dimensions {
			display: flex;
			align-items: center;
			&.disabled {
				color: var(--foreground-subdued);
			}
		}

		input {
			border: none;
			width: 50px;
			background-color: var(--background-inverted);

			&:first-child {
				text-align: right;
			}
		}
	}

	.container {
		width: 100%;
		height: calc(100% - 44px);
		overflow: auto;
	}

	.iframe-view {
		width: 100%;
		height: 100%;
		overflow: auto;
		display: grid;
		padding: 48px;

		#frame {
			width: 100%;
			height: 100%;
			border: 0;
		}

		.resize-handle {
			overflow: hidden;
			box-shadow: 0px 4px 12px -4px rgba(0, 0, 0, 0.2);
		}
	}

	&.fullscreen .iframe-view {
		padding: 0;
	}
}
</style>
