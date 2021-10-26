<template>
	<div
		id="map-container"
		ref="container"
		:class="{ select: selectMode, hover: hoveredFeature || hoveredCluster }"
	></div>
</template>

<script lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css';
import {
	MapboxGeoJSONFeature,
	MapLayerMouseEvent,
	AttributionControl,
	NavigationControl,
	GeolocateControl,
	LngLatBoundsLike,
	GeoJSONSource,
	CameraOptions,
	LngLatLike,
	AnyLayer,
	Map,
} from 'maplibre-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { ref, watch, PropType, onMounted, onUnmounted, defineComponent, toRefs, computed, WatchStopHandle } from 'vue';

import getSetting from '@/utils/get-setting';
import { useAppStore } from '@/stores';
import { BoxSelectControl, ButtonControl } from '@/utils/geometry/controls';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';

export default defineComponent({
	components: {},
	props: {
		data: {
			type: Object as PropType<GeoJSON.FeatureCollection>,
			required: true,
		},
		source: {
			type: Object as PropType<GeoJSONSource>,
			required: true,
		},
		layers: {
			type: Array as PropType<AnyLayer[]>,
			default: () => [],
		},
		camera: {
			type: Object as PropType<CameraOptions & { bbox: any }>,
			default: () => ({} as any),
		},
		bounds: {
			type: Array as unknown as PropType<GeoJSON.BBox>,
			default: undefined,
		},
		featureId: {
			type: String,
			default: undefined,
		},
		selection: {
			type: Array as PropType<Array<string | number>>,
			default: () => [],
		},
	},
	emits: ['moveend', 'featureclick', 'featureselect', 'fitdata', 'setpopup'],
	setup(props, { emit }) {
		const appStore = useAppStore();
		let map: Map;
		const hoveredFeature = ref<MapboxGeoJSONFeature>();
		const hoveredCluster = ref<boolean>();
		const selectMode = ref<boolean>();
		const container = ref<HTMLElement>();
		const unwatchers = [] as WatchStopHandle[];
		const { sidebarOpen, basemap } = toRefs(appStore);
		const basemaps = getBasemapSources();
		const style = computed(() => {
			const source = basemaps.find((source) => source.name === basemap.value) ?? basemaps[0];
			return getStyleFromBasemapSource(source);
		});

		const attributionControl = new AttributionControl({ compact: true });
		const navigationControl = new NavigationControl({
			showCompass: false,
		});
		const geolocateControl = new GeolocateControl();
		const fitDataControl = new ButtonControl('mapboxgl-ctrl-fitdata', () => {
			emit('fitdata');
		});
		const boxSelectControl = new BoxSelectControl({
			boxElementClass: 'selection-box',
			selectButtonClass: 'mapboxgl-ctrl-select',
			unselectButtonClass: 'mapboxgl-ctrl-unselect',
			layers: ['__directus_polygons', '__directus_points', '__directus_lines'],
		});
		const mapboxKey = getSetting('mapbox_key');

		onMounted(() => {
			setupMap();
		});
		onUnmounted(() => {
			map.remove();
		});

		return { container, hoveredFeature, hoveredCluster, selectMode };

		function setupMap() {
			map = new Map({
				container: 'map-container',
				style: style.value,
				attributionControl: false,
				dragRotate: false,
				...props.camera,
				...(mapboxKey ? { accessToken: mapboxKey } : {}),
			});

			if (mapboxKey) {
				map.addControl(new MapboxGeocoder({ accessToken: mapboxKey, marker: false }) as any, 'top-right');
			}
			map.addControl(attributionControl, 'top-right');
			map.addControl(navigationControl, 'top-left');
			map.addControl(geolocateControl, 'top-left');
			map.addControl(fitDataControl, 'top-left');
			map.addControl(boxSelectControl, 'top-left');

			map.on('load', () => {
				watch(() => style.value, updateStyle);
				watch(() => props.bounds, fitBounds);
				map.on('click', '__directus_polygons', onFeatureClick);
				map.on('mousemove', '__directus_polygons', updatePopup);
				map.on('mouseleave', '__directus_polygons', updatePopup);
				map.on('click', '__directus_points', onFeatureClick);
				map.on('mousemove', '__directus_points', updatePopup);
				map.on('mouseleave', '__directus_points', updatePopup);
				map.on('click', '__directus_lines', onFeatureClick);
				map.on('mousemove', '__directus_lines', updatePopup);
				map.on('mouseleave', '__directus_lines', updatePopup);
				map.on('click', '__directus_clusters', expandCluster);
				map.on('mousemove', '__directus_clusters', hoverCluster);
				map.on('mouseleave', '__directus_clusters', hoverCluster);
				map.on('select.enable', () => (selectMode.value = true));
				map.on('select.disable', () => (selectMode.value = false));
				map.on('select.end', (event: MapLayerMouseEvent) => {
					const ids = event.features?.map((f) => f.id);
					emit('featureselect', { ids, replace: !event.alt });
				});
				map.on('moveend', (event) => {
					if (!event.originalEvent) {
						return;
					}
					emit('moveend', {
						center: map.getCenter(),
						zoom: map.getZoom(),
						bearing: map.getBearing(),
						pitch: map.getPitch(),
						bbox: map.getBounds().toArray().flat(),
					});
				});
				startWatchers();
			});

			watch(
				() => sidebarOpen.value,
				(opened) => {
					if (!opened) setTimeout(() => map.resize(), 300);
				}
			);
			setTimeout(() => map.resize(), 300);
		}

		function fitBounds() {
			const bbox = props.data.bbox?.map((x) => x % 90);
			if (map && bbox) {
				map.fitBounds(bbox as LngLatBoundsLike, {
					padding: 100,
					speed: 1.3,
					maxZoom: 14,
				});
			}
		}

		function updateStyle(style: any) {
			unwatchers.forEach((unwatch) => unwatch());
			unwatchers.length = 0;
			map.setStyle(style, { diff: false });
			map.once('styledata', startWatchers);
		}

		function startWatchers() {
			unwatchers.push(
				watch(() => props.source, updateSource, { immediate: true }),
				watch(() => props.selection, updateSelection, { immediate: true }),
				watch(() => props.layers, updateLayers),
				watch(() => props.data, updateData)
			);
		}

		function updateData(newData: any) {
			const source = map.getSource('__directus');
			(source as GeoJSONSource).setData(newData);
			updateSelection(props.selection, undefined);
		}

		function updateSource(newSource: GeoJSONSource) {
			const layersId = new Set(map.getStyle().layers?.map(({ id }) => id));
			for (const layer of props.layers) {
				if (layersId.has(layer.id)) {
					map.removeLayer(layer.id);
				}
			}
			if (props.featureId) {
				(newSource as any).promoteId = props.featureId;
			} else {
				(newSource as any).generateId = true;
			}
			if (map.getStyle().sources?.['__directus']) {
				map.removeSource('__directus');
			}
			map.addSource('__directus', { ...newSource, data: props.data });
			map.once('sourcedata', () => {
				setTimeout(() => props.layers.forEach((layer) => map.addLayer(layer)));
			});
		}

		function updateLayers(newLayers?: AnyLayer[], previousLayers?: AnyLayer[]) {
			const currentMapLayersId = new Set(map.getStyle().layers?.map(({ id }) => id));
			previousLayers?.forEach((layer) => {
				if (currentMapLayersId.has(layer.id)) map.removeLayer(layer.id);
			});
			newLayers?.forEach((layer) => {
				map.addLayer(layer);
			});
		}

		function updateSelection(newSelection?: (string | number)[], previousSelection?: (string | number)[]) {
			previousSelection?.forEach((id) => {
				map.setFeatureState({ id, source: '__directus' }, { selected: false });
				map.removeFeatureState({ id, source: '__directus' });
			});
			newSelection?.forEach((id) => {
				map.setFeatureState({ id, source: '__directus' }, { selected: true });
			});
			boxSelectControl.showUnselect(newSelection?.length);
		}

		function onFeatureClick(event: MapLayerMouseEvent) {
			const feature = event.features?.[0];
			const replace = !event.originalEvent.altKey;
			if (feature && props.featureId) {
				if (boxSelectControl.active()) {
					emit('featureselect', { ids: [feature.id], replace });
				} else {
					emit('featureclick', { id: feature.id, replace });
				}
			}
		}

		function updatePopup(event: MapLayerMouseEvent) {
			const feature = map.queryRenderedFeatures(event.point, {
				layers: ['__directus_polygons', '__directus_points', '__directus_lines'],
			})[0];

			const previousId = hoveredFeature.value?.id;
			const featureChanged = previousId !== feature?.id;
			if (previousId && featureChanged) {
				map.setFeatureState({ id: previousId, source: '__directus' }, { hovered: false });
			}
			if (feature && feature.properties) {
				if (feature.geometry.type === 'Point') {
					const { x, y } = map.project(feature.geometry.coordinates as LngLatLike);
					const rect = map.getContainer().getBoundingClientRect();
					emit('setpopup', { x: rect.x + x, y: rect.y + y });
				} else {
					const { clientX: x, clientY: y } = event.originalEvent;
					emit('setpopup', { x, y });
				}
				if (featureChanged) {
					map.setFeatureState({ id: feature.id, source: '__directus' }, { hovered: true });
					hoveredFeature.value = feature;
					emit('setpopup', { item: feature.id });
				}
			} else {
				if (featureChanged) {
					hoveredFeature.value = feature;
					emit('setpopup', { item: null });
				}
			}
		}

		function expandCluster(event: MapLayerMouseEvent) {
			const features = map.queryRenderedFeatures(event.point, {
				layers: ['__directus_clusters'],
			});
			const clusterId = features[0]?.properties?.cluster_id;
			const source = map.getSource('__directus') as GeoJSONSource;
			source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
				if (err) return;
				map.flyTo({
					center: (features[0].geometry as GeoJSON.Point).coordinates as LngLatLike,
					zoom: zoom,
					speed: 1.3,
				});
			});
		}

		function hoverCluster(event: MapLayerMouseEvent) {
			if (event.type == 'mousemove') {
				hoveredCluster.value = true;
			} else {
				hoveredCluster.value = false;
			}
		}
	},
});
</script>

