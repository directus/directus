<template>
	<div id="map-container" ref="container" :class="{ select: selectMode, hover: hoveredId != null }">
		<div id="selection" :style="boxStyle"></div>
	</div>
</template>

<script lang="ts">
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
} from 'maplibre-gl';
import { ref, watch, computed, PropType, onMounted, onUnmounted, defineComponent } from '@vue/composition-api';

import { useAppStore } from '@/stores';
import getSetting from '@/utils/get-setting';

export class ButtonControl {
	container?: HTMLElement;
	active: boolean;
	constructor(private className: string, private cb: (...args: any) => any) {
		this.active = false;
	}
	click(...args: any) {
		this.cb(...args);
	}
	onAdd() {
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.container.innerHTML = `
			<button class="${this.className}" type="button">
				<span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>
			</button>
		`;
		this.container.addEventListener('click', this.cb.bind(this));
		return this.container;
	}
	onRemove() {
		this.container?.parentNode?.removeChild(this.container!);
	}
	activate(yes: boolean) {
		this.container?.classList[yes ? 'add' : 'remove']('active');
		this.active = yes;
	}
	toggle() {
		this.container?.classList.toggle('active');
		this.active = !this.active;
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
		camera: {
			type: Object as PropType<CameraOptions>,
			default: () => ({}),
		},
		bounds: {
			type: (Array as unknown) as PropType<GeoJSON.BBox>,
		},
		featureId: {
			type: String,
			required: false,
		},
		selection: {
			type: Array as PropType<Array<string | number>>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const appStore = useAppStore();

		const apiKey = getSetting('mapbox_key');
		if (apiKey !== null) maplibre.accessToken = apiKey;
		let map: Map;
		const container = ref<HTMLElement>();
		const hoveredId = ref<string | number>();
		const boxStyle = ref<unknown>({});
		const selecting = ref(false);
		const shiftPressed = ref(false);
		const selectMode = computed(() => shiftPressed.value || selecting.value);
		let startPos: Point;
		let currentPos: Point;

		onMounted(() => {
			const cleanup = setupMap();
			onUnmounted(cleanup);
		});

		const popup = new maplibre.Popup({
			closeButton: false,
			closeOnClick: false,
			className: 'mapboxgl-point-popup',
			maxWidth: 'unset',
		});

		return { container, boxStyle, selectMode, hoveredId };

		function setupMap() {
			const fitDataControl = new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds);
			const selectControl = new ButtonControl('mapboxgl-ctrl-select', () => {
				shiftPressed.value = !shiftPressed.value;
			});
			watch(
				() => selectMode.value,
				(value) => selectControl.activate(value)
			);

			map = new maplibre.Map({
				container: 'map-container',
				style: props.rootStyle,
				attributionControl: false,
				...props.camera,
			});
			map.boxZoom.disable();
			container.value!.addEventListener('mousedown', onMouseDown, true);

			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			map.addControl(new maplibre.AttributionControl({ compact: true }), 'top-right');
			map.addControl(fitDataControl, 'top-left');
			map.addControl(selectControl, 'top-left');

			map.on('load', () => {
				attachFeatureEvents();
				watch(() => props.backgroundLayer, updateBackground, { immediate: true });
				map.once('styledata', () => {
					watch(() => props.source, updateSource, { immediate: true });
					watch(() => props.selection, updateSelection, { immediate: true });
					watch(() => props.layers, updateLayers);
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
				() => appStore.state.sidebarOpen,
				(opened) => {
					if (!opened) setTimeout(() => map.resize(), 300);
				}
			);

			watch(
				() => props.data,
				(data) => {
					const source = map.getSource('__directus') as GeoJSONSource;
					source?.setData(data);
					updateSelection(props.selection, undefined);
				}
			);

			watch(
				() => props.bounds,
				(bounds) => {
					fitDataBounds();
				}
			);

			document.addEventListener('keydown', onKeyDown);
			document.addEventListener('keyup', onKeyUp);

			return () => {
				map.remove();
				document.removeEventListener('keydown', onKeyDown);
				document.removeEventListener('keyup', onKeyUp);
			};
		}

		function fitDataBounds() {
			const bbox = props.data.bbox as LngLatBoundsLike;
			if (map && bbox) {
				map.fitBounds(bbox, props.animateOptions);
			}
			// const camera = map.cameraForBounds(bounds as LngLatBoundsLike);
			// map.flyTo(camera, Object.assign(props.camera, props.animateOptions));
		}

		function updateBackground(id: string, previous?: string) {
			if (id in map.getStyle().sources! == false) return;
			const before = previous || map.getStyle().layers?.[0]?.id;
			map.addLayer({ id, source: id, type: 'raster' }, before);
			if (previous) {
				map.removeLayer(previous);
			}
		}

		function updateSource(next: Source | undefined, previous: Source | undefined) {
			if (previous) {
				const currentMapLayersId = map.getStyle().layers?.map(({ id }) => id);
				for (const layer of props.layers || []) {
					if (currentMapLayersId?.includes(layer.id)) map.removeLayer(layer.id);
				}
				for (const source of Object.keys(previous || {})) {
					map.removeSource(source);
				}
			}
			for (const [id, source] of Object.entries(next || {})) {
				if (props.featureId) {
					source.promoteId = props.featureId;
				} else {
					source.generateId = true;
				}
				map.addSource(id, source);
			}
			for (const layer of props.layers || []) {
				// this is a hack, unsolvable error otherwise
				// map.addLayer(layer)
				setTimeout(() => map.addLayer(layer));
			}
			const source = map.getSource('__directus') as GeoJSONSource;
			source?.setData(props.data);
		}

		function updateLayers(next: maplibre.AnyLayer[], previous: maplibre.AnyLayer[]) {
			for (const layer of previous || []) {
				map.removeLayer(layer.id);
			}
			for (const layer of next || []) {
				map.addLayer(layer);
			}
		}

		function updateSelection(next: (string | number)[], previous?: (string | number)[]) {
			if (previous) {
				for (const id of previous || []) {
					map.setFeatureState({ id, source: '__directus' }, { selected: false });
				}
			}
			for (const id of next || []) {
				map.setFeatureState({ id, source: '__directus' }, { selected: true });
			}
		}

		function getMousePosition(event: MouseEvent): Point {
			const rect = container.value!.getBoundingClientRect();
			return new maplibre.Point(
				event.clientX - rect.left - container.value!.clientLeft,
				event.clientY - rect.top - container.value!.clientTop
			);
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key == 'Shift') {
				shiftPressed.value = true;
			}
			if (event.key == 'Escape') {
				shiftPressed.value = false;
				onDragEnd();
				emit('select', []);
			}
		}

		function onKeyUp(event: KeyboardEvent) {
			if (event.key == 'Shift') {
				shiftPressed.value = false;
			}
		}

		function onMouseDown(event: MouseEvent) {
			if (!shiftPressed.value) {
				onDragEnd();
				return;
			}
			if (event.button === 0) {
				selecting.value = true;
				map.dragPan.disable();
				document.addEventListener('mousemove', onMouseMove);
				document.addEventListener('mouseup', onMouseUp);
				startPos = getMousePosition(event);
				currentPos = startPos;
			}
		}

		function onMouseMove(event: MouseEvent) {
			currentPos = getMousePosition(event);
			let minX = Math.min(startPos.x, currentPos.x),
				maxX = Math.max(startPos.x, currentPos.x),
				minY = Math.min(startPos.y, currentPos.y),
				maxY = Math.max(startPos.y, currentPos.y);
			const transform = `translate(${minX}px, ${minY}px)`;
			const width = maxX - minX + 'px';
			const height = maxY - minY + 'px';
			boxStyle.value = { transform, width, height };
		}

		function onDragEnd() {
			boxStyle.value = {};
			selecting.value = false;
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onMouseUp);
			map.dragPan.enable();
		}

		function onMouseUp() {
			onDragEnd();

			const features = map.queryRenderedFeatures([startPos, currentPos], {
				layers: ['__directus_polygons', '__directus_points', '__directus_lines'],
			});
			emit(
				'select',
				features.map((feature) => feature.id)
			);
		}

		function onFeatureClick(event: MapLayerMouseEvent) {
			const feature = event.features?.[0];
			if (feature && props.featureId) {
				emit('click', feature.id);
			}
		}

		function onFeatureEnter(event: MapLayerMouseEvent) {
			const feature = event.features?.[0];
			if (feature && props.featureId && feature.geometry.type === 'Point') {
				hoveredId.value = feature.id;
				map.setFeatureState({ id: hoveredId.value, source: '__directus' }, { hovered: true });
				emit('hover', hoveredId.value);
				popup
					.setLngLat([feature.geometry.coordinates[0], feature.geometry.coordinates[1]])
					.setHTML(feature.properties?.description)
					.addTo(map);
			}
		}

		function onFeatureLeave(event: MapLayerMouseEvent) {
			map.setFeatureState({ id: hoveredId.value, source: '__directus' }, { hovered: false });
			emit('leave', hoveredId.value);
			hoveredId.value = undefined;
			popup.remove();
		}

		function expandCluster(event: MapLayerMouseEvent) {
			const features = map.queryRenderedFeatures(event.point, {
				layers: ['__directus_clusters'],
			});
			const clusterId = features[0]?.properties?.cluster_id;
			const source = map.getSource('__directus') as GeoJSONSource;
			source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
				if (err) return;
				map.easeTo({
					center: (features[0].geometry as GeoJSON.Point).coordinates as LngLatLike,
					zoom: zoom,
					...props.animateOptions,
				});
			});
		}
		function attachFeatureEvents() {
			map.on('mouseenter', '__directus_clusters', () => {
				hoveredId.value = -1;
			});
			map.on('mouseleave', '__directus_clusters', () => {
				hoveredId.value = undefined;
			});
			map.on('mouseenter', '__directus_polygons', onFeatureEnter);
			map.on('mouseleave', '__directus_polygons', onFeatureLeave);
			map.on('mouseenter', '__directus_points', onFeatureEnter);
			map.on('mouseleave', '__directus_points', onFeatureLeave);
			map.on('mouseenter', '__directus_lines', onFeatureEnter);
			map.on('mouseleave', '__directus_lines', onFeatureLeave);
			map.on('click', '__directus_clusters', expandCluster);
			map.on('click', '__directus_polygons', onFeatureClick);
			map.on('click', '__directus_points', onFeatureClick);
			map.on('click', '__directus_lines', onFeatureClick);
		}
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl-attrib-button {
	background-color: var(--foreground-normal) !important;
	background-image: none !important;
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill-rule='evenodd'%3E%3Cpath d='M4 10a6 6 0 1012 0 6 6 0 10-12 0m5-3a1 1 0 102 0 1 1 0 10-2 0m0 3a1 1 0 112 0v3a1 1 0 11-2 0'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ccc'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23333'%3E%3Cpath d='M10 4C9 4 9 5 9 5v.1A5 5 0 005.1 9H5s-1 0-1 1 1 1 1 1h.1A5 5 0 009 14.9v.1s0 1 1 1 1-1 1-1v-.1a5 5 0 003.9-3.9h.1s1 0 1-1-1-1-1-1h-.1A5 5 0 0011 5.1V5s0-1-1-1zm0 2.5a3.5 3.5 0 110 7 3.5 3.5 0 110-7z'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-fitdata .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml,%3Csvg width='29' height='29' viewBox='-4 -4 32 32' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z'/%3E%3C/svg%3E%0A");
}
.mapboxgl-ctrl-select .mapboxgl-ctrl-icon {
	mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 24 24' fill='black' width='25' height='25' %3E%3Cpath d='M0 0h24v24H0V0z' fill='none'/%3E%3Cpath d='M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z'/%3E%3C/svg%3E%0A");
}

.mapboxgl-ctrl-group {
	overflow: hidden;
	background: none;

	&:not(:empty) {
		box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.1);
	}

