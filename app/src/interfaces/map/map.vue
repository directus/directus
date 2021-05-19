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
					<v-button small @click="resetInterface" class="reset-preset">{{ $t('reset_interface') }}</v-button>
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
	GeometryOptions,
} from '@/layouts/map/lib';
import { GeometryFormat, flatten } from '@/layouts/map/lib';
import { snakeCase, isEqual } from 'lodash';
import styles from './style';
import { Field } from '@/types';

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
			type: String as PropType<GeometryType | undefined>,
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
		const geometryParsingError = ref<string | null>();
		const geometryType = props.geometryType || props.fieldData?.schema?.geometry_type || 'GeometryCollection';

		const geometryOptions: GeometryOptions = {
			geometryField: 'value',
			geometryFormat: props.geometryFormat || 'native',
		};

		let parse: GeoJSONParser;
		let serialize: GeoJSONSerializer;
		try {
			parse = getParser(geometryOptions);
			serialize = getSerializer(geometryOptions);
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
			geometryParsingError,
			geometryOptionsError,
			resetInterface,
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
			});

			watch(
				() => props.value,
				(value) => {
					if (value) {
						if (!isEqual(value, currentGeometry && serialize(currentGeometry))) {
							addInitialValue();
						}
					} else {
						controls.draw.deleteAll();
						currentGeometry = null;
						if (geometryType !== 'GeometryCollection') {
							const snaked = snakeCase(geometryType.replace('Multi', ''));
							const mode = `draw_${snaked}` as 'draw_polygon' | 'draw_point' | 'static';
							controls.draw.changeMode(mode);
						}
					}
					if (props.disabled) {
						controls.draw.changeMode('static');
					}
				},
				{ immediate: true }
			);
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

		function resetInterface() {
			emit('input', null);
			geometryParsingError.value = null;
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

		function getDrawOptions(type: GeometryType | 'GeometryCollection'): any {
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
			if (type == 'GeometryCollection') {
				options.controls.line_string = true;
				options.controls.polygon = true;
				options.controls.point = true;
				options.controls.trash = true;
				return options;
			} else {
				const base = snakeCase(type.replace('Multi', ''));
				options.controls[base] = true;
				options.controls.trash = true;
				return options;
			}
		}

		function addInitialValue() {
			try {
				controls.draw.deleteAll();
				const initialValue = parse(props);
				const flattened = flatten(initialValue);
				for (const geometry of flattened) {
					controls.draw.add(geometry);
				}
				currentGeometry = getDrawGeometry();
				currentGeometry!.bbox = getBBox(currentGeometry!);
				if (props.fitBounds) {
					fitDataBounds({ duration: 0 });
				}
			} catch (error) {
				geometryParsingError.value = error;
			}
		}

		function getDrawGeometry(): Geometry | null {
			const features = controls.draw.getAll().features;
			const geometries = features.map((f) => f.geometry) as _Geometry[];
			if (geometries.length == 0) {
				return null;
			} else if (geometryType == 'GeometryCollection') {
				if (geometries.length > 1) {
					return { type: 'GeometryCollection', geometries };
				}
				return geometries[0];
			} else if (geometryType.startsWith('Multi')) {
				const coordinates = geometries
					.filter(({ type }) => `Multi${type}` == geometryType)
					.map(({ coordinates }) => coordinates);
				return { type: geometryType, coordinates } as Geometry;
			} else {
				const geometry = geometries[geometries.length - 1];
				controls.draw.deleteAll();
				controls.draw.add(geometry!);
				return geometry;
			}
		}

		function handleDrawUpdate() {
			currentGeometry = getDrawGeometry();
			currentGeometry!.bbox = getBBox(currentGeometry!);
			if (!currentGeometry) {
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
			opacity: 0.15;
			// pointer-events: none;
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
</style>
