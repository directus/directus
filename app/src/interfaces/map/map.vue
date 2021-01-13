<template>
	<div :class="{ map: true, disabled: disabled }">
		<v-dialog :active="!!myLocationError" :persistent="true">
			<v-card>
				<v-card-title></v-card-title>
				<v-card-text>
					{{ myLocationError }}
				</v-card-text>
				<v-card-actions>
					<v-button @click="myLocationError = null">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<address-to-code v-if="addressToCode" :disabled="disabled" @select="onAddressSelected" />

		<div :style="{ height: height + 'px' }" ref="mapElement"></div>
	</div>
</template>

<script lang="ts">
import i18n from '@/lang';
import { defineComponent, onMounted, onUnmounted, ref, watch } from '@vue/composition-api';
import { debounce } from 'lodash';
import * as L from 'leaflet';
// Fix wrong build because of webpack.
// https://github.com/Leaflet/Leaflet/issues/4968
// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import AddressToCode from './address-to-code.vue';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: leafletIconRetinaUrl,
	iconUrl: leafletIconUrl,
	shadowUrl: leafletIconShadowUrl,
});

export default defineComponent({
	components: { AddressToCode },
	props: {
		value: {
			default: null,
		},
		lat: {
			type: Number,
			default: 40.72803624,
		},
		lng: {
			type: Number,
			default: -73.94896388,
		},
		zoom: {
			type: Number,
			default: 12,
		},
		maxZoom: {
			type: Number,
			default: 17,
		},
		addressToCode: {
			type: Boolean,
			default: false,
		},
		height: {
			type: Number,
			default: 400,
		},
		theme: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit, attrs }) {
		const mapElement = ref<HTMLElement | null>(null);
		const mapInstance = ref<L.Map | null>(null);
		const markers = ref<L.Marker[]>([]);
		const myLocationError = ref<string | null>(null);
		const tilesUrl = props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

		onMounted(initMap);

		onUnmounted(() => {
			if (mapInstance.value) {
				mapInstance.value.remove();
			}
		});

		watch(
			() => props.value,
			debounce((newValue, oldValue) => {
				if (newValue === oldValue) return;

				renderValue(newValue);

				if (!oldValue) {
					centerMap();
				}
			}, 60)
		);

		watch(
			() => markers.value,
			(newValue, oldValue) => {
				if (!mapInstance.value || newValue === oldValue) return;

				if (oldValue) {
					oldValue.forEach((marker: L.Marker) => marker.removeFrom(mapInstance.value as L.Map));
				}

				if (newValue) {
					newValue.forEach((marker: L.Marker) => marker.addTo(mapInstance.value as L.Map));
				}
			}
		);

		return {
			onAddressSelected,
			mapElement,
			myLocationError,
		};

		function onAddressSelected(coords: any) {
			if (!mapInstance.value) return;
			mapInstance.value.flyTo(coords as L.LatLngExpression, props.zoom);
		}

		function initMap() {
			mapInstance.value = L.map(mapElement.value as HTMLElement, {
				center: [props.lat, props.lng],
				zoom: props.zoom,
				preferCanvas: true,
				attributionControl: true,
				zoomControl: true,
				maxZoom: props.maxZoom,
			});

			const attribution = ['&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'];
			if (/stamen/.test(props.theme)) {
				attribution.push(
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>'
				);
			} else if (/opentopomap/.test(props.theme)) {
				attribution.push('© <a href="https://opentopomap.org">opentopomap.org</a>');
			} else if (props.theme) {
				attribution.push('© <a href="https://carto.com/about-carto/">CARTO</a>');
			}

			mapInstance.value.addLayer(
				L.tileLayer(tilesUrl, {
					attribution: attribution.join(' | '),
				})
			);

			const fitMarkersInMapControll = L.DomUtil.create(
				'a',
				'directus-leaflet-custom-button',
				mapInstance.value.zoomControl.getContainer()
			);
			fitMarkersInMapControll.title = i18n.t('interfaces.map.fit-points').toString();
			fitMarkersInMapControll.innerHTML = '<i class="icon">center_focus_strong</i>';
			fitMarkersInMapControll.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				centerMap();
			});

			const controlMyLocationControll = L.DomUtil.create(
				'a',
				'directus-leaflet-custom-button',
				mapInstance.value.zoomControl.getContainer()
			);
			controlMyLocationControll.title = i18n.t('interfaces.map.my-location').toString();
			controlMyLocationControll.innerHTML = '<i class="icon">my_location</i>';
			controlMyLocationControll.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				if (L.DomUtil.hasClass(controlMyLocationControll, 'loading')) return;
				L.DomUtil.addClass(controlMyLocationControll, 'loading');
				(mapInstance.value as L.Map).locate({ enableHighAccuracy: true });
			});

			mapInstance.value
				.on('locationfound', (event: L.LocationEvent) => {
					const suggestedZoomLevel = 13 + (4 - Math.round(Math.min(200, event.accuracy || 100) / 50));
					event.target.flyTo(event.latlng, suggestedZoomLevel);
					L.DomUtil.removeClass(controlMyLocationControll, 'loading');
				})
				.on('locationerror', (error: L.ErrorEvent) => {
					controlMyLocationControll.classList.remove('loading');
					L.DomUtil.removeClass(controlMyLocationControll, 'loading');
					if (error.code === 1) {
						myLocationError.value = i18n.t('interfaces.map.user-location-error-blocked').toString();
					} else {
						myLocationError.value = i18n.t('interfaces.map.user-location-error').toString();
					}
				});

			const controlAddMarkerControll = L.DomUtil.create(
				'a',
				'directus-leaflet-custom-button add-point',
				mapInstance.value.zoomControl.getContainer()
			);
			controlAddMarkerControll.title = i18n.t('interfaces.map.add-point').toString();
			controlAddMarkerControll.innerHTML = '<i class="icon">add_location_alt</i>';
			controlAddMarkerControll.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				registerNewMarker();
			});

			renderValue(props.value);
			centerMap();
		}

		function renderValue(value: any) {
			if (!mapInstance.value) return;

			markers.value = [];
			if (attrs.type === 'string') {
				if (value) {
					const center = value
						.split(',')
						.map((i: string) => parseFloat(i))
						.slice(0, 2)
						.reverse();
					if (!isNaN(center[1]) && !isNaN(center[0])) {
						createMarker(center);
					}
				}
			} else if (attrs.type === 'json') {
				if (Array.isArray(value?.coordinates)) {
					for (const point of value.coordinates) {
						createMarker(point as L.LatLngTuple);
					}
				} else if (value?.type === 'FeatureCollection' && Array.isArray(value?.features)) {
					for (const point of value.features) {
						if (point?.geometry?.type === 'Point') {
							createMarker([point.geometry.coordinates[1], point.geometry.coordinates[0]]);
						}
					}
				}
			}
		}

		function registerNewMarker() {
			const center = mapInstance.value?.getCenter();
			if (!center) return;

			if (attrs.type === 'json') {
				createMarker([center.lat, center.lng]);
			} else {
				markers.value = [];
				createMarker([center.lat, center.lng]);
			}
			emitValue();
		}

		function createMarker(latlng: L.LatLngTuple) {
			const marker = L.marker(latlng, {
				draggable: !props.disabled,
				riseOnHover: true,
			});

			const popup = L.DomUtil.create('div');
			popup.innerHTML = `
				<div>${i18n.t('interfaces.map.lat')}: ${latlng[0]}</div>
				<div>${i18n.t('interfaces.map.lng')}: ${latlng[1]}</div>`;

			if (!props.disabled) {
				const deleteLink = L.DomUtil.create('button', 'directus-leaflet-delete-marker', popup);
				deleteLink.innerText = i18n.t('delete').toString();
				deleteLink.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					markers.value = markers.value.filter((m) => m !== marker);
					emitValue();
				});
				marker.on('moveend', emitValue);
			}

			marker.bindPopup(popup);
			markers.value.push(marker);
		}

		function centerMap() {
			if (!mapInstance.value) return;

			if (!markers.value.length) {
				mapInstance.value.setView([props.lat, props.lng], props.zoom);
			} else if (markers.value.length === 1) {
				mapInstance.value.setView(markers.value[0].getLatLng(), props.zoom);
			} else {
				mapInstance.value.fitBounds(L.featureGroup(markers.value).getBounds());
			}
		}

		function emitValue() {
			if (props.disabled) return;

			if (markers.value.length > 0) {
				if (attrs.type === 'string') {
					const markerPosition = markers.value[0].getLatLng();
					emit('input', markerPosition.lng + ',' + markerPosition.lat);
				} else {
					emit('input', L.featureGroup(markers.value).toGeoJSON());
				}
			} else {
				emit('input', null);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@keyframes spin {
	100% {
		transform: rotate(360deg);
	}
}

.map {
	position: relative;
	z-index: 1;
}

::v-deep {
	.directus-leaflet-custom-button {
		font-size: 1em;
		cursor: pointer;

		.icon {
			display: inline-block;
			font-size: 1.53em;
			/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
			font-family: 'Material Icons';
			font-style: normal;
			-webkit-font-feature-settings: 'liga';
			font-feature-settings: 'liga';
		}
		&.loading .icon {
			animation: spin 1.5s infinite;
			animation-timing-function: linear;
		}
	}

	.leaflet-control-zoom-in,
	.leaflet-control-zoom-out,
	.directus-leaflet-custom-button {
		color: var(--v-list-color);
		background-color: var(--background-normal);
		border-color: var(--border-normal);

		&:hover {
			color: var(--v-list-color);
			background-color: var(--v-list-background-color-hover);
			border-color: var(--border-normal);
		}
	}

	.directus-leaflet-delete-marker {
		display: block;
		min-width: var(--v-button-min-width);
		margin: 12px auto;
		color: var(--danger);
		font-weight: var(--v-button-font-weight);
		line-height: var(--v-button-line-height);
		text-align: center;
		background: var(--danger-25);
		border-radius: var(--border-radius);
		&:hover {
			color: var(--danger);
			background: var(--danger-50);
		}
	}

	.leaflet-popup-tip,
	.leaflet-popup-content-wrapper {
		color: var(--foreground-inverted);
		background-color: var(--background-inverted);
	}

	.leaflet-popup-content-wrapper {
		padding: 4px 8px;
		border-radius: 4px;
		transition: opacity 200ms;
	}

	.leaflet-container .leaflet-popup-close-button {
		color: var(--foreground-inverted);

		&:hover {
			color: var(--foreground-subdued);
		}
	}
}

.map.disabled ::v-deep .directus-leaflet-custom-button.add-point {
	color: var(--foreground-subdued);
	pointer-events: none;
}
</style>
