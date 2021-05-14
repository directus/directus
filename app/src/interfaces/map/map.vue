<template>
	<div class="interface-map">
		<div class="map" ref="container" :class="{ error: geometryParsingError || geometryOptionsError }"></div>
		<v-info v-if="geometryOptionsError" icon="error" center type="danger" :title="$t('interfaces.map.invalid_options')">
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
	</div>
</template>

<script lang="ts">
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { defineComponent, onMounted, onUnmounted, PropType, ref, watch } from '@vue/composition-api';
import maplibre, { LngLatBoundsLike, AnimationOptions, CameraOptions, Map, IControl } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Position, Point, Polygon, LineString, MultiPoint, MultiPolygon, MultiLineString } from 'geojson';
import { ButtonControl, BasemapSelectControl } from '@/layouts/map/controls';
import {
	getParser,
	getSerializer,
	assignBBox,
	GeoJSONParser,
	GeoJSONSerializer,
	GeometryOptions,
} from '@/layouts/map/lib';
import { GeometryFormat } from '@/layouts/map/lib';
import { snakeCase } from 'lodash';
import drawStyle from './style';
import i18n from '@/lang';
import { Field } from '@/types';

const MARKER_ICON_URL =
	'https://cdn.jsdelivr.net/gh/google/material-design-icons/png/maps/place/materialicons/24dp/1x/baseline_place_black_24dp.png';

