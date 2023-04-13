<template>
	<div class="live-preview" :class="{ fullscreen }">
		<div class="header">
			<v-button x-small rounded icon secondary v-tooltip.bottom="t('new_window')" @click="emit('new-window')">
				<v-icon small :name="inPopup ? 'exit_to_app' : 'open_in_new'" outline />
			</v-button>
			<v-button x-small icon rounded secondary @click="refresh" size="small">
				<v-icon small name="refresh" />
			</v-button>
			<div class="spacer" />
			<div class="dimensions" v-if="!fullscreen">
				<input class="width" v-model.number="width" />
				<v-icon x-small name="close" />
				<input class="width" v-model.number="height" />
			</div>
			<v-button x-small icon rounded :secondary="fullscreen" @click="toggleFullscreen" size="small">
				<v-icon small name="devices" />
			</v-button>
		</div>
		<div class="iframe-view">
			<div
				class="resize-handle"
				ref="resizeHandle"
				:style="{
					width: width ? `${width}px` : '100%',
					height: height ? `${height}px` : '100%',
					resize: fullscreen ? 'none' : 'both',
				}"
			>
				<iframe id="frame" ref="frameEl" width="100%" height="100%" :src="url" frameborder="0"></iframe>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	url: string;
	inPopup?: boolean;
}

defineProps<Props>();

const emit = defineEmits(['new-window']);

const { t } = useI18n();

const width = ref<number>();
const height = ref<number>();

const resizeHandle = ref<HTMLDivElement>();

const fullscreen = computed(() => {
	return width.value === undefined && height.value === undefined;
});

function toggleFullscreen() {
	if (fullscreen.value) {
		width.value = 400;
		height.value = 700;
	} else {
		width.value = undefined;
		height.value = undefined;
	}
}

const frameEl = ref<HTMLIFrameElement>();

function refresh() {
	if (!frameEl.value) return;

	frameEl.value.src = frameEl.value.src;
}

(window as any).refreshLivePreview = refresh;

onMounted(() => {
	if (resizeHandle.value) {
		new ResizeObserver(() => {
			if ((width.value === undefined && height.value === undefined) || !resizeHandle.value) return;

			width.value = resizeHandle.value.offsetWidth;
			height.value = resizeHandle.value.offsetHeight;
		}).observe(resizeHandle.value);
	}
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
		width: 100%;
		color: var(--foreground-inverted);
		background-color: var(--background-inverted);
		height: 44px;
		display: flex;
		align-items: center;
		z-index: 10;
		gap: 8px;
		padding: 0px 8px;

		.spacer {
			flex: 1;
		}

		.dimensions {
			display: flex;
			align-items: center;
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

	.iframe-view {
		width: 100%;
		height: calc(100% - 44px);
		overflow: auto;
		position: relative;
		display: grid;
		place-items: center;
		padding: 60px;
	}

	&.fullscreen .iframe-view {
		padding: 0;
	}

	.resize-handle {
		resize: both;
		overflow: hidden;
	}
}
</style>
