<template>
	<div class="interface-map">
		<div
			class="map"
			ref="container"
			:class="{ loading: mapLoading, error: geometryParsingError || geometryOptionsError }"
		></div>
		<transition name="fade">
			<v-info
				v-if="geometryOptionsError"
				icon="error"
				center
				type="danger"
				:title="$t('interfaces.map.invalid_options')"
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
				:title="$t('layouts.map.invalid_geometry')"
			>
				<v-notice type="warning" :icon="false">
					{{ geometryParsingError }}
				</v-notice>
				<template #append>
					<v-card-actions>
						<v-button small @click="resetValue(false)" class="soft-reset" secondary>{{ $t('continue') }}</v-button>
						<v-button small @click="resetValue(true)" class="hard-reset">{{ $t('reset') }}</v-button>
					</v-card-actions>
				</template>
			</v-info>
		</transition>
	</div>
</template>

<script lang="ts">
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { defineComponent, onMounted, onUnmounted, PropType, ref, watch } from '@vue/composition-api';
import {
	LngLatBoundsLike,
	AnimationOptions,
	CameraOptions,
	Map,
	NavigationControl,
	GeolocateControl,
	IControl,
} from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
// @ts-ignore
import StaticMode from '@mapbox/mapbox-gl-draw-static-mode';

import { Geometry } from 'geojson';
import { SimpleGeometry, MultiGeometry } from '@/layouts/map/lib';
import { ButtonControl, BasemapSelectControl } from '@/layouts/map/controls';
import {
	getParser,
	getSerializer,
	getBBox,
	GeoJSONParser,
	GeoJSONSerializer,
	compatibleFormatsForType,
} from '@/layouts/map/lib';
import { flatten } from '@/layouts/map/lib';
import { snakeCase, isEqual } from 'lodash';
import styles from './style';
import { Field, GeometryFormat } from '@/types';
import i18n from '@/lang';
import { TranslateResult } from 'vue-i18n';

import { GeometryType } from '@/types';
type _Geometry = SimpleGeometry | MultiGeometry;

const MARKER_ICON_URL =
	'https://cdn.jsdelivr.net/gh/google/material-design-icons/png/maps/place/materialicons/24dp/1x/baseline_place_black_24dp.png';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'geometry' | 'json' | 'csv' | 'string' | 'text' | 'binary'>,
			default: null,
		},
		fieldData: {
			type: Object as PropType<Field>,
			required: true,
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
		},
		geometryType: {
			type: String as PropType<GeometryType>,
		},
		defaultView: {
			type: Object,
			default: () => ({}),
		},
		fitBounds: {
			type: Boolean,
			default: true,
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		let mapLoading = ref(true);
		let currentGeometry: Geometry | null | undefined;

		const geometryOptionsError = ref<string | null>();
		const geometryParsingError = ref<string | TranslateResult>();

		const geometryType = props.fieldData?.schema?.geometry_type || props.geometryType;

		const geometryFormat =
			props.fieldData?.schema?.geometry_format || props.geometryFormat || compatibleFormatsForType(props.type)[0];

		let parse: GeoJSONParser;
		let serialize: GeoJSONSerializer;
		try {
			parse = getParser({ geometryFormat, geometryField: 'value' });
			serialize = getSerializer({ geometryFormat, geometryField: 'value' });
		} catch (error) {
			geometryOptionsError.value = error;
		}

		const controls = {
			draw: new MapboxDraw(getDrawOptions(geometryType)),
			fitData: new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds),
			navigation: new NavigationControl(),
			geolocate: new GeolocateControl(),
			basemapSelect: new BasemapSelectControl(),
		};

		onMounted(() => {
			watch(
				() => props.loading,
				(loading) => {
					if (!loading) {
						setupMap();
						onUnmounted(() => map.remove());
					}
				},
				{ immediate: true }
			);
		});

		return {
			container,
			mapLoading,
			resetValue,
			geometryParsingError,
			geometryOptionsError,
		};

		function setupMap() {
			map = new Map({
				container: container.value!,
				style: { version: 8, layers: [] },
				attributionControl: false,
				...props.defaultView,
			});

			map.addControl(controls.navigation, 'top-left');
			map.addControl(controls.geolocate, 'top-left');
			map.addControl(controls.fitData, 'top-left');
			map.addControl(controls.basemapSelect, 'top-right');
			map.addControl(controls.draw as IControl, 'top-left');

			map.on('load', async () => {
				map.resize();
				mapLoading.value = false;
				await addMarkerImage();
				map.on('basemapselect', () => {
					map.once('styledata', async () => {
						await addMarkerImage();
					});
				});
				map.on('draw.create', handleDrawUpdate);
				map.on('draw.delete', handleDrawUpdate);
				map.on('draw.update', handleDrawUpdate);
				map.on('draw.modechange', handleDrawModeChange);
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
						}
					}
					if (props.disabled) {
						controls.draw.changeMode('static');
					}
				},
				{ immediate: true }
			);
		}

		function resetValue(hard: boolean) {
			geometryParsingError.value = undefined;
			if (hard) emit('input', null);
		}

		function addMarkerImage() {
			return new Promise((resolve, reject) => {
				map.loadImage(MARKER_ICON_URL, (error: any, image: any) => {
					if (error) reject(error);
					map.addImage('place', image, { sdf: true });
					resolve(true);
				});
			});
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
				if (!props.disabled && !isTypeCompatible(geometryType, initialValue!.type)) {
					geometryParsingError.value = i18n.t('interfaces.map.unexpected_geometry', {
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
				if (props.fitBounds) {
					if (geometryParsingError.value) {
						const bbox = getBBox(initialValue!) as LngLatBoundsLike;
						map.fitBounds(bbox, { padding: 80, maxZoom: 8, duration: 0 });
					} else {
						fitDataBounds({ duration: 0 });
					}
				}
			} catch (error) {
				geometryParsingError.value = error;
			}
		}

		function getCurrentGeometry(): Geometry | null {
			const features = controls.draw.getAll().features;
			const geometries = features.map((f) => f.geometry) as _Geometry[];
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
	},
});
</script>

<style lang="scss">
.mapbox-gl-draw_point::after {
	content: '\ef3a'; // add_location
}
.mapbox-gl-draw_line::after {
	content: '\e922'; // timeline
}
.mapbox-gl-draw_polygon::after {
	content: '\e574'; // category
}
.mapbox-gl-draw_trash::after {
	content: '\e872'; // delete
}
.mapbox-gl-draw_uncombine::after {
	content: '\e0b6'; // call_split
}
.mapbox-gl-draw_combine::after {
	content: '\e0b3'; // call_merge
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
	}
	.v-info {
		padding: 20px;
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
		box-shadow: var(--card-shadow);
	}
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	-webkit-transform: translate(-50%, -50%);
	transform: translate(-50%, -50%);
}

.v-progress-circular {
	--v-progress-circular-background-color: var(--primary-25);
	--v-progress-circular-color: var(--primary-75);
}

.v-button.hard-reset {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}
</style>
