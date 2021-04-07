<template>
	<div class="interface-map">
		<div class="map" ref="container"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref } from '@vue/composition-api';
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
	Marker,
} from 'maplibre-gl';
import sources from '@/layouts/map/styles/sources';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		trim: {
			type: Boolean,
			default: true,
		},
		font: {
			type: String as PropType<'sans-serif' | 'serif' | 'monospace'>,
			default: 'sans-serif',
		},
	},
	setup(props, { emit }) {
		const container = ref<HTMLElement | null>(null);
		let map: Map;

		onMounted(() => {
			setupMap();
		});

		return { container };

		function setupMap() {
			if (container.value === null) return;

			maplibre.accessToken = 'hei';

			map = new Map({
				container: container.value,
				style: {
					version: 8,
					glyphs:
						'https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf',
					sprite: 'https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/sprites/osm-liberty',
					layers: [],
					sources,
				},
				center: [12.550343, 55.665957],
				zoom: 8,
				attributionControl: false,
			});

			var marker1 = new Marker().setLngLat([12.554729, 55.70651]).addTo(map);
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
.map {
	position: relative;
	width: 100%;
	height: 500px;
}
</style>