<style lang="scss">
.mapboxgl-map {
	font: inherit;
}

.mapboxgl-ctrl-group {
	overflow: hidden;
	background: none;

	&:not(:empty) {
		box-shadow: 0 0 3px 1px rgb(0 0 0 / 0.1);
	}

	button {
		width: 36px;
		height: 36px;
		background: var(--background-input) !important;
		border: none !important;
		transition: background-color var(--fast) var(--transition);

		span {
			display: none !important;
		}

		& + button {
			margin-top: 1px;
		}

		&:hover {
			background: var(--background-normal) !important;
		}

		&.active {
			color: var(--background-subdued) !important;
			background: var(--foreground-normal) !important;
		}

		&.hidden {
			display: none;
		}
	}

	button::after {
		display: flex;
		justify-content: center;
		font-size: 24px;
		font-family: 'Material Icons Outline', sans-serif;
		font-style: normal;
		font-variant: normal;
		text-rendering: auto;
		-webkit-font-smoothing: antialiased;
	}
}

.mapboxgl-user-location-dot,
.maplibregl-user-location-dot {
	width: 12px;
	height: 12px;

	&::before {
		width: 12px;
		height: 12px;
	}

	&::after {
		width: 16px;
		height: 16px;
	}
}

.maplibregl-ctrl-top-right {
	max-width: 80%;
}

