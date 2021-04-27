<template>
	<div class="interface-map">
		<div class="map" ref="container" :class="{ error: !!geometryParsingError }"></div>
		<v-info
			v-if="geometryParsingError"
			icon="error"
			center
			type="danger"
			:title="$t('interfaces.map.incompatible_geometry')"
		>
			<v-notice type="danger" :icon="false">
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
import { Position, Point, Polygon, LineString, MultiPoint, MultiPolygon, MultiLineString, BBox } from 'geojson';
import { ButtonControl, BasemapSelectControl } from '@/layouts/map/controls';
import { getParser, getSerializer, assignBBox } from '@/layouts/map/lib';
import { GeometryFormat, AnyGeoJSON } from '@/layouts/map/lib';
import { snakeCase } from 'lodash';
import drawStyle from './style';
import i18n from '@/lang';

const MARKER_ICON_URL =
	'https://cdn.jsdelivr.net/gh/google/material-design-icons/png/maps/place/materialicons/24dp/1x/baseline_place_black_24dp.png';

type _GeometryType = 'Point' | 'Polygon' | 'LineString' | 'MultiPoint' | 'MultiPolygon' | 'MultiLineString';
type _SimpleGeometry = Point | Polygon | LineString;
type _MultiGeometry = MultiPoint | MultiPolygon | MultiLineString;
type _Geometry = _SimpleGeometry | _MultiGeometry;

function bboxCenter(bbox: BBox) {
	return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

export default defineComponent({
	props: {
		value: {
			type: [Object, Array, String] as PropType<any>,
			default: null,
		},
		longitude: {
			type: Number,
			default: -73.94896388,
		},
		loading: {
			type: Boolean,
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
		geometryType: {
			type: String as PropType<_GeometryType>,
			default: 'Point',
		},
		geometryFormat: {
			type: String as PropType<GeometryFormat>,
			required: true,
		},
		geometryCRS: {
			type: String,
			default: 'EPSG:4326',
		},
		multiGeometry: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		let currentGeometry: _Geometry | null | undefined;

		const geometryParsingError = ref<string | null>();

		const geometryOptions = {
			geometryCRS: props.geometryCRS,
			geometryFormat: props.geometryFormat,
			geometryField: 'value',
		};

		const parse = getParser(geometryOptions);
		const serialize = getSerializer(geometryOptions);

		const snakeGeometryType = snakeCase(props.geometryType);
		const mapboxDrawArgs = {
			displayControlsDefault: false,
			controls: {
				trash: true,
				[snakeGeometryType]: true,
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
			resetInterface,
		};

		function setupMap(): () => void {
			map = new Map({
				container: container.value!,
				style: { version: 8, layers: [] },
				center: [props.longitude, props.latitude],
				zoom: props.zoom,
				attributionControl: false,
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
				await addMarkerImage().catch(() => {});
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
				if (!props.value) return;
				try {
					const initialValue = parse(props) as _Geometry | undefined;
					const uncombined = uncombine(initialValue as _MultiGeometry);
					if (uncombined.length > 1 && !props.multiGeometry) {
						throw new Error(i18n.t('interfaces.map.expected_single_geometry') as string);
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
					type: `Multi${props.geometryType}` as _GeometryType,
					coordinates: [] as (Position | Position[] | Position[][])[],
				};
				for (const { type, coordinates } of geometries) {
					if (type == props.geometryType) {
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
				if (geometry.type !== `Multi${props.geometryType}`) {
					throw new Error(
						i18n.t('interfaces.map.expected_other_geometry', {
							expected: props.geometryType,
							found: geometry.type,
						}) as string
					);
				}
				for (const coordinates of geometry.coordinates) {
					geometries.push({
						type: props.geometryType,
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
				} else if (props.multiGeometry) {
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
						maxZoom: props.zoom,
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
