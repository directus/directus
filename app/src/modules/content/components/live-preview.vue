<template>
	<div class="live-preview">
		<div class="header">
			<v-button
				v-if="inPopup !== true"
				x-small
				rounded
				icon
				secondary
				v-tooltip.bottom="t('new_window')"
				@click="emit('new-window')"
			>
				<v-icon small name="open_in_new" outline />
			</v-button>
			<v-button x-small icon rounded secondary @click="refresh" size="small">
				<v-icon small name="refresh" />
			</v-button>
			<div class="spacer" />
			<div v-if="!fullscreen">
				<input class="width" v-model.number="width" />
				<v-icon small name="close" />
				<input class="width" v-model.number="height" />
			</div>
			<v-button x-small icon rounded :secondary="fullscreen" @click="toggleFullscreen" size="small">
				<v-icon small name="devices" />
			</v-button>
		</div>
		<div class="iframe-view">
			<iframe
				id="frame"
				ref="frameEl"
				:src="url"
				frameborder="0"
				:width="width || '100%'"
				:height="height || '100%'"
			></iframe>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
	}
}
</style>
