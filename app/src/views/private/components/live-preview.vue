<script setup lang="ts">
import { CSSProperties, computed, onMounted, ref, watch, nextTick, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useElementSize } from '@directus/composables';
import EditingLayer from '@/modules/visual/components/editing-layer.vue';
import { sameOrigin } from '@/modules/visual/utils/same-origin';

declare global {
	interface Window {
		refreshLivePreview: (url: string | null) => void;
	}
}

const {
	url,
	invalidUrl = false,
	dynamicUrl,
	dynamicDisplay,
	singleUrlSubdued = true,
	canEnableVisualEditing = false,
	visualEditorUrls = [],
	defaultShowEditableElements = false,
} = defineProps<{
	url: string | string[];
	invalidUrl?: boolean;
	dynamicUrl?: string;
	dynamicDisplay?: string;
	singleUrlSubdued?: boolean;
	headerExpanded?: boolean;
	hideRefreshButton?: boolean;
	hidePopupButton?: boolean;
	inPopup?: boolean;
	centered?: boolean;
	/** Whether visual editing prerequisites are met (module enabled, URLs configured, valid item) */
	canEnableVisualEditing?: boolean;
	/** Allowed URLs for visual editing - used to verify the current preview URL passes sameOrigin */
	visualEditorUrls?: string[];
	defaultShowEditableElements?: boolean;
}>();

const emit = defineEmits<{
	'new-window': [];
	selectUrl: [newUrl: string, oldUrl: string];
	saved: [data: { collection: string; primaryKey: string | number }];
}>();

const { t } = useI18n();
const slots = useSlots();

useResizeObserver();

const { urls, frameSrc, urlDisplay, multipleUrls, dynamicUrlIncluded, selectUrl } = useUrls();

const width = ref<number>();
const height = ref<number>();
const zoom = ref<number>(1);
const displayWidth = ref<number>();
const displayHeight = ref<number>();
const isRefreshing = ref(false);
const showEditableElements = ref(defaultShowEditableElements);
const overlayProvided = computed(() => !!slots.overlay);

const livePreviewEl = ref<HTMLElement>();
const resizeHandle = ref<HTMLDivElement>();
const frameEl = ref<HTMLIFrameElement>();

const livePreviewSize = useElementSize(livePreviewEl);

const iframeViewStyle = computed(() => {
	const style: CSSProperties = {};

	if (zoom.value <= 1) {
		style.placeItems = 'center';
	}

	if (zoom.value > 1 && width.value && height.value) {
		const paddingWidth = (livePreviewSize.width.value - width.value * zoom.value) / 2;
		const paddingInlineStart = Math.max((livePreviewSize.width.value - width.value * zoom.value) / 2, 48);
		style.paddingInlineStart = `${paddingInlineStart}px`;

		if (paddingWidth < 48) {
			const iframeViewWidth = 48 + width.value * zoom.value + 48;
			style.inlineSize = `${iframeViewWidth}px`;
		}

		const paddingHeight = (livePreviewSize.height.value - 44 - height.value * zoom.value) / 2;
		const paddingBlockStart = Math.max(paddingHeight, 48);
		style.paddingBlockStart = `${paddingBlockStart}px`;

		if (paddingHeight < 48) {
			const iframeViewHeight = 48 + height.value * zoom.value + 48;
			style.blockSize = `${iframeViewHeight}px`;
		}
	}

	return style;
});

const fullscreen = computed(() => {
	return width.value === undefined && height.value === undefined;
});

/**
 * Two-layer visual editing check:
 * 1. Parent checks prerequisites (module enabled, URLs configured, valid item state)
 * 2. Child checks if the *currently displayed* URL (frameSrc) passes sameOrigin
 *
 * We use frameSrc here because the user may have selected a different URL from the dropdown
 */
