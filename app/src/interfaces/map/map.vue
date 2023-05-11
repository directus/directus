<template>
	<div class="interface-map">
		<div
			class="map"
			:class="{
				loading: mapLoading,
				error: geometryParsingError || geometryOptionsError,
				'has-selection': selection.length > 0,
			}"
		>
			<div ref="container" />
		</div>
		<div
			v-if="location"
			class="mapboxgl-user-location-dot mapboxgl-search-location-dot"
			:style="`transform: translate(${projection!.x}px, ${projection!.y}px) translate(-50%, -50%) rotateX(0deg) rotateZ(0deg)`"
		></div>
		<transition name="fade">
			<div
				v-if="tooltipVisible"
				class="tooltip top"
				:style="`display: block; transform: translate(${tooltipPosition.x}px, ${tooltipPosition.y}px) translate(-50%, -150%) rotateX(0deg) rotateZ(0deg)`"
			>
				{{ tooltipMessage }}
			</div>
		</transition>
		<div class="mapboxgl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-dropdown basemap-select">
			<v-icon name="map" />
			<v-select v-model="basemap" inline :items="basemaps.map((s) => ({ text: s.name, value: s.name }))" />
		</div>
		<transition name="fade">
			<v-info
				v-if="geometryOptionsError"
				icon="error"
				center
				type="danger"
				:title="t('interfaces.map.invalid_options')"
			>
				<v-notice type="danger" :icon="false">
					{{ geometryOptionsError }}
				</v-notice>
			</v-info>
			<v-info
				v-else-if="geometryParsingError"
				icon="error"
				center
				type="warning"
				:title="t('layouts.map.invalid_geometry')"
			>
				<v-notice type="warning" :icon="false">
					{{ geometryParsingError }}
				</v-notice>
				<template #append>
					<v-card-actions>
						<v-button small secondary @click="resetValue(false)">{{ t('continue') }}</v-button>
						<v-button small kind="danger" @click="resetValue(true)">{{ t('reset') }}</v-button>
					</v-card-actions>
				</template>
			</v-info>
		</transition>
	</div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';
import { flatten, getBBox, getGeometryFormatForType, getParser, getSerializer } from '@/utils/geometry';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';
import { ButtonControl } from '@/utils/geometry/controls';
import { Field, GeoJSONParser, GeoJSONSerializer, GeometryType, MultiGeometry, SimpleGeometry } from '@directus/types';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Geometry } from 'geojson';
import { debounce, isEqual, snakeCase } from 'lodash';
import maplibre, {
	AnimationOptions,
	AttributionControl,
	CameraOptions,
	GeolocateControl,
	LngLatBoundsLike,
	LngLatLike,
	Map,
	NavigationControl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Ref } from 'vue';
import { computed, onMounted, onUnmounted, ref, toRefs, watch } from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { getMapStyle } from './style';

// @ts-ignore
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';

const activeLayers = [
	'directus-point',
	'directus-line',
	'directus-polygon-fill',
	'directus-polygon-stroke',
	'directus-polygon-midpoint',
	'directus-polygon-and-line-vertex',
].flatMap((name) => [name + '.hot', name + '.cold']);

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown> | unknown[] | string | null;
		type: 'geometry' | 'json' | 'csv' | 'string' | 'text';
		fieldData?: Field;
		loading?: boolean;
		disabled?: boolean;
		geometryType?: GeometryType;
		defaultView?: Record<string, unknown>;
	}>(),
	{
		loading: true,
		defaultView: () => ({}),
	}
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, unknown> | unknown[] | string | null): void;
}>();

const { t } = useI18n();
const container: Ref<HTMLElement | null> = ref(null);
let map: Map;
let mapLoading = ref(true);
let currentGeometry: Geometry | null | undefined;

const geometryOptionsError = ref<string | null>();
const geometryParsingError = ref<string | TranslateResult>();

const geometryType = props.fieldData?.type.split('.')[1] as GeometryType;
const geometryFormat = getGeometryFormatForType(props.type)!;

const settingsStore = useSettingsStore();
const mapboxKey = settingsStore.settings?.mapbox_key;

const basemaps = getBasemapSources();
const appStore = useAppStore();
const { basemap } = toRefs(appStore);

const style = computed(() => {
	const source = basemaps.find((source) => source.name == basemap.value) ?? basemaps[0];
	return basemap.value, getStyleFromBasemapSource(source);
});

let parse: GeoJSONParser;
let serialize: GeoJSONSerializer;

try {
	parse = getParser({ geometryFormat, geometryField: 'value' });
	serialize = getSerializer({ geometryFormat, geometryField: 'value' });
} catch (error: any) {
	geometryOptionsError.value = error;
}

