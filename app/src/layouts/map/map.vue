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
			@fitdata="fitGeoJSONBounds"
			@setpopup="updatePopup"
		/>

		<div v-if="popupItem" class="popup" :style="{ top: popupPosition.y + 'px', left: popupPosition.x + 'px' }">
			<render-template :template="template" :item="popupItem" :collection="collection" />
		</div>

		<v-button
			v-if="isGeometryFieldNative && !autoLocationFilter && locationFilterOutdatedWritable"
			small
			class="location-filter"
			@click="updateLocationFilter"
		>
			{{ t('layouts.map.search_this_area') }}
		</v-button>

		<transition name="fade">
			<v-info v-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
				{{ t('unexpected_error_copy') }}
				<template #append>
					<v-error :error="error" />
					<v-button small class="reset-preset" @click="resetPresetAndRefresh">
						{{ t('reset_page_preferences') }}
					</v-button>
				</template>
			</v-info>
			<v-info
				v-else-if="geojsonError"
				type="warning"
				icon="wrong_location"
				center
				:title="t('layouts.map.invalid_geometry')"
			>
				{{ geojsonError }}
			</v-info>
			<v-progress-circular v-else-if="loading || geojsonLoading" indeterminate x-large class="center" />
			<v-info
				v-else-if="!loading && !itemCount && !locationFilterOutdated && (search || filter || locationFilter)"
				icon="search"
				center
				:title="t('layouts.map.no_results_here')"
			>
				<template #append>
					<v-card-actions>
						<v-button :disabled="!search && !filter" @click="clearDataFilters">
							{{ t('layouts.map.clear_data_filter') }}
						</v-button>
						<v-button :disabled="!locationFilter" @click="clearLocationFilter">
							{{ t('layouts.map.clear_location_filter') }}
						</v-button>
					</v-card-actions>
				</template>
			</v-info>
		</transition>

		<template v-if="loading || itemCount > 0">
			<div class="footer">
				<div class="pagination">
					<v-pagination
						v-if="totalPages > 1"
						:length="totalPages"
						:total-visible="7"
						show-first-last
						:model-value="page"
						@update:model-value="toPage"
					/>
				</div>
				<div class="mapboxgl-ctrl-dropdown">
					<span>{{ t('limit') }}</span>
					<v-select
						:model-value="limit"
						:items="[
							{
								text: n(100),
								value: 100,
							},
							{
								text: n(1000),
								value: 1000,
							},
							{
								text: n(10000),
								value: 10000,
							},
							{
								text: n(100000),
								value: 100000,
							},
						]"
						inline
						@update:model-value="limitWritable = +$event"
					/>
				</div>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType } from 'vue';

import MapComponent from './components/map.vue';
import { useSync } from '@directus/shared/composables';
import { GeometryOptions, Item } from '@directus/shared/types';
import { Filter } from '@directus/shared/types';