const visualEditingEnabled = computed(() => {
	if (!canEnableVisualEditing) return false;
	if (invalidUrl) return false;

	const currentUrl = frameSrc.value;
	if (!currentUrl || !visualEditorUrls.length) return false;

	return visualEditorUrls.some((allowedUrl) => sameOrigin(allowedUrl, currentUrl));
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

function refresh(url: string | null) {
	if (!frameEl.value || isRefreshing.value) return;

	isRefreshing.value = true;

	// this is technically a self-assignment, but it works to refresh the iframe
	const newSrc = url || frameEl.value.src;
	frameEl.value.src = newSrc;
}

function onIframeLoad() {
	isRefreshing.value = false;
}

window.refreshLivePreview = refresh;

watch(
	() => frameSrc.value,
	() => {
		showEditableElements.value = false;
	},
);

watch(visualEditingEnabled, (enabled) => {
	if (!enabled) showEditableElements.value = false;
});

function useResizeObserver() {
	let observerInitialized = false;

	onMounted(setResizeObserver);
	watch(() => invalidUrl, changeUrlAfterInvalid);

	async function changeUrlAfterInvalid(newInvalidUrl: boolean, oldInvalidUrl: boolean) {
		if (!newInvalidUrl && oldInvalidUrl) {
			await nextTick();
			setResizeObserver();
		}
	}

	function setResizeObserver() {
		if (observerInitialized || !resizeHandle.value) return;

		new ResizeObserver(() => {
			if (!resizeHandle.value) return;

			displayWidth.value = resizeHandle.value.offsetWidth;
			displayHeight.value = resizeHandle.value.offsetHeight;

			if (width.value === undefined && height.value === undefined) return;

			width.value = resizeHandle.value.offsetWidth;
			height.value = resizeHandle.value.offsetHeight;
		}).observe(resizeHandle.value);

		observerInitialized = true;
	}
}

function useUrls() {
	const initialDynamicUrl = dynamicUrl;
	const selectedUrl = ref<string>();
	const urlArray = computed(() => (Array.isArray(url) ? url : [url]));
	const multipleUrls = computed(() => urls.value.length > 1);
	const dynamicUrlIncluded = computed(() => dynamicUrl && urlArray.value.includes(dynamicUrl));

	const urls = computed(() => {
		if (dynamicUrl && !dynamicUrlIncluded.value) return [dynamicUrl, ...urlArray.value];
		return urlArray.value;
	});

	const frameSrc = computed({
		get: () => selectedUrl.value ?? initialDynamicUrl ?? urls.value[0],
		set(value) {
			selectedUrl.value = value;
		},
	});

	const urlDisplay = computed(() => {
		if (invalidUrl) return t('select');
		return dynamicDisplay ?? frameSrc.value;
	});

	return {
		urls,
		frameSrc,
		urlDisplay,
		multipleUrls,
		dynamicUrlIncluded,
		selectUrl,
	};

	function selectUrl(newUrl: string) {
		emit('selectUrl', newUrl, String(frameSrc.value));

		if (frameSrc.value === newUrl) {
			refresh(null);
			return;
		}

		frameSrc.value = newUrl;
	}
}
</script>

<template>
	<div ref="livePreviewEl" class="live-preview" :class="{ fullscreen, 'header-expanded': headerExpanded }">
		<div class="header">
			<div class="group">
				<slot name="prepend-header" />

				<v-button
					v-if="visualEditingEnabled"
					v-tooltip.bottom.end="$t(showEditableElements ? 'close' : 'toggle_editable_elements')"
					x-small
					rounded
					icon
					:active="showEditableElements"
					secondary
					@click="showEditableElements = !showEditableElements"
				>
					<v-icon small name="edit" outline />
				</v-button>

				<v-button
					v-if="!hidePopupButton"
					v-tooltip.bottom.end="$t(inPopup ? 'live_preview.close_window' : 'live_preview.new_window')"
					x-small
					rounded
					icon
					secondary
					@click="emit('new-window')"
				>
					<v-icon small :name="inPopup ? 'exit_to_app' : 'open_in_new'" outline />
				</v-button>

				<v-button
					v-if="!hideRefreshButton"
					v-tooltip.bottom.end="$t('live_preview.refresh')"
					x-small
					icon
					rounded
					secondary
					:disabled="isRefreshing || !frameSrc || invalidUrl"
					@click="refresh(null)"
				>
					<v-progress-circular v-if="isRefreshing" indeterminate x-small />
					<v-icon v-else small name="refresh" />
				</v-button>

				<div v-if="centered" class="spacer" />

				<v-menu
					v-if="urls.length"
					class="url"
					:class="{ disabled: singleUrlSubdued, clickable: multipleUrls }"
					:disabled="!multipleUrls"
					show-arrow
					:placement="centered ? 'bottom' : 'bottom-start'"
				>
					<template #activator="{ toggle }">
						<component
							:is="multipleUrls ? 'button' : 'div'"
							:type="multipleUrls ? 'button' : undefined"
							class="activator"
							@click="toggle"
						>
							<v-text-overflow :text="urlDisplay" placement="bottom" />
							<v-icon v-if="multipleUrls" name="expand_more" />
						</component>
					</template>

					<v-list v-if="multipleUrls">
						<v-list-item
							v-for="(urlItem, index) in urls"
							:key="index"
							:active="urlItem === dynamicUrl"
							clickable
							@click="selectUrl(urlItem)"
						>
							<v-list-item-content :class="{ dynamic: !dynamicUrlIncluded && urlItem === dynamicUrl }">
								{{ urlItem }}
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>

			<div class="spacer" />

			<div v-if="frameSrc && !invalidUrl" class="dimensions" :class="{ disabled: fullscreen }">
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
				v-tooltip.bottom.start="$t('live_preview.change_size')"
				x-small
				icon
				rounded
				secondary
				:active="!fullscreen"
				:disabled="!frameSrc || invalidUrl"
				@click="toggleFullscreen"
			>
				<v-icon small name="devices" />
			</v-button>
		</div>

		<v-info v-if="!frameSrc" :title="$t('no_url')" icon="edit_square" center>
			{{ $t('no_url_copy') }}
		</v-info>

		<v-info v-else-if="invalidUrl" :title="$t('invalid_url')" type="danger" icon="edit_square" center>
			{{ $t('invalid_url_copy') }}
		</v-info>

		<div v-else class="container">
			<div class="iframe-view" :style="iframeViewStyle">
				<div
					ref="resizeHandle"
					class="resize-handle"
					:style="{
						inlineSize: width ? `${width}px` : '100%',
						blockSize: height ? `${height}px` : '100%',
						resize: fullscreen ? 'none' : 'both',
						transform: `scale(${zoom})`,
						transformOrigin: zoom >= 1 ? 'top left' : 'center center',
					}"
				>
					<iframe
						id="frame"
						ref="frameEl"
						:src="frameSrc"
						:title="$t('live_preview.iframe_title')"
						@load="onIframeLoad"
					/>
					<slot name="overlay" :frame-el :frame-src />
					<editing-layer
						v-if="visualEditingEnabled && !overlayProvided"
						:frame-el="frameEl"
						:frame-src="frameSrc"
						:show-editable-elements="showEditableElements"
						@saved="(data) => emit('saved', data)"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
#split-content {
	background-color: var(--theme--background-subdued);
}
</style>