.mapboxgl-ctrl-zoom-in::after {
	content: 'add';
}

.mapboxgl-ctrl-zoom-out::after {
	content: 'remove';
}

.mapboxgl-ctrl-compass::after {
	content: 'explore';
}

.mapboxgl-ctrl-geolocate::after {
	content: 'my_location';
}

.mapboxgl-ctrl-fitdata::after {
	content: 'crop_free';
}

.mapboxgl-ctrl-select::after {
	content: 'highlight_alt';
}

.mapboxgl-ctrl-unselect::after {
	content: 'clear';
}

.mapboxgl-ctrl-attrib.mapboxgl-compact {
	min-width: 24px;
	min-height: 24px;
	color: var(--foreground-subdued);
	background: var(--background-input) !important;
	box-shadow: var(--card-shadow);

	button {
		opacity: 0.25;
		transition: opacity var(--fast) var(--transition);
	}

	&:hover {
		button {
			opacity: 0.75;
		}
	}

	.maplibregl-ctrl-attrib-inner,
	.mapboxgl-ctrl-attrib-inner {
		font-size: 12px;
		line-height: 20px;
	}
}

.mapboxgl-ctrl-geocoder {
	font-size: inherit !important;
	font-family: inherit !important;
	line-height: inherit !important;
	background-color: var(--background-page);

	&,
	&.suggestions {
		box-shadow: 0 0 3px 1px rgb(0 0 0 / 0.1);
	}
}

.mapboxgl-ctrl-geocoder--input {
	color: var(--foreground-normal) !important;
	border-radius: var(--border-radius);
}

.mapboxgl-ctrl-geocoder .suggestions {
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);
}

.mapboxgl-ctrl-geocoder .suggestions > li > a {
	color: var(--foreground-normal);
}

.mapboxgl-ctrl-geocoder .suggestions > .active > a,
.mapboxgl-ctrl-geocoder .suggestions > li > a:hover {
	color: var(--v-list-item-color-active);
	background-color: var(--background-normal-alt);
}

.mapboxgl-ctrl-geocoder--button {
	background: var(--background-subdued);
}

.mapboxgl-ctrl-geocoder--icon {
	fill: var(--v-icon-color);
}

.mapboxgl-ctrl-geocoder--button:hover .mapboxgl-ctrl-geocoder--icon-close {
	fill: var(--v-icon-color-hover);
}

.mapbox-gl-geocoder--error {
	color: var(--foreground-subdued);
}

.selection-box {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1000;
	width: 0;
	height: 0;
	background: rgb(56 135 190 / 0.1);
	border: 1px solid rgb(56 135 190);
	pointer-events: none;
}

#map-container.hover .mapboxgl-canvas-container {
	cursor: pointer !important;
}

#map-container.select .mapboxgl-canvas-container {
	cursor: crosshair !important;
}
</style>
<style lang="scss" scoped>
#map-container {
	position: relative;
	width: 100%;
	height: 100%;
}
</style>