export default defineComponent({
	components: { MapComponent },
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: () => [],
		},
		search: {
			type: String as PropType<string | null>,
			default: null,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		error: {
			type: Object as PropType<any>,
			default: null,
		},
		geojsonError: {
			type: String,
			default: null,
		},
		geometryOptions: {
			type: Object as PropType<GeometryOptions>,
			default: undefined,
		},
		geojson: {
			type: Object as PropType<any>,
			required: true,
		},
		featureId: {
			type: String,
			default: null,
		},
		geojsonBounds: {
			type: Object as PropType<any>,
			default: undefined,
		},
		directusSource: {
			type: Object as PropType<any>,
			required: true,
		},
		directusLayers: {
			type: Array as PropType<any[]>,
			required: true,
		},
		handleClick: {
			type: Function as PropType<(event: { id: string | number; replace: boolean }) => void>,
			required: true,
		},
		handleSelect: {
			type: Function as PropType<(event: { ids: Array<string | number>; replace: boolean }) => void>,
			required: true,
		},
		cameraOptions: {
			type: Object as PropType<any>,
			default: undefined,
		},
		resetPresetAndRefresh: {
			type: Function as PropType<() => Promise<void>>,
			required: true,
		},
		geojsonLoading: {
			type: Boolean,
			required: true,
		},
		itemCount: {
			type: Number,
			default: null,
		},
		totalPages: {
			type: Number,
			required: true,
		},
		page: {
			type: Number,
			required: true,
		},
		toPage: {
			type: Function as PropType<(newPage: number) => void>,
			required: true,
		},
		limit: {
			type: Number,
			required: true,
		},
		autoLocationFilter: {
			type: Boolean,
			default: undefined,
		},
		locationFilterOutdated: {
			type: Boolean,
			required: true,
		},
		fitGeoJSONBounds: {
			type: Function as PropType<() => void>,
			required: true,
		},
		updateLocationFilter: {
			type: Function as PropType<() => void>,
			required: true,
		},
		clearDataFilters: {
			type: Function as PropType<() => void>,
			required: true,
		},
		clearLocationFilter: {
			type: Function as PropType<() => void>,
			required: true,
		},
		isGeometryFieldNative: {
			type: Boolean,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
		locationFilter: {
			type: Object as PropType<Filter>,
			default: null,
		},
		template: {
			type: String,
			default: () => undefined,
		},
		popupItem: {
			type: [String, Number],
			default: () => undefined,
		},
		popupPosition: {
			type: Object,
			default: () => undefined,
		},
		updatePopup: {
			type: Function,
			required: true,
		},
	},
	emits: ['update:cameraOptions', 'update:limit', 'update:locationFilterOutdated'],
	setup(props, { emit }) {
		const { t, n } = useI18n();

		const cameraOptionsWritable = useSync(props, 'cameraOptions', emit);
		const limitWritable = useSync(props, 'limit', emit);
		const locationFilterOutdatedWritable = useSync(props, 'locationFilterOutdated', emit);

		return { t, n, cameraOptionsWritable, limitWritable, locationFilterOutdatedWritable };
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 36px;
	padding: 10px;
	color: var(--foreground-subdued);
	background-color: var(--background-page);
	border: var(--border-width) solid var(--background-page);
	border-radius: var(--border-radius);

	span {
		width: auto;
		margin-right: 4px;
	}

	.v-select {
		color: var(--foreground-normal);
	}
}

.popup {
	position: fixed;
	z-index: 1;
	max-width: 80%;
	padding: 6px 10px;
	color: var(--foreground-normal-alt);
	font-weight: 500;
	font-size: 14px;
	font-family: var(--family-sans-serif);
	background-color: var(--background-page);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	pointer-events: none;
	translate: -50% calc(-100% - 12px);
}

.layout-map .mapboxgl-map .mapboxgl-canvas-container {
	transition: opacity 0.2s;
}

.layout-map .mapboxgl-map.loading .mapboxgl-canvas-container {
	opacity: 0.9;
}

.layout-map .mapboxgl-map.error .mapboxgl-canvas-container {
	opacity: 0.4;
}
</style>

<style lang="scss" scoped>
.layout-map {
	position: relative;
	width: 100%;
	height: calc(100% - 61px);
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.location-filter {
	position: absolute;
	top: 10px;
	left: 50%;
	box-shadow: var(--card-shadow);
	transform: translate(-50%, 0%);
}

.v-progress-circular {
	--v-progress-circular-background-color: var(--primary-25);
	--v-progress-circular-color: var(--primary-75);
}

.reset-preset {
	margin-top: 24px;
}

.delete-action {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.custom-layers {
	padding: var(--content-padding);
	padding-top: 0;
}

.v-info {
	padding: 40px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	pointer-events: none;
}

.v-info :deep(.v-button) {
	pointer-events: initial;
}

.footer {
	position: absolute;
	right: 10px;
	bottom: 10px;
	left: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	overflow: hidden;
	background-color: transparent !important;

	.pagination {
		--v-button-height: 28px;

		display: inline-block;

		button {
			box-shadow: 0 0 2px 1px rgb(0 0 0 / 0.2);
		}
	}
}
</style>