const selection = ref<GeoJSON.Feature[]>([]);

const location = ref<LngLatLike | null>();
const projection = ref<{ x: number; y: number } | null>();

function updateProjection() {
	projection.value = !location.value ? null : map.project(location.value as any);
}

watch(location, updateProjection);

const controls = {
	attribution: new AttributionControl(),
	draw: new MapboxDraw(getDrawOptions(geometryType)),
	fitData: new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds),
	navigation: new NavigationControl({
		showCompass: false,
	}),
	geolocate: new GeolocateControl({
		showUserLocation: false,
	}),
	geocoder: undefined as MapboxGeocoder | undefined,
};

if (mapboxKey) {
	controls.geocoder = new MapboxGeocoder({
		accessToken: mapboxKey,
		collapsed: true,
		flyTo: { speed: 1.4 },
		marker: false,
		mapboxgl: maplibre as any,
		placeholder: t('layouts.map.find_location'),
	});
}

const tooltipVisible = ref(false);
const tooltipMessage = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });

function hideTooltip() {
	tooltipVisible.value = false;
}

const updateTooltipDebounce = debounce((event: any) => {
	const feature = event.features?.[0];

	if (feature && feature.properties!.active === 'false') {
		tooltipMessage.value = t('interfaces.map.click_to_select', { geometry: feature.geometry.type });
		tooltipVisible.value = true;
		tooltipPosition.value = event.point;
	}
}, 200);

function updateTooltip(event: any) {
	tooltipVisible.value = false;
	updateTooltipDebounce({ point: event.point, features: event.features });
}

onMounted(() => {
	const cleanup = setupMap();
	onUnmounted(cleanup);
});

function setupMap(): () => void {
	map = new Map({
		container: container.value!,
		style: style.value,
		dragRotate: false,
		logoPosition: 'bottom-left',
		attributionControl: false,
		...props.defaultView,
		...(mapboxKey ? { accessToken: mapboxKey } : {}),
	});

	if (controls.geocoder) {
		map.addControl(controls.geocoder as any, 'top-right');

		controls.geocoder.on('result', (event: any) => {
			location.value = event.result.center;
		});

		controls.geocoder.on('clear', () => {
			location.value = null;
		});
	}

	controls.geolocate.on('geolocate', (event: any) => {
		const { longitude, latitude } = event.coords;
		location.value = [longitude, latitude];
	});

	map.addControl(controls.attribution, 'bottom-left');
	map.addControl(controls.navigation, 'top-left');
	map.addControl(controls.geolocate, 'top-left');
	map.addControl(controls.fitData, 'top-left');
	map.addControl(controls.draw as any, 'top-left');

	map.on('load', async () => {
		map.resize();
		mapLoading.value = false;
		map.on('draw.create', handleDrawUpdate);
		map.on('draw.delete', handleDrawUpdate);
		map.on('draw.update', handleDrawUpdate);
		map.on('draw.modechange', handleDrawModeChange);
		map.on('draw.selectionchange', handleSelectionChange);
		map.on('move', updateProjection);

		for (const layer of activeLayers) {
			map.on('mousedown', layer, hideTooltip);
			map.on('mousemove', layer, updateTooltip);
			map.on('mouseleave', layer, updateTooltip);
		}

		window.addEventListener('keydown', handleKeyDown);
	});

	watch(() => props.value, updateValue, { immediate: true });
	watch(() => style.value, updateStyle);
	watch(() => props.disabled, updateStyle);

	return () => {
		window.removeEventListener('keydown', handleKeyDown);
		map.remove();
	};
}

function updateValue(value: any) {
	if (!value) {
		controls.draw.deleteAll();
		currentGeometry = null;

		if (geometryType) {
			const snaked = snakeCase(geometryType.replace('Multi', ''));
			const mode = `draw_${snaked}` as any;
			controls.draw.changeMode(mode);
		}
	} else {
		if (!isEqual(value, currentGeometry && serialize(currentGeometry as any))) {
			loadValueFromProps();
			controls.draw.changeMode('simple_select');
		}
	}

	if (props.disabled) {
		controls.draw.changeMode('static');
	}
}

function updateStyle() {
	map.removeControl(controls.draw as any);
	map.setStyle(style.value, { diff: false });
	controls.draw = new MapboxDraw(getDrawOptions(geometryType));
	map.addControl(controls.draw as any, 'top-left');
	loadValueFromProps();
}

function resetValue(hard: boolean) {
	geometryParsingError.value = undefined;
	if (hard) emit('input', null);
}

