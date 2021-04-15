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
	PointLike,
	Source,
	Point,
	Style,
	Map,
} from 'maplibre-gl';
import { ref, watch, computed, PropType, onMounted, onUnmounted, defineComponent } from '@vue/composition-api';

import { useAppStore } from '@/stores';
import getSetting from '@/utils/get-setting';
import { mapbox_sources } from '../styles/sources';

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

		const markerHeight = 48,
			markerRadius = 24,
			linearOffset = 25;
		var popupOffsets: { [key: string]: PointLike } = {
			top: [0, 0],
			'top-left': [0, 0],
			'top-right': [0, 0],
			bottom: [0, -markerHeight],
			'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
			'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
			left: [markerRadius, (markerHeight - markerRadius) * -1],
			right: [-markerRadius, (markerHeight - markerRadius) * -1],
		};
		const popup = new maplibre.Popup({
			closeButton: false,
			closeOnClick: false,
			className: 'mapboxgl-point-popup',
			maxWidth: 'unset',
			offset: popupOffsets,
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
			// TODO: Fitting a bbox with a different aspect ratio than the viewport can cause artifacts
			// const camera = map.cameraForBounds(bounds as LngLatBoundsLike);
			// map.flyTo(camera, Object.assign(props.camera, props.animateOptions));
		}

		function updateBackground(id: string, previous?: string) {
			if (id in mapbox_sources) {
				if (!maplibre.accessToken) {
					updateBackground('CartoDB_PositronNoLabels', previous);
					return;
				}

				if (previous) {
					map.once('styledata', () => {
						updateSource(props.source, undefined);
					});
				}

				map.setStyle(mapbox_sources[id], { diff: false });
			} else {
				if (previous && previous in mapbox_sources) {
					map.once('styledata', () => {
						updateSource(props.source, undefined);
						map.addLayer({ id, source: id, type: 'raster' }, map.getStyle().layers?.[0]?.id);
					});
					map.setStyle(props.rootStyle);
				} else {
					const before = previous || map.getStyle().layers?.[0]?.id;
					map.addLayer({ id, source: id, type: 'raster' }, before);
					if (previous) {
						map.removeLayer(previous);
					}
				}
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
			if (feature && props.featureId && feature.properties) {
				const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : event.lngLat;
				hoveredId.value = feature.id;
				emit('hover', hoveredId.value);
				map.setFeatureState({ id: hoveredId.value, source: '__directus' }, { hovered: true });
				popup
					.setLngLat(coordinates as LngLatLike)
					.setHTML(feature.properties.description)
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
.mapboxgl-ctrl-group {
	overflow: hidden;
	background: none;
	&:not(:empty) {
		box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.1);
	}
	button {
		width: 36px;
		height: 36px;
		background: var(--background-subdued) !important;
		border: none !important;
		& + button {
			margin-top: 1px;
		}
		&:hover {
			background: var(--background-normal) !important;
		}
		span {
			display: none !important;
		}
	}
	&.active {
		button {
			color: var(--background-subdued) !important;
			background: var(--foreground-normal) !important;
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
.mapboxgl-ctrl-attrib-button {
	background-color: var(--foreground-normal) !important;
	background-image: none !important;
	mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='24' height='24' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill-rule='evenodd'%3E%3Cpath d='M4 10a6 6 0 1012 0 6 6 0 10-12 0m5-3a1 1 0 102 0 1 1 0 10-2 0m0 3a1 1 0 112 0v3a1 1 0 11-2 0'/%3E%3C/svg%3E");
}
.mapboxgl-ctrl-zoom-in::after {
	content: '\e145'; // add
}
.mapboxgl-ctrl-zoom-out::after {
	content: '\e15b'; // remove
}
.mapboxgl-ctrl-compass::after {
	content: '\e87a'; // explore
}
.mapboxgl-ctrl-geolocate::after {
	content: '\e55c'; // my_location
}
.mapboxgl-ctrl-fitdata::after {
	content: '\e3c2'; // crop_free
}
.mapboxgl-ctrl-select::after {
	content: '\ef52'; // highlight_alt
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
