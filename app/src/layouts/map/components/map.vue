<template>
	<div
		id="map-container"
		ref="container"
		:class="{ select: selectMode, hover: hoveredFeature || hoveredCluster }"
	></div>
</template>

<script setup lang="ts">
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import maplibre, {
	AnyLayer,
	AttributionControl,
	CameraOptions,
	GeoJSONSource,
	GeolocateControl,
	LngLatBoundsLike,
	LngLatLike,
	Map,
	MapLayerMouseEvent,
	MapboxGeoJSONFeature,
	NavigationControl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { WatchStopHandle, computed, onMounted, onUnmounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';
import { BoxSelectControl, ButtonControl } from '@/utils/geometry/controls';
import { ShowSelect } from '@directus/types';

const props = withDefaults(
	defineProps<{
		data: GeoJSON.FeatureCollection;
		source: GeoJSONSource;
		layers?: AnyLayer[];
		camera?: CameraOptions & { bbox: any };
		bounds?: GeoJSON.BBox;
		featureId?: string;
		selection?: (string | number)[];
		showSelect?: ShowSelect;
	}>(),
	{
		layers: () => [],
		camera: () => ({} as any),
		selection: () => [],
		showSelect: 'multiple',
	}
);

const emit = defineEmits(['moveend', 'featureclick', 'featureselect', 'fitdata', 'updateitempopup']);

const { t } = useI18n();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
let map: Map;
const hoveredFeature = ref<MapboxGeoJSONFeature>();
const hoveredCluster = ref<boolean>();
const selectMode = ref<boolean>();
const container = ref<HTMLElement>();
const unwatchers = [] as WatchStopHandle[];
const { sidebarOpen, basemap } = toRefs(appStore);
const mapboxKey = settingsStore.settings?.mapbox_key;
const basemaps = getBasemapSources();

const style = computed(() => {
	const source = basemaps.find((source) => source.name === basemap.value) ?? basemaps[0];
	return getStyleFromBasemapSource(source);
});

const attributionControl = new AttributionControl();

const navigationControl = new NavigationControl({
	showCompass: false,
});

const geolocateControl = new GeolocateControl();

const fitDataControl = new ButtonControl('mapboxgl-ctrl-fitdata', () => {
	emit('fitdata');
});

const boxSelectControl = new BoxSelectControl({
	boxElementClass: 'map-selection-box',
	selectButtonClass: 'mapboxgl-ctrl-select',
	layers: ['__directus_polygons', '__directus_points', '__directus_lines'],
});

let geocoderControl: MapboxGeocoder | undefined;

if (mapboxKey) {
	const marker = document.createElement('div');
	marker.className = 'mapboxgl-user-location-dot mapboxgl-search-location-dot';

	geocoderControl = new MapboxGeocoder({
		accessToken: mapboxKey,
		collapsed: true,
		marker: { element: marker } as any,
		flyTo: { speed: 1.4 },
		mapboxgl: maplibre as any,
		placeholder: t('layouts.map.find_location'),
	});
}

onMounted(() => {
	setupMap();
});

onUnmounted(() => {
	map.remove();
});

function setupMap() {
	map = new Map({
		container: 'map-container',
		style: style.value,
		dragRotate: false,
		attributionControl: false,
		...props.camera,
		...(mapboxKey ? { accessToken: mapboxKey } : {}),
	});

	if (geocoderControl) {
		map.addControl(geocoderControl as any, 'top-right');
	}

	map.addControl(attributionControl, 'bottom-left');
	map.addControl(navigationControl, 'top-left');
	map.addControl(geolocateControl, 'top-left');
	map.addControl(fitDataControl, 'top-left');
	map.addControl(boxSelectControl, 'top-left');

	map.on('load', () => {
		watch(() => style.value, updateStyle);
		watch(() => props.bounds, fitBounds);
		const activeLayers = ['__directus_polygons', '__directus_points', '__directus_lines'];

		for (const layer of activeLayers) {
			map.on('click', layer, onFeatureClick);
			map.on('mousemove', layer, updatePopup);
			map.on('mouseleave', layer, updatePopup);
		}

		map.on('move', updatePopupLocation);
		map.on('click', '__directus_clusters', expandCluster);
		map.on('mousemove', '__directus_clusters', hoverCluster);
		map.on('mouseleave', '__directus_clusters', hoverCluster);
		map.on('select.enable', () => (selectMode.value = true));
		map.on('select.disable', () => (selectMode.value = false));

		map.on('select.end', (event: MapLayerMouseEvent & { alt: unknown }) => {
			const ids = event.features?.map((f) => f.id);
			emit('featureselect', { ids, replace: !event.alt });
		});

		map.on('moveend', () => {
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
	const bbox = props.data.bbox;

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
}

function onFeatureClick(event: MapLayerMouseEvent) {
	const feature = event.features?.[0];
	const replace = props.showSelect === 'multiple' ? false : !event.originalEvent.altKey;

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
			emit('updateitempopup', { position: { x: rect.x + x, y: rect.y + y } });
		} else {
			const { clientX: x, clientY: y } = event.originalEvent;
			emit('updateitempopup', { position: { x, y } });
		}

		if (featureChanged) {
			map.setFeatureState({ id: feature.id, source: '__directus' }, { hovered: true });
			hoveredFeature.value = feature;
			emit('updateitempopup', { item: feature.id });
		}
	} else {
		if (featureChanged) {
			hoveredFeature.value = feature;
			emit('updateitempopup', { item: null });
		}
	}
}

function updatePopupLocation(event: MapLayerMouseEvent) {
	if (hoveredFeature.value && event.originalEvent) {
		const { x, y } = event.originalEvent;
		emit('updateitempopup', { position: { x, y } });
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
</script>

<style lang="scss" scoped>
#map-container.hover :deep(.mapboxgl-canvas-container) {
	cursor: pointer !important;
}

#map-container.select :deep(.mapboxgl-canvas-container) {
	cursor: crosshair !important;
}

#map-container {
	position: relative;
	width: 100%;
	height: 100%;
}
</style>
