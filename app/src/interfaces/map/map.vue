<template>
	<div class="interface-map">
		<div class="map" ref="container" :class="{ error }"></div>
		<div v-if="error" class="info">
			<v-info
				v-if="!canRenderBackground"
				icon="vpn_key"
				center
				type="warning"
				:title="$t('interfaces.map.no_api_key')"
			></v-info>
			<v-info v-if="geometryCompatibilityError" icon="error" center type="warning" title="Incompatible geometry">
				<template #append>
					<v-button small @click="resetGeometry" class="reset-preset">Reset Geometry</v-button>
				</template>
			</v-info>
			<v-info v-if="geometryParsingError" icon="error" center type="error" title="Couldn't parse geometry">
				<template #append>
					<v-button small @click="resetGeometry" class="reset-preset">Reset Geometry</v-button>
				</template>
			</v-info>
		</div>
	</div>
</template>

<script lang="ts">
import {
	computed,
	defineComponent,
	onMounted,
	onUnmounted,
	PropType,
	ref,
	toRefs,
	watch,
	watchEffect,
} from '@vue/composition-api';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { Feature, FeatureCollection, Geometry, GeometryCollection, BBox } from 'geojson';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import maplibre, {
	MapLayerMouseEvent,
	LngLatBoundsLike,
	GeoJSONSource,
	AnimationOptions,
	CameraOptions,
	LngLatLike,
	Source,
	Style,
	Map,
	Marker,
	LngLat,
	IControl,
} from 'maplibre-gl';
import { ButtonControl } from '@/layouts/map/components/map.vue';
import { sources, mapbox_sources } from '@/layouts/map/styles/sources';
import { getParser, getSerializer, assignBBox } from '@/layouts/map/lib';
import type { GeometryFormat, AnyGeoJSON } from '@/layouts/map/lib';
import { snakeCase } from 'lodash';
import getSetting from '@/utils/get-setting';
import style from './style';

import { Position, Point, Polygon, LineString, MultiPoint, MultiPolygon, MultiLineString } from 'geojson';
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
		projection: {
			type: String,
			default: 'EPSG:4326',
		},
		background: {
			type: String,
			default: 'CartoDB_PositronNoLabels',
		},
		geometryType: {
			type: String as PropType<_GeometryType>,
			default: 'Point',
		},
		geometryFormat: {
			type: String as PropType<GeometryFormat>,
			required: true,
		},
		multiGeometry: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		const apiKey = getSetting('mapbox_key');
		if (apiKey !== null) maplibre.accessToken = apiKey;

		let map: Map;
		let currentGeometry: _Geometry | null | undefined;

		const canRenderBackground = computed(() => props.background in mapbox_sources === false || apiKey !== null);
		const geometryParsingError = ref(false);
		const geometryCompatibilityError = ref(false);
		const error = computed(
			() => !canRenderBackground.value || geometryParsingError.value || geometryCompatibilityError.value
		);

		const geometryOptions = {
			geometrySRID: props.projection,
			geometryFormat: props.geometryFormat,
			geometryField: 'value',
		};

		const parse = getParser(geometryOptions);
		const serialize = getSerializer(geometryOptions);

		onMounted(() => {
			const cleanup = setupMap();
			onUnmounted(cleanup);
		});

		function resetGeometry() {
			emit('input', null);
			geometryCompatibilityError.value = false;
			geometryParsingError.value = false;
		}

		return {
			container,
			error,
			canRenderBackground,
			geometryParsingError,
			geometryCompatibilityError,
			resetGeometry,
		};

		function setupMap(): () => void {
			if (container.value === null) {
				return () => {};
			}

			const background = canRenderBackground.value ? props.background : 'CartoDB_PositronNoLabels';

			map = new Map({
				container: container.value,
				style:
					background in mapbox_sources
						? mapbox_sources[background]
						: {
								version: 8,
								glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
								sprite: 'https://cdn.jsdelivr.net/gh/Oreilles/material-design-mapbox-sprite/sprites/regular',
								layers: [
									{
										id: background,
										source: background,
										type: 'raster',
									},
								],
								sources,
						  },
				center: [props.longitude, props.latitude],
				zoom: props.zoom,
				attributionControl: false,
			});

			const fitDataControl = new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds);
			const draw = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					trash: true,
					[snakeCase(props.geometryType)]: true,
				},
				styles: style,
			});
			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			map.addControl(fitDataControl, 'top-left');
			map.addControl(draw as IControl, 'top-left');

			map.on('load', () => {
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

			function addInitialValue() {
				if (!props.value) return;
				try {
					const initialValue = parse(props) as _Geometry | undefined;
					if (initialValue) {
						const uncombined = uncombine(initialValue as _MultiGeometry);
						if (uncombined.length == 0 || (uncombined.length > 1 && !props.multiGeometry)) {
							console.log('invalid geometry');
							geometryCompatibilityError.value = true;
							return;
						}
						uncombined.forEach((geometry) => {
							draw.add(geometry);
						});
						getCurrentGeometry();
						fitDataBounds({ duration: 0 });
					}
				} catch (error) {
					console.log('parsing error');
					geometryParsingError.value = true;
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
					return geometries;
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
					currentGeometry = geometries[0];
					draw.deleteAll();
					draw.add(currentGeometry!);
				}
				console.log(currentGeometry);
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
					map.fitBounds(currentGeometry.bbox! as LngLatBoundsLike, { padding: 80, ...options });
				}
			}
		}
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl .mapbox-gl-draw_point::after {
	content: '\ef3a'; // add_location
}
.mapboxgl-ctrl .mapbox-gl-draw_line::after {
	content: '\e922'; // timeline
}
.mapboxgl-ctrl .mapbox-gl-draw_polygon::after {
	content: '\e574'; // category
}
.mapboxgl-ctrl .mapbox-gl-draw_trash::after {
	content: '\e872'; // delete
}
.mapboxgl-ctrl .mapbox-gl-draw_uncombine::after {
	content: '\e14e'; // content_cut
}
// .mapboxgl-map.mouse-add .mapboxgl-canvas-container.mapboxgl-interactive {
// 	cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 24 24" fill="%23000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 1v3h3v2h-3v3h-2V6h-3V4h3V1h2zm-8 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm2-9.75V7h3v3h2.92c.05.39.08.79.08 1.2 0 3.32-2.67 7.25-8 11.8-5.33-4.55-8-8.48-8-11.8C4 6.22 7.8 3 12 3c.68 0 1.35.08 2 .25z"/></svg>'), auto !important;
// }
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

	.info {
		position: absolute;
		top: 0;
		z-index: 10;
		width: 100%;
		height: 100%;

		.v-info {
			padding: 20px;
			background-color: var(--background-subdued);
			border-radius: var(--border-radius);
			box-shadow: var(--card-shadow);
		}
	}
}
</style>