import { GeometryType } from '@/layouts/map/lib';
type _SimpleGeometry = Point | Polygon | LineString;
type _MultiGeometry = MultiPoint | MultiPolygon | MultiLineString;
type _Geometry = _SimpleGeometry | _MultiGeometry;

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'json' | 'csv' | 'string' | 'text' | 'binary'>,
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
		},
		geometryFormat: {
			type: String as PropType<GeometryFormat>,
		},
		geometryType: {
			type: String as PropType<GeometryType>,
		},
		geometryCRS: {
			type: String as PropType<string | undefined>,
		},
		defaultPosition: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		let currentGeometry: _Geometry | null | undefined;

		const geometryOptionsError = ref<string | null>();
		const geometryParsingError = ref<string | null>();

		const special = props.fieldData?.meta?.special as [string, GeometryFormat, GeometryType, string | undefined];
		const geometryOptions: GeometryOptions = {
			geometryField: 'value',
			geometryFormat: props.geometryFormat || special?.[1],
			geometryType: props.geometryType || special?.[2],
			geometryCRS: props.geometryCRS,
		};

		let parse: GeoJSONParser;
		let serialize: GeoJSONSerializer;
		try {
			parse = getParser(geometryOptions);
			serialize = getSerializer(geometryOptions);
		} catch (error) {
			geometryOptionsError.value = error;
		}

		const drawMode = snakeCase(geometryOptions.geometryType.replace('Multi', ''));
		const mapboxDrawArgs = {
			displayControlsDefault: false,
			controls: {
				trash: true,
				[drawMode]: true,
			},
			styles: drawStyle,
		};

		onMounted(() => {
			const cleanup = setupMap();
			onUnmounted(cleanup);
		});

		function resetInterface() {
			emit('input', null);
			geometryParsingError.value = null;
		}

		return {
			container,
			geometryParsingError,
			geometryOptionsError,
			resetInterface,
		};

		function setupMap(): () => void {
			map = new Map({
				container: container.value!,
				style: { version: 8, layers: [] },
				attributionControl: false,
				...props.defaultPosition,
			});

			let draw = new MapboxDraw(mapboxDrawArgs);
			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			map.addControl(new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds), 'top-left');
			map.addControl(new BasemapSelectControl(), 'top-right');
			map.addControl(draw as IControl, 'top-left');

			function reloadDraw() {
				if (!map.isStyleLoaded()) return;
				addMarkerImage();
				map.off('sourcedata', reloadDraw);
				map.off('styledata', reloadDraw);
				draw = new MapboxDraw(mapboxDrawArgs);
				map.addControl(draw as IControl, 'top-left');
				if (currentGeometry) {
					draw.add(currentGeometry);
				}
			}

			map.on('load', async () => {
				await addMarkerImage().catch();
				map.on('basemapselect', () => {
					map.removeControl(draw);
					map.on('sourcedata', reloadDraw);
					map.on('styledata', reloadDraw);
				});
				map.on('draw.create', handleDrawUpdate);
				map.on('draw.delete', handleDrawUpdate);
				map.on('draw.update', handleDrawUpdate);
				map.once('resize', () => {
					if (props.loading) {
						watch(() => props.loading, addInitialValue);
					} else {
						addInitialValue();
					}
				});
				map.resize();
			});

			return () => {
				map.remove();
			};

			function addMarkerImage() {
				return new Promise((resolve, reject) => {
					map.loadImage(MARKER_ICON_URL, (error: any, image: any) => {
						if (error) reject(error);
						map.addImage('place', image, { sdf: true });
						resolve(true);
					});
				});
			}

			function addInitialValue() {
				if (!props.value) {
					// @ts-ignore
					draw.changeMode(`draw_${drawMode}`);
					return;
				}
				try {
					const initialValue = parse(props) as _Geometry | undefined;
					const uncombined = uncombine(initialValue as _MultiGeometry);
					if (uncombined.length > 1 && !geometryOptions.geometryType.startsWith('Multi')) {
						throw new Error(
							i18n.t('interfaces.map.unexpected_geometry', {
								expected: geometryOptions.geometryType,
								found: `Multi${geometryOptions.geometryType}`,
							}) as string
						);
					}
					uncombined.forEach((geometry) => {
						draw.add(geometry);
					});
					draw.changeMode('simple_select');
					getCurrentGeometry();
					fitDataBounds({ duration: 0 });
				} catch (error) {
					geometryParsingError.value = error;
				}
			}

			function combine(geometries: _SimpleGeometry[]): _MultiGeometry {
				const geometry = {
					type: geometryOptions.geometryType as GeometryType,
					coordinates: [] as (Position | Position[] | Position[][])[],
				};
				for (const { type, coordinates } of geometries) {
					if (`Multi${type}` == geometryOptions.geometryType) {
						geometry.coordinates.push(coordinates);
					}
				}
				return geometry as _MultiGeometry;
			}

			function uncombine(geometry: _MultiGeometry): _SimpleGeometry[] {
				const geometries: _SimpleGeometry[] = [];
				if (!geometry.type.startsWith('Multi')) {
					geometry = {
						type: `Multi${geometry.type}`,
						coordinates: [geometry.coordinates],
					} as _MultiGeometry;
				}
				if (!geometry.type.endsWith(geometryOptions.geometryType)) {
					throw new Error(
						i18n.t('interfaces.map.unexpected_geometry', {
							expected: geometryOptions.geometryType,
							found: geometry.type,
						}) as string
					);
				}
				for (const coordinates of geometry.coordinates) {
					geometries.push({
						type: geometryOptions.geometryType.replace('Multi', ''),
						coordinates,
					} as _SimpleGeometry);
				}
				return geometries;
			}

			function getCurrentGeometry() {
				let geometries = draw.getAll().features.map((f) => f.geometry as _SimpleGeometry);
				if (geometries.length == 0) {
					currentGeometry = null;
					return;
				} else if (geometryOptions.geometryType.startsWith('Multi')) {
					currentGeometry = combine(geometries);
				} else {
					currentGeometry = geometries[geometries.length - 1];
					if (geometries.length > 1) {
						draw.deleteAll();
						draw.add(currentGeometry!);
					}
				}
				assignBBox(currentGeometry!);
			}

			function handleDrawUpdate() {
				getCurrentGeometry();
				if (!currentGeometry) {
					emit('input', null);
				} else {
					emit('input', serialize(currentGeometry));
				}
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
	content: '\e14e'; // content_cut
}
</style>

<style lang="scss" scoped>
.interface-map {
	.map {
		position: relative;
		width: 100%;
		height: 500px;
		&.error {
			opacity: 0.15;
			pointer-events: none;
		}
	}
	.v-info {
		padding: 20px;
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
		box-shadow: var(--card-shadow);
	}
}
</style>
