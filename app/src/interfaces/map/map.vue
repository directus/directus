<template>
	<div class="interface-map">
		<div class="map" ref="container"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref, watch, watchEffect } from '@vue/composition-api';
import 'maplibre-gl/dist/maplibre-gl.css';

import maplibre, {
	MapLayerMouseEvent,
	LngLatBoundsLike,
	GeoJSONSource,
	CameraOptions,
	LngLatLike,
	Source,
	Point,
	Style,
	Map,
	Marker,
	LngLat,
} from 'maplibre-gl';
import { ButtonControl } from '@/layouts/map/components/map.vue';
import { sources, mapbox_sources } from '@/layouts/map/styles/sources';
import { Point as JSONPoint } from 'geojson';
import proj4 from 'proj4';
import { useSettingsStore } from '@/stores';
import getSetting from '@/utils/get-setting';

type ModelValue = JSONPoint | [string, string] | null;

export default defineComponent({
	props: {
		value: {
			type: [Object, Array] as PropType<ModelValue>,
			default: null,
		},
		longitude: {
			type: Number,
			default: -73.94896388,
		},
		latitude: {
			type: Number,
			default: 40.72803624,
		},
		type: {
			type: String as PropType<'json' | 'csv'>,
			default: null,
		},
		zoom: {
			type: Number,
			default: 8,
		},
		projection: {
			type: String,
			default: 'EPSG:4326',
		},
		background: {
			type: String,
			default: 'CartoDB_PositronNoLabels',
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		const marker = ref<Marker | null>(null);
		const addMarkerControl = ref<ButtonControl | null>(null);

		let apiKey = getSetting('mapbox_key');
		if (apiKey !== null) maplibre.accessToken = apiKey;

		onMounted(() => {
			setupMap();
		});

		watch(() => props.value, renderMarker);

		return { container };

		function setupMap() {
			if (container.value === null) return;

			const locateMarkerControl = new ButtonControl('mapboxgl-ctrl-fitdata', locateMarker);
			addMarkerControl.value = new ButtonControl('mapboxgl--ctrl-add', toggleMarker);

			map = new Map({
				container: container.value,
				style:
					props.background in mapbox_sources
						? mapbox_sources[props.background]
						: {
								version: 8,
								glyphs:
									'https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf',
								sprite: 'https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/sprites/osm-liberty',
								layers: [
									{
										id: props.background,
										source: props.background,
										type: 'raster',
									},
								],
								sources,
						  },
				center: [props.longitude, props.latitude],
				zoom: props.zoom,
				attributionControl: false,
			});

			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			map.addControl(locateMarkerControl, 'top-left');
			map.addControl(addMarkerControl.value, 'top-left');

			renderMarker(props.value, null);
		}

		function onDragEnd() {
			const lngLat = marker.value?.getLngLat();

			if (lngLat) saveLocation(lngLat);
		}

		function saveLocation(lngLat: LngLat) {
			const coordinates = proj4('EPSG:4326', props.projection, [lngLat.lng, lngLat.lat]);

			if (props.type === 'json') {
				emit('input', {
					type: 'Point',
					coordinates,
				});
			}
			if (props.type === 'csv') {
				emit('input', coordinates);
			}
		}

		function toggleMarker() {
			if (props.value !== null) return emit('input', null);
			saveLocation(map.getCenter());
		}

		function locateMarker(animate = true) {
			const lngLat = marker.value === null ? { lng: props.longitude, lat: props.latitude } : marker.value.getLngLat();

			map.flyTo({
				center: lngLat,
				animate,
				speed: 1.2,
			});
		}

		function renderMarker(newVal: ModelValue, oldVal: ModelValue) {
			if (newVal === null) {
				marker.value?.remove();
				marker.value = null;
				addMarkerControl.value?.activate(false);
				return;
			}

			if (marker.value === null) {
				marker.value = new Marker({
					draggable: true,
				});
			}

			addMarkerControl.value?.activate(true);

			let lnglat: [number, number];

			if (props.type === 'json' && !Array.isArray(newVal)) {
				lnglat = [newVal.coordinates[0], newVal.coordinates[1]];
			} else if (props.type === 'csv' && Array.isArray(newVal)) {
				lnglat = [Number(newVal[0]), Number(newVal[1])];
			} else {
				return;
			}
			marker.value.setLngLat(proj4(props.projection, 'EPSG:4326', lnglat));

			marker.value.on('dragend', onDragEnd);
			marker.value.addTo(map);

			if (newVal !== null && oldVal === null) locateMarker(false);
		}
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl .mapboxgl--ctrl-add .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' height='29' viewBox='-3 -3 30 30' width='29' fill='%2000000'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M20 1v3h3v2h-3v3h-2V6h-3V4h3V1h2zm-8 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm2-9.75V7h3v3h2.92c.05.39.08.79.08 1.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 6.22 7.8 3 12 3c.68 0 1.35.08 2 .25z'/%3E%3C/svg%3E");
}

.mapboxgl-ctrl.active .mapboxgl--ctrl-add .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' height='29' viewBox='-3 -3 30 30' width='29' fill='%2000000'%3E%3Cg%3E%3Crect fill='none' height='24' width='24'/%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cpath d='M20.42,4.5l1.38-1.38c0.39-0.39,0.39-1.02,0-1.41l0,0c-0.39-0.39-1.02-0.39-1.41,0L19,3.08 l-1.38-1.38c-0.39-0.39-1.02-0.39-1.41,0s-0.39,1.02,0,1.41l1.38,1.38l-1.38,1.38c-0.39,0.39-0.39,1.02,0,1.41l0,0 c0.39,0.39,1.02,0.39,1.41,0L19,5.92l1.38,1.38c0.39,0.39,1.02,0.39,1.41,0l0,0c0.39-0.39,0.39-1.02,0-1.41L20.42,4.5z' enable-background='new'/%3E%3Cpath d='M19.67,8L19,7.33l-0.59,0.59c-0.7,0.7-1.84,0.88-2.65,0.3c-1.03-0.74-1.12-2.19-0.26-3.05 l0.67-0.67L15.5,3.83c-0.36-0.36-0.54-0.81-0.57-1.28C14.01,2.19,13.02,2,12,2c-4.2,0-8,3.22-8,8.2c0,3.18,2.45,6.92,7.34,11.23 c0.38,0.33,0.95,0.33,1.33,0C17.55,17.12,20,13.38,20,10.2c0-0.76-0.1-1.47-0.26-2.14C19.72,8.04,19.69,8.02,19.67,8z M12,12 c-1.1,0-2-0.9-2-2s0.9-2,2-2c1.1,0,2,0.9,2,2S13.1,12,12,12z' enable-background='new'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>

<style lang="scss" scoped>
.map {
	position: relative;
	width: 100%;
	height: 500px;
}
</style>
