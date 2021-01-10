<template>
	<div id="map-container"></div>
</template>

<script lang="ts">
import 'maplibre-gl/dist/mapbox-gl.css';
import maplibre, {
	Map,
	Style,
	Source,
	GeoJSONSource,
	LngLatBoundsLike,
	LngLatLike,
	MapLayerMouseEvent,
	CameraOptions,
} from 'maplibre-gl';
import {
	defineComponent,
	PropType,
	ref,
	computed,
	inject,
	toRefs,
	Ref,
	ComputedRef,
	watch,
	onMounted,
	onUnmounted,
} from '@vue/composition-api';
import { useAppStore } from '@/stores';
import { ResizeObserverEntry } from 'resize-observer/lib/ResizeObserverEntry';

class ButtonControl {
	container?: HTMLElement;
	constructor(private cb: (...args: any) => any) {}
	click(...args: any) {
		this.cb(...args);
	}
	onAdd() {
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.container.innerHTML = `
			<button class="mapboxgl-ctrl-fitdata"
			type="button" title="Fit to data" aria-label="Fit to data">
				<span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>
			</button>
		`;
		this.container.addEventListener('click', this.cb.bind(this));
		return this.container;
	}
	onRemove() {
		this.container!.parentNode!.removeChild(this.container!);
	}
}

export default defineComponent({
	components: {},
	props: {
		data: {
			type: Object as PropType<GeoJSON.FeatureCollection>,
			required: true,
		},
		rootStyle: {
			type: Object as PropType<Style>,
			required: true,
		},
		source: {
			type: Object as PropType<Source>,
			default: () => ({} as Source),
		},
		layers: {
			type: Array as PropType<maplibre.AnyLayer[]>,
			default: () => [],
		},
		backgroundLayer: {
			type: String,
			required: true,
		},
		animateOptions: {
			type: Object as PropType<maplibre.FitBoundsOptions>,
			default: () => ({}),
		},
		onClick: {
			type: Function,
			required: true,
		},
		camera: {
			type: Object as PropType<CameraOptions>,
			default: () => ({}),
		},
		autoFit: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const appStore = useAppStore();
		const { sidebarOpen } = toRefs(appStore.state);
		const { data, source, layers, backgroundLayer, animateOptions, onClick } = toRefs(props);

		maplibre.accessToken = 'yo';
		let map: Map;

		onMounted(setupMap);
		onUnmounted(() => {
			map.remove();
		});

		function fitDataBounds() {
			const bbox = data.value.bbox as LngLatBoundsLike;
			if (map && bbox) map.fitBounds(bbox, animateOptions.value);
		}

		function updateBackground(id: string, previous?: string) {
			if (id in map.getStyle().sources! == false) return;
			const before = previous || map.getStyle().layers?.[0]?.id;
			map.addLayer({ id, source: id, type: 'raster' }, before);
			previous && map.removeLayer(previous);
		}

		function updateSource(current: Source | undefined, previous: Source | undefined) {
			if (previous) {
				const currentMapLayersId = map.getStyle().layers?.map(({ id }) => id);
				for (const layer of layers.value || []) {
					if (currentMapLayersId?.includes(layer.id)) map.removeLayer(layer.id);
				}
				for (const source of Object.keys(previous || {})) {
					map.removeSource(source);
				}
			}
			for (const [id, data] of Object.entries(current || {})) {
				map.addSource(id, data);
			}
			for (const layer of layers.value || []) {
				// this is a hack, unsolvable error otherwise
				// map.addLayer(layer)
				setTimeout(() => map.addLayer(layer));
			}
			const source = map.getSource('__directus') as GeoJSONSource;
			source?.setData(data.value);
		}
		function updateLayers(current: maplibre.AnyLayer[], previous: maplibre.AnyLayer[]) {
			for (const layer of previous || []) {
				map.removeLayer(layer.id);
			}
			for (const layer of current || []) {
				map.addLayer(layer);
			}
		}

		function setupMap() {
			const fitDataControl = new ButtonControl(fitDataBounds);

			map = new maplibre.Map({
				container: 'map-container',
				style: props.rootStyle,
				attributionControl: false,
				...props.camera,
			});

			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			map.addControl(new maplibre.AttributionControl({ compact: true }), 'top-right');
			map.addControl(fitDataControl, 'top-left');
			map.on('load', () => {
				setupLayers(map);
				watch(() => backgroundLayer.value, updateBackground, { immediate: true });
				map.once('styledata', () => {
					watch(() => source.value, updateSource, { immediate: true });
					watch(() => layers.value, updateLayers);
				});
			});

			map.on('moveend', () => {
				emit('moveend', {
					center: map.getCenter(),
					zoom: map.getZoom(),
					bearing: map.getBearing(),
					pitch: map.getPitch(),
				});
			});

			watch(
				() => sidebarOpen.value,
				(opened) => {
					if (!opened) setTimeout(() => map.resize(), 300);
				}
			);

			watch(
				() => data.value,
				(data) => {
					const source = map.getSource('__directus') as GeoJSONSource;
					source?.setData(data);
					if (props.autoFit) fitDataBounds();
				}
			);
		}

		function setupLayers(map: Map) {
			map.on('click', '__directus_points', onClick.value);
			map.on('mouseenter', '__directus_points', () => (map.getCanvas().style.cursor = 'pointer'));
			map.on('mouseleave', '__directus_points', () => (map.getCanvas().style.cursor = ''));
			map.on('click', '__directus_polygons', onClick.value);
			map.on('mouseenter', '__directus_polygons', () => (map.getCanvas().style.cursor = 'pointer'));
			map.on('mouseleave', '__directus_polygons', () => (map.getCanvas().style.cursor = ''));

			map.on('mouseenter', '__directus_clusters', () => (map.getCanvas().style.cursor = 'pointer'));
			map.on('mouseleave', '__directus_clusters', () => (map.getCanvas().style.cursor = ''));
			map.on('click', '__directus_clusters', function (e: MapLayerMouseEvent) {
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['__directus_clusters'],
				});
				const clusterId = features[0]?.properties?.cluster_id;
				(map.getSource('__directus') as GeoJSONSource).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
					if (err) return;
					map.easeTo({
						center: (features[0].geometry as GeoJSON.Point).coordinates as LngLatLike,
						zoom: zoom,
						...animateOptions.value,
					});
				});
			});
		}
	},
});
</script>

