<template>
	<div class="interface-map">
		<div class="map" ref="container"></div>
		<div v-if="!canRenderBackground" class="error">
			<v-info icon="vpn_key" center type="warning" :title="$t('interfaces.map.no_api_key')"></v-info>
		</div>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, watch, watchEffect } from '@vue/composition-api';
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
	Point,
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
import proj4 from 'proj4';
import { merge, clone } from 'lodash';
import { useSettingsStore } from '@/stores';
import getSetting from '@/utils/get-setting';
import { coordEach } from '@turf/meta';
import style from './style';

function areGeometryTypesCompatible(a: string, b: string) {
	return a.replace('Multi', '') == b.replace('Multi', '');
}

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
		geometry: {
			type: String,
			default: 'point',
		},
		geometryFormat: {
			type: String as PropType<GeometryFormat>,
			required: true,
		},
		multipleGeometries: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;
		let apiKey = getSetting('mapbox_key');
		if (apiKey !== null) maplibre.accessToken = apiKey;
		let currentGeometry: Geometry | null | undefined;
		let lastDrawMode: string;

		const canRenderBackground = computed(() => props.background in mapbox_sources === false || apiKey !== null);

		const geometryOptions = {
			geometrySRID: props.projection,
			geometryFormat: props.geometryFormat,
			geometryField: 'value',
		};

		const parse = getParser(geometryOptions);
		const serialize = getSerializer(geometryOptions);

		onMounted(() => {
			setupMap();
		});

		return { container, canRenderBackground };

		function setupMap() {
			if (container.value === null) return;

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

			let draw = new MapboxDraw({
				displayControlsDefault: false,
				controls: {
					trash: true,
					[props.geometry]: true,
					uncombine_features: props.multipleGeometries,
				},
				styles: style,
			});
			map.addControl(new maplibre.NavigationControl(), 'top-left');
			map.addControl(new maplibre.GeolocateControl(), 'top-left');
			const fitDataControl = new ButtonControl('mapboxgl-ctrl-fitdata', fitDataBounds);
			map.addControl(fitDataControl, 'top-left');
			map.addControl(draw as IControl, 'top-left');

			map.on('load', () => {
				currentGeometry = parse(props) as Geometry;
				if (currentGeometry) {
					draw.add(currentGeometry);
					getCurrentGeometry();
					fitDataBounds({ duration: 0, zoom: props.zoom });
				}
				map.on('draw.create', handleDrawUpdate);
				map.on('draw.delete', handleDrawUpdate);
				map.on('draw.update', handleDrawUpdate);
			});

			function getCurrentGeometry() {
				let features = draw.getAll().features;
				if (features.length == 0) {
					return null;
				}
				if (props.multipleGeometries) {
					draw.changeMode('simple_select', {
						featureIds: features.map((f) => f.id) as string[],
					});
					draw.combineFeatures();
					features = draw.getAll().features;
					currentGeometry = features[0].geometry;
					draw.uncombineFeatures();
					draw.changeMode('simple_select', {
						featureIds: [],
					});
					features = draw.getAll().features;
				} else {
					currentGeometry = features[0].geometry;
					draw.deleteAll();
					draw.add(currentGeometry!);
				}
				assignBBox(currentGeometry);
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
.mapboxgl-ctrl .mapbox-gl-draw_ctrl-draw-btn::after {
	display: flex;
	justify-content: center;
	font-size: 24px;
	font-family: 'Material Icons Outline', sans-serif;
	font-style: normal;
	font-variant: normal;
	text-rendering: auto;
	-webkit-font-smoothing: antialiased;
}
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
</style>

<style lang="scss" scoped>
.interface-map {
	.map {
		position: relative;
		width: 100%;
		height: 500px;
	}

	.error {
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
