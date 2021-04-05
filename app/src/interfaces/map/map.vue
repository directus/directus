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

		<div ref="controlElements">
			<a class="directus-leaflet-button" @click.stop="centerMap"><i class="icon">center_focus_strong</i></a>
			<a class="directus-leaflet-button" @click.stop="locatePosition" :class="{ loading: locationLoading }">
				<i class="icon">my_location</i>
			</a>
			<a v-show="canAddMarkers" class="directus-leaflet-button" @click.stop="registerNewMarker">
				<i class="icon">add_location_alt</i>
			</a>
		</div>
	</div>
</template>

<script lang="ts">
import i18n from '@/lang';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, watch } from '@vue/composition-api';
import { debounce, isArray } from 'lodash';
import leaflet, {
	Map,
	Icon,
	Marker,
	LatLngExpression,
	DomUtil,
	LocationEvent,
	ErrorEvent,
	LatLngTuple,
	Point,
	FeatureGroup,
} from 'leaflet';
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
import { FeatureCollection, Point as FeaturePoint } from 'geojson';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;

Icon.Default.mergeOptions({
	iconRetinaUrl: leafletIconRetinaUrl,
	iconUrl: leafletIconUrl,
	shadowUrl: leafletIconShadowUrl,
});

type ModelValue = FeatureCollection | FeaturePoint | [number, number];

export default defineComponent({
	components: { AddressToCode },
	props: {
		value: {
			type: [Object, Array] as PropType<ModelValue>,
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
		maxMarkers: {
			type: Number,
			default: 1,
		},
		type: {
			type: String,
		},
	},
	setup(props, { emit }) {
		const mapElement = ref<HTMLElement | null>(null);
		const controlElements = ref<HTMLElement | null>(null);
		const mapInstance = ref<Map | null>(null);
		const locationLoading = ref(false);
		const markers = ref<Marker[]>([]);
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
					oldValue.forEach((marker) => marker.removeFrom(mapInstance.value as Map));
				}

				if (newValue) {
					newValue.forEach((marker) => marker.addTo(mapInstance.value as Map));
				}
			}
		);

		const canAddMarkers = computed(
			() =>
				(props.type === 'json' && props.maxMarkers > markers.value.length) ||
				(props.type === 'csv' && markers.value.length === 0)
		);

		return {
			onAddressSelected,
			mapElement,
			myLocationError,
			controlElements,
			registerNewMarker,
			centerMap,
			locatePosition,
			locationLoading,
			markers,
			canAddMarkers,
		};

		function onAddressSelected(coords: LatLngExpression) {
			if (!mapInstance.value) return;
			mapInstance.value.flyTo(coords, props.zoom, { duration: 2 });
		}

		function initMap() {
			if (!mapElement.value) return;

			mapInstance.value = leaflet.map(mapElement.value, {
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
				leaflet.tileLayer(tilesUrl, {
					attribution: attribution.join(' | '),
				})
			);

			if (controlElements.value !== null) {
				while (controlElements.value.children.length > 0) {
					const element = controlElements.value.children[0];
					mapInstance.value.zoomControl.getContainer()?.appendChild(element);
				}
			}

			mapInstance.value
				.on('locationfound', (event: LocationEvent) => {
					const suggestedZoomLevel = 13 + (4 - Math.round(Math.min(200, event.accuracy || 100) / 50));
					event.target.flyTo(event.latlng, suggestedZoomLevel);
					locationLoading.value = false;
				})
				.on('locationerror', (error: ErrorEvent) => {
					locationLoading.value = false;
					if (error.code === 1) {
						myLocationError.value = i18n.t('interfaces.map.user-location-error-blocked').toString();
					} else {
						myLocationError.value = i18n.t('interfaces.map.user-location-error').toString();
					}
				});

			renderValue(props.value);
			centerMap();
		}

		function locatePosition() {
			if (!mapInstance.value || locationLoading.value) return;

			locationLoading.value = true;
			mapInstance.value.locate({ enableHighAccuracy: true });
		}

		function renderValue(value: ModelValue) {
			if (!mapInstance.value || !value) return;

			markers.value = [];
			if (props.type === 'csv' && isArray(value)) {
				createMarker([value[1], value[0]]);
			} else if (props.type === 'json' && 'type' in value) {
				if (value.type === 'FeatureCollection' && Array.isArray(value.features)) {
					for (const point of value.features) {
						if (point.geometry.type === 'Point') {
							createMarker([point.geometry.coordinates[1], point.geometry.coordinates[0]]);
						}
					}
				} else if (value.type === 'Point') {
					createMarker([value.coordinates[1], value.coordinates[0]]);
				}
			}
		}

		function registerNewMarker() {
			const center = mapInstance.value?.getCenter();
			if (!center) return;
			if (props.type === 'csv') markers.value = [];

			createMarker([center.lat, center.lng]);
			emitValue();
		}

		function createMarker(latlng: LatLngTuple) {
			const marker = leaflet.marker(latlng, {
				draggable: !props.disabled,
				riseOnHover: true,
			});

			const popup = DomUtil.create('div');
			popup.innerHTML = `
				<div>${i18n.t('interfaces.map.lat')}: ${latlng[0]}</div>
				<div>${i18n.t('interfaces.map.lng')}: ${latlng[1]}</div>`;

			if (!props.disabled) {
				const deleteLink = DomUtil.create('button', 'directus-leaflet-delete-marker', popup);
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
				mapInstance.value.fitBounds(leaflet.featureGroup(markers.value).getBounds());
			}
		}

		function emitValue() {
			if (props.disabled) return;

			if (props.type === 'json') {
				if (markers.value.length == 1)
					return emit('input', {
						type: 'Point',
						coordinates: [markers.value[0].getLatLng().lng, markers.value[0].getLatLng().lat],
					});

				if (markers.value.length > 1) return emit('input', leaflet.featureGroup(markers.value).toGeoJSON());
			} else if (props.type === 'csv' && markers.value.length >= 1) {
				const markerPosition = markers.value[0].getLatLng();
				return emit('input', [markerPosition.lng, markerPosition.lat]);
			}
			emit('input', null);
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
	.directus-leaflet-button {
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
	.directus-leaflet-button {
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
		color: var(--foreground-normal);
		background-color: var(--background-normal);
	}

	.leaflet-popup-content-wrapper {
		padding: 4px 8px;
		border-radius: var(--border-radius);
		transition: opacity 200ms;
	}

	.leaflet-container .leaflet-popup-close-button {
		color: var(--foreground-normal);

		&:hover {
			color: var(--foreground-subdued);
		}
	}
}

.map.disabled ::v-deep .directus-leaflet-button.add-point {
	color: var(--foreground-subdued);
	pointer-events: none;
}
</style>
