<script setup lang="ts">
import { usePageSize } from '@/composables/use-page-size';
import { useI18n } from 'vue-i18n';
import { useSync } from '@directus/composables';
import { GeometryOptions } from '@directus/types';
import MapComponent from './components/map.vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
	defineProps<{
		collection: string;
		geojson: any;
		directusSource: any;
		directusLayers: any[];
		handleClick: (event: { id: string | number; replace: boolean }) => void;
		handleSelect: (event: { ids: Array<string | number>; replace: boolean }) => void;
		resetPresetAndRefresh: () => Promise<void>;
		fitDataBounds: () => void;
		updateItemPopup: () => void;
		geojsonLoading: boolean;
		loading: boolean;
		totalCount: number | null;
		totalPages: number;
		page: number;
		toPage: (newPage: number) => void;
		limit: number;
		selection?: (string | number)[];
		error?: any;
		geojsonError?: string;
		geometryOptions?: GeometryOptions;
		featureId?: string;
		geojsonBounds?: any;
		cameraOptions?: any;
		autoLocationFilter?: boolean;
		template?: string;
		itemPopup?: { item?: any; position?: { x: number; y: number } };
	}>(),
	{
		selection: () => [],
	},
);

const emit = defineEmits(['update:cameraOptions', 'update:limit']);

const { t, n } = useI18n();

const cameraOptionsWritable = useSync(props, 'cameraOptions', emit);
const limitWritable = useSync(props, 'limit', emit);

const { sizes: pageSizes, selected: selectedSize } = usePageSize<{ text: string; value: number }>(
	[100, 1000, 10000, 100000],
	(value) => ({ text: n(value), value }),
	props.limit,
);

limitWritable.value = selectedSize;
</script>

<template>
	<div class="layout-map">
		<map-component
			ref="map"
			class="mapboxgl-map"
			:class="{ loading, error: error || geojsonError || !geometryOptions }"
			:data="geojson"
			:feature-id="featureId"
			:selection="selection"
			:camera="cameraOptions"
			:bounds="geojsonBounds"
			:source="directusSource"
			:layers="directusLayers"
			@featureclick="handleClick"
			@featureselect="handleSelect"
			@moveend="cameraOptionsWritable = $event"
			@fitdata="fitDataBounds"
			@updateitempopup="updateItemPopup"
		/>

		<transition name="fade">
			<div
				v-if="itemPopup!.item"
				class="popup"
				:style="{ insetBlockStart: itemPopup!.position!.y + 'px', insetInlineStart: itemPopup!.position!.x + 'px' }"
			>
				<render-template :template="template" :item="itemPopup!.item" :collection="collection" />
			</div>
		</transition>

		<transition name="fade">
			<slot v-if="error" name="error" :error="error" :reset="resetPresetAndRefresh" />
			<v-info
				v-else-if="geojsonError"
				type="warning"
				icon="wrong_location"
				center
				:title="$t('layouts.map.invalid_geometry')"
			>
				{{ geojsonError }}
			</v-info>
			<v-progress-circular v-else-if="loading || geojsonLoading" indeterminate x-large class="center" />
		</transition>

		<template v-if="loading || (totalCount ?? 0) > 0">
			<div class="footer">
				<div v-if="totalPages > 1" class="pagination">
					<v-pagination
						:length="totalPages"
						:total-visible="7"
						show-first-last
						:model-value="page"
						@update:model-value="toPage"
					/>
				</div>
				<div class="mapboxgl-ctrl-dropdown">
					<span>{{ $t('limit') }}</span>
					<v-select :model-value="limit" :items="pageSizes" inline @update:model-value="limitWritable = +$event" />
				</div>
			</div>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.v-info {
	padding: 40px;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
	pointer-events: none;
}

.v-info :deep(.v-button) {
	pointer-events: initial;
}

.layout-map .mapboxgl-map :deep(.mapboxgl-canvas-container) {
	transition: opacity 0.2s;
}

.layout-map .mapboxgl-map.loading :deep(.mapboxgl-canvas-container) {
	opacity: 0.9;
}

.layout-map .mapboxgl-map.error :deep(.mapboxgl-canvas-container) {
	opacity: 0.4;
}

.layout-map {
	position: relative;
	inline-size: 100%;
	block-size: calc(100% - 60px);
}

.center {
	position: absolute;
	inset-block-start: 50%;
	inset-inline-start: 50%;
	transform: translate(-50%, -50%);
}

.popup {
	position: fixed;
	z-index: 1;
	max-inline-size: 80%;
	padding: 6px 10px;
	color: var(--theme--foreground-accent);
	font-weight: 500;
	font-size: 14px;
	font-family: var(--theme--fonts--sans--font-family);
	background: var(--theme--popover--menu--background);
	border-radius: var(--theme--popover--menu--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	transform: translate(-50%, -140%);
	pointer-events: none;
}

.render-template {
	padding-inline-end: 0;
}

.mapboxgl-ctrl-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	block-size: 36px;
	padding: 10px;
	color: var(--theme--foreground-subdued);
	background: var(--theme--popover--menu--background);
	border-radius: var(--theme--popover--menu--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);
	border: var(--theme--border-width) solid var(--theme--background);

	span {
		inline-size: auto;
		margin-inline-end: 4px;
	}

	.v-select {
		color: var(--theme--foreground);
	}
}

.v-progress-circular {
	--v-progress-circular-background-color: var(--theme--primary-background);
	--v-progress-circular-color: var(--theme--primary);
}

.footer {
	position: absolute;
	inset-inline-end: 0;
	inset-block-end: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	padding: 10px;
	overflow: hidden;
	background-color: transparent !important;

	.pagination {
		--v-button-height: 28px;

		display: inline-block;
		margin-inline-end: 10px;

		button {
			box-shadow: 0 0 3px 1px rgb(0 0 0 / 0.1);
		}
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