function fitDataBounds(options: CameraOptions & AnimationOptions) {
	if (map && currentGeometry) {
		const bbox = getBBox(currentGeometry);

		map.fitBounds(bbox as LngLatBoundsLike, {
			padding: 80,
			maxZoom: 8,
			...options,
		});
	}
}

function getDrawOptions(type: GeometryType): any {
	const options = {
		styles: getMapStyle(),
		controls: {},
		userProperties: true,
		displayControlsDefault: false,
		modes: Object.assign(MapboxDraw.modes, {
			static: StaticMode,
		}),
	} as any;

	if (props.disabled) {
		return options;
	}

	if (!type) {
		options.controls.line_string = true;
		options.controls.polygon = true;
		options.controls.point = true;
		options.controls.trash = true;
		return options;
	} else {
		const base = snakeCase(type!.replace('Multi', ''));
		options.controls[base] = true;
		options.controls.trash = true;
		return options;
	}
}

function isTypeCompatible(a?: GeometryType, b?: GeometryType): boolean {
	if (!a || !b) {
		return true;
	}

	if (a.startsWith('Multi')) {
		return a.replace('Multi', '') == b.replace('Multi', '');
	}

	return a == b;
}

function loadValueFromProps() {
	try {
		controls.draw.deleteAll();
		const initialValue = parse(props);

		if (!initialValue) {
			return;
		}

		if (!props.disabled && !isTypeCompatible(geometryType, initialValue!.type)) {
			geometryParsingError.value = t('interfaces.map.unexpected_geometry', {
				expected: geometryType,
				got: initialValue!.type,
			});
		}

		const flattened = flatten(initialValue);

		for (const geometry of flattened) {
			controls.draw.add(geometry);
		}

		currentGeometry = getCurrentGeometry();
		currentGeometry!.bbox = getBBox(currentGeometry!);

		if (geometryParsingError.value) {
			const bbox = getBBox(initialValue!) as LngLatBoundsLike;
			map.fitBounds(bbox, { padding: 0, maxZoom: 8, duration: 0 });
		} else {
			fitDataBounds({ duration: 0 });
		}
	} catch (error: any) {
		geometryParsingError.value = error;
	}
}

function getCurrentGeometry(): Geometry | null {
	const features = controls.draw.getAll().features;
	const geometries = features.map((f) => f.geometry) as (SimpleGeometry | MultiGeometry)[];
	let result: Geometry;

	if (geometries.length == 0) {
		return null;
	} else if (!geometryType) {
		if (geometries.length > 1) {
			result = { type: 'GeometryCollection', geometries };
		} else {
			result = geometries[0];
		}
	} else if (geometryType.startsWith('Multi')) {
		const coordinates = geometries
			.filter(({ type }) => `Multi${type}` == geometryType)
			.map(({ coordinates }) => coordinates);

		result = { type: geometryType, coordinates } as Geometry;
	} else {
		result = geometries[geometries.length - 1];
	}

	return result;
}

function handleDrawModeChange(event: any) {
	if (!props.disabled && event.mode.startsWith('draw') && geometryType && !geometryType.startsWith('Multi')) {
		for (const feature of controls.draw.getAll().features.slice(0, -1)) {
			controls.draw.delete(feature.id as string);
		}
	}
}

function handleSelectionChange(event: any) {
	selection.value = event.features;
}

function handleDrawUpdate() {
	currentGeometry = getCurrentGeometry();

	if (!currentGeometry) {
		controls.draw.deleteAll();
		emit('input', null);
	} else {
		emit('input', serialize(currentGeometry as any));
	}
}

function handleKeyDown(event: any) {
	if ([8, 46].includes(event.keyCode)) {
		controls.draw.trash();
	}
}
</script>

<style lang="scss" scoped>
.interface-map {
	position: relative;
	overflow: hidden;
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);

	.map {
		position: relative;
		width: 100%;
		height: 500px;

		&.error,
		&.loading {
			opacity: 0.25;
		}

		.maplibregl-map {
			width: 100%;
			height: 100%;
		}

		&:not(.has-selection) :deep(.mapbox-gl-draw_trash) {
			display: none;
		}
	}

	.v-info {
		padding: 20px;
		background-color: var(--background-input);
		border-radius: var(--border-radius);
		box-shadow: var(--card-shadow);
	}

	.basemap-select {
		position: absolute;
		right: 10px;
		bottom: 10px;
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

	.mapboxgl-search-location-dot {
		position: absolute;
		top: 0;
		left: 0;
	}
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.tooltip {
	pointer-events: none;
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
