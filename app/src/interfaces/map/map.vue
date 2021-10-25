<template>
	<div class="interface-map">
		<div class="map" :class="{ loading: mapLoading, error: geometryParsingError || geometryOptionsError }">
			<div ref="container" />
		</div>
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

<script lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { defineComponent, onMounted, onUnmounted, PropType, ref, watch, toRefs, computed } from 'vue';
import {
	LngLatBoundsLike,
	AnimationOptions,
	CameraOptions,
	Map,
	NavigationControl,
	GeolocateControl,
} from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// @ts-ignore
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { ButtonControl } from '@/utils/geometry/controls';
import { Geometry } from 'geojson';
import { flatten, getBBox, getParser, getSerializer, getGeometryFormatForType } from '@/utils/geometry';
import {
	Field,
	GeometryType,
	GeometryFormat,
	GeoJSONParser,
	GeoJSONSerializer,
	SimpleGeometry,
	MultiGeometry,
} from '@directus/shared/types';
import getSetting from '@/utils/get-setting';
import { snakeCase, isEqual } from 'lodash';
import styles from './style';
import { useI18n } from 'vue-i18n';
import { TranslateResult } from 'vue-i18n';
import { useAppStore } from '@/stores';

import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'geometry' | 'json' | 'csv' | 'string' | 'text'>,
			default: null,
		},
		fieldData: {
			type: Object as PropType<Field | undefined>,
			default: undefined,
		},
		value: {
			type: [Object, Array, String] as PropType<any>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		geometryFormat: {
			type: String as PropType<GeometryFormat>,
			default: undefined,
		},
		geometryType: {
			type: String as PropType<GeometryType>,
			default: undefined,
		},
		defaultView: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		let mapLoading = ref(true);
		let currentGeometry: Geometry | null | undefined;

		const geometryOptionsError = ref<string | null>();
		const geometryParsingError = ref<string | TranslateResult>();

		const geometryType = (props.fieldData?.schema?.geometry_type ?? props.geometryType) as GeometryType;
		const geometryFormat = props.geometryFormat || getGeometryFormatForType(props.type)!;

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

		const mapboxKey = getSetting('mapbox_key');

		const controls = {
			draw: new MapboxDraw(getDrawOptions(geometryType)),
			fitData: new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds),
			navigation: new NavigationControl({
				showCompass: false,
			}),
			geolocate: new GeolocateControl(),
		};

		onMounted(() => {
			const cleanup = setupMap();
			onUnmounted(cleanup);
		});

		return {
			t,
			container,
			mapLoading,
			resetValue,
			geometryParsingError,
			geometryOptionsError,
			basemaps,
			basemap,
		};

		function setupMap(): () => void {
			map = new Map({
				container: container.value!,
				style: style.value,
				attributionControl: false,
				dragRotate: false,
				logoPosition: 'bottom-right',
				...props.defaultView,
				...(mapboxKey ? { accessToken: mapboxKey } : {}),
			});

			map.addControl(controls.navigation, 'top-left');
			map.addControl(controls.geolocate, 'top-left');
			map.addControl(controls.fitData, 'top-left');
			map.addControl(controls.draw as any, 'top-left');

			if (mapboxKey) {
				map.addControl(new MapboxGeocoder({ accessToken: mapboxKey, marker: false }) as any, 'top-right');
			}

			map.on('load', async () => {
				map.resize();
				mapLoading.value = false;
				map.on('draw.create', handleDrawUpdate);
				map.on('draw.delete', handleDrawUpdate);
				map.on('draw.update', handleDrawUpdate);
				map.on('draw.modechange', handleDrawModeChange);
				window.addEventListener('keydown', handleKeyDown);
			});

			watch(
				() => props.value,
				(value) => {
					if (!value) {
						controls.draw.deleteAll();
						currentGeometry = null;
						if (geometryType) {
							const snaked = snakeCase(geometryType.replace('Multi', ''));
							const mode = `draw_${snaked}` as any;
							controls.draw.changeMode(mode);
						}
					} else {
						if (!isEqual(value, currentGeometry && serialize(currentGeometry))) {
							loadValueFromProps();
							controls.draw.changeMode('simple_select');
						}
					}
					if (props.disabled) {
						controls.draw.changeMode('static');
					}
				},
				{ immediate: true }
			);

			watch(
				() => style.value,
				async () => {
					map.removeControl(controls.draw as any);
					map.setStyle(style.value, { diff: false });
					controls.draw = new MapboxDraw(getDrawOptions(geometryType));
					map.addControl(controls.draw as any, 'top-left');
					loadValueFromProps();
				}
			);

			watch(
				() => props.disabled,
				() => {
					map.removeControl(controls.draw as any);
					controls.draw = new MapboxDraw(getDrawOptions(geometryType));
					map.addControl(controls.draw as any, 'top-left');
					loadValueFromProps();
				}
			);

			return () => {
				window.removeEventListener('keydown', handleKeyDown);
				map.remove();
			};
		}

		function resetValue(hard: boolean) {
			geometryParsingError.value = undefined;
			if (hard) emit('input', null);
		}

		function fitDataBounds(options: CameraOptions & AnimationOptions) {
			if (map && currentGeometry) {
				map.fitBounds(currentGeometry.bbox! as LngLatBoundsLike, {
					padding: 80,
					maxZoom: 8,
					...options,
				});
			}
		}

		function getDrawOptions(type: GeometryType): any {
			const options = {
				styles,
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
			result!.bbox = getBBox(result!);
			return result;
		}

		function handleDrawModeChange(event: any) {
			if (!props.disabled && event.mode.startsWith('draw') && geometryType && !geometryType.startsWith('Multi')) {
				for (const feature of controls.draw.getAll().features.slice(0, -1)) {
					controls.draw.delete(feature.id as string);
				}
			}
		}

		function handleDrawUpdate() {
			currentGeometry = getCurrentGeometry();
			if (!currentGeometry) {
				controls.draw.deleteAll();
				emit('input', null);
			} else {
				emit('input', serialize(currentGeometry));
			}
		}

		function handleKeyDown(event) {
			if ([8, 46].includes(event.keyCode)) {
				controls.draw.trash();
			}
		}
	},
});
</script>

<style lang="scss">
.mapbox-gl-draw_point::after {
	content: 'add_location';
}

.mapbox-gl-draw_line::after {
	content: 'timeline';
}

.mapbox-gl-draw_polygon::after {
	content: 'category';
}

.mapbox-gl-draw_trash::after {
	content: 'delete';
}

.mapbox-gl-draw_uncombine::after {
	content: 'call_split';
}

.mapbox-gl-draw_combine::after {
	content: 'call_merge';
}
</style>

<style lang="scss" scoped>
.interface-map {
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
	}

	.v-info {
		padding: 20px;
		background-color: var(--background-input);
		border-radius: var(--border-radius);
		box-shadow: var(--card-shadow);
	}

	.basemap-select {
		position: absolute;
		bottom: 10px;
		left: 10px;
	}
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	-webkit-transform: translate(-50%, -50%);
	transform: translate(-50%, -50%);
}
</style>