<style lang="scss">
.map-popup {
	width: 100px;
	height: 100px;
	opacity: 0;
	transition: opacity 0.3s;
	pointer-events: none;
}
.map-popup.visible {
	opacity: 1;
}
</style>

<style lang="scss">
.mapboxgl-ctrl-group {
	overflow: hidden;
	background: none;

	&:not(:empty) {
		box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.1);
	}

	button {
		background: var(--background-subdued);
		border: none !important;
		& + button {
			margin-top: 1px;
		}
		.mapboxgl-ctrl-icon {
			background-color: var(--foreground-normal) !important;
			background-image: none !important;
		}
		&:hover {
			background: var(--background-normal) !important;
		}
		&.disabled {
			background: var(--foreground-normal) !important;
			.mapboxgl-ctrl-icon {
				background-color: var(--background-normal) !important;
				background-image: none !important;
			}
		}
	}
}

.mapboxgl-ctrl-attrib-button {
	background-color: var(--foreground-normal) !important;
	background-image: none !important;
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill-rule='evenodd'%3E%3Cpath d='M4 10a6 6 0 1012 0 6 6 0 10-12 0m5-3a1 1 0 102 0 1 1 0 10-2 0m0 3a1 1 0 112 0v3a1 1 0 11-2 0'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl button.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ccc'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl button.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 4C9 4 9 5 9 5v.1A5 5 0 005.1 9H5s-1 0-1 1 1 1 1 1h.1A5 5 0 009 14.9v.1s0 1 1 1 1-1 1-1v-.1a5 5 0 003.9-3.9h.1s1 0 1-1-1-1-1-1h-.1A5 5 0 0011 5.1V5s0-1-1-1zm0 2.5a3.5 3.5 0 110 7 3.5 3.5 0 110-7z'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl button.mapboxgl-ctrl-fitdata .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml,%3Csvg width='29' height='29' viewBox='-4 -4 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z'/%3E%3C/svg%3E%0A");
}
.mapboxgl-ctrl-attrib.mapboxgl-compact {
	min-width: 24px;
	height: 24px;
	color: var(--foreground-normal);
	background: var(--background-subdued) !important;
}
</style>

<style lang="scss" scoped>
#map-container {
	width: 100%;
	height: 100%;
}
</style>