	button {
		background: var(--background-subdued) !important;
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
	}

	&.active {
		button {
			background: var(--foreground-normal) !important;
			.mapboxgl-ctrl-icon {
				background-color: var(--background-subdued) !important;
			}
		}
	}
}

.mapboxgl-ctrl-attrib.mapboxgl-compact {
	min-width: 24px;
	height: 24px;
	color: var(--foreground-normal);
	background: var(--background-subdued) !important;
}

.mapboxgl-point-popup {
	&.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
		border-right-color: var(--background-normal);
	}

	&.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
		border-bottom-color: var(--background-normal);
	}

	&.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
		border-top-color: var(--background-normal);
	}

	&.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
		border-left-color: var(--background-normal);
	}

	.mapboxgl-popup-content {
		color: var(--foreground-normal-alt);
		font-weight: 500;
		font-size: 14px;
		font-family: var(--family-sans-serif);
		background-color: var(--background-normal);
		border-radius: var(--border-radius);
	}
}
</style>

<style lang="scss" scoped>
#map-container {
	position: relative;
	width: 100%;
	height: 100%;
}
#map-container.hover::v-deep .mapboxgl-canvas-container {
	cursor: pointer !important;
}
#map-container.select {
	cursor: crosshair !important;
}
#map-container.select::v-deep canvas {
	pointer-events: none;
}
#selection {
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 1000;
	width: 0;
	height: 0;
	background: rgba(56, 135, 190, 0.1);
	border: 1px solid rgb(56, 135, 190);
	pointer-events: none;
}
</style>