<style scoped lang="scss">
.live-preview {
	--preview--color: var(--theme--navigation--modules--button--foreground-hover, #fff);
	--preview--color-disabled: color-mix(
		in srgb,
		var(--theme--navigation--modules--background),
		var(--preview--color) 50%
	);
	--preview--header--background-color: var(--theme--navigation--modules--background);
	--preview--header--border-width: var(--theme--navigation--modules--border-width);
	--preview--header--border-color: var(--theme--navigation--modules--border-color);
	--preview--header--height: 44px;

	container-type: inline-size;
	inline-size: 100%;
	block-size: 100%;

	&.header-expanded {
		--preview--header--height: 60px;

		.header {
			padding: 8px 16px;
		}
	}

	.header {
		--focus-ring-color: var(--theme--navigation--modules--button--background-active);

		inline-size: 100%;
		color: var(--preview--color);
		background-color: var(--preview--header--background-color);
		border-block-end: var(--preview--header--border-width) solid var(--preview--header--border-color);
		block-size: var(--preview--header--height);
		display: flex;
		align-items: center;
		z-index: 10;
		gap: 8px;
		padding: 0 8px;
		transition:
			padding var(--medium) var(--transition),
			block-size var(--medium) var(--transition);

		:deep(.v-button.secondary) {
			--v-button-color: var(--theme--navigation--modules--button--foreground-active);
			--v-button-color-hover: var(--v-button-color);
			--v-button-color-active: var(--foreground-inverted);
			--v-button-background-color: var(--theme--navigation--modules--button--background-active);
			--v-button-background-color-hover: color-mix(
				in srgb,
				var(--theme--navigation--modules--background),
				var(--v-button-background-color) 87.5%
			);
			--v-button-background-color-active: var(--theme--primary);

			.button {
				&.active {
					box-shadow: 0 0 8px 0 rgb(0 0 0 / 0.15);
				}

				&:focus:not(:hover) {
					color: var(--v-button-color);
					background-color: var(--v-button-background-color);
					border-color: var(--v-button-background-color);
				}
			}
		}

		.group {
			display: contents;
		}

		.url {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			color: var(--preview--color);

			&.disabled {
				color: var(--preview--color-disabled);
			}

			&.clickable {
				cursor: pointer;
			}

			.activator {
				display: flex;
				align-items: center;
				min-inline-size: 0;

				.v-icon {
					inset-block-start: 1px;
				}
			}
		}

		.spacer {
			flex: 1;
		}

		.dimensions {
			display: flex;
			align-items: center;

			&.disabled {
				color: var(--preview--color-disabled);
			}
		}

		input {
			border: none;
			inline-size: 50px;
			background-color: transparent;

			&:first-child {
				text-align: end;
			}
		}

		@container (max-width: 480px) {
			.dimensions.disabled {
				display: none;
			}

			.group:has(~ .dimensions:not(.disabled)) {
				display: none;
			}
		}
	}

	.container {
		inline-size: 100%;
		block-size: calc(100% - var(--preview--header--height));
		overflow: auto;
	}

	.iframe-view {
		inline-size: 100%;
		block-size: 100%;
		overflow: auto;
		display: grid;
		padding: 48px;

		#frame {
			inline-size: 100%;
			block-size: 100%;
			border: 0;
		}

		.resize-handle {
			overflow: hidden;
			box-shadow: 0 4px 12px -4px rgb(0 0 0 / 0.2);
		}
	}

	&.fullscreen .iframe-view {
		padding: 0;
	}
}

.dynamic {
	font-style: italic;
}
</style>
