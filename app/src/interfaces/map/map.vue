<template>
	<div class="map">
		<transition-expand>
			<v-notice v-if="warningMessage" class="full" type="warning">
				<a @click="clearWarningMessage">
					{{ warningMessage }}
				</a>
			</v-notice>
		</transition-expand>
		<div :style="{ height: height + 'px' }" ref="mapElement"></div>
		<div
			v-if="addressToCode"
			class="leaflet-control-container leaflet-top"
			:style="{ display: showAddressToCode ? 'block' : 'none' }"
		>
			<input
				class="leaflet-control address-to-code-control"
				@keyup="addressToCodeKeyHandler"
				@change="addressToCodeHandler"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, watch, ref } from '@vue/composition-api';
import i18n from '@/lang';
import axios from 'axios';

import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix wrong build because of webpack.
// https://github.com/Leaflet/Leaflet/issues/4968

// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconUrl from 'leaflet/dist/images/marker-icon.png';

// @ts-ignore this is marker icon and is not defined in @types/leaflet
import leafletIconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: leafletIconRetinaUrl,
	iconUrl: leafletIconUrl,
	shadowUrl: leafletIconShadowUrl,
});

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: {},
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
		mode: {
			type: String,
			default: 'pin',
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
	},
	setup(props, { emit }) {
		const mapElement = ref<HTMLElement | null>(null);
		const warningMessage = ref<string | null>(null);
		const mapInstance = ref<any>(null);
		const showAddressToCode = ref<boolean>(false);
		const addressToCodeLatestFound = ref<Record<string, any> | null>(null);
		const markers = ref<L.Marker[]>([]);
		const selectedMarker = ref<L.Marker | null>(null);
		const singleMarker = ref<L.Marker | null>(null);
		const tilesUrl = props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

		onMounted(initMap);

		onUnmounted(() => {
			mapInstance.value.remove();
		});

		watch(
			() => props.value,
			(newValue, oldValue) => {
				if (!oldValue && newValue && mapInstance.value) {
					// initialize
					updateMap(newValue);
				}
			}
		);

		return {
			addressToCodeKeyHandler,
			addressToCodeHandler,
			showAddressToCode,
			mapElement,
			warningMessage,
			clearWarningMessage,
		};

		function initMap() {
			mapInstance.value = L.map(mapElement.value as HTMLElement, {
				center: [props.lat, props.lng],
				zoom: props.zoom,
				preferCanvas: true,
				attributionControl: true,
				zoomControl: true,
				maxZoom: props.maxZoom,
			});

			const attribution = [
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			];

			if (/stamen/.test(props.theme)) {
				attribution.push(
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>'
				);
			} else if (props.theme) {
				attribution.push('© <a href="https://carto.com/about-carto/">CARTO</a>');
			}

			L.tileLayer(tilesUrl, {
				attribution: attribution.join(' | '),
			}).addTo(mapInstance.value);

			mapInstance.value.on('zoomend', () => emitValue());
			mapInstance.value.on('moveend', () => emitValue());

			const controlMyLocation = L.DomUtil.create(
				'a',
				'directus-leaflet-custom-button',
				mapInstance.value.zoomControl.getContainer()
			);
			controlMyLocation.innerHTML = '<i class="icon">my_location</i>';
			controlMyLocation.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				const element = event.target as HTMLElement;
				if (element.classList.contains('loading')) {
					return;
				}
				element.classList.add('loading');
				findMyLocation(() => element.classList.remove('loading'));
			});

			if (props.addressToCode) {
				const controlLocationByAddress = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button',
					mapInstance.value.zoomControl.getContainer()
				);
				controlLocationByAddress.innerHTML = '<i class="icon">search</i>';
				controlLocationByAddress.addEventListener('dblclick', (event: MouseEvent) => {
					event.preventDefault();
					event.stopPropagation();
				});
				controlLocationByAddress.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					event.stopPropagation();
					showAddressToCode.value = !showAddressToCode.value;
				});
			}

			if (props.mode === 'pin') {
				const controlMoveSinglePin = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button',
					mapInstance.value.zoomControl.getContainer()
				);
				controlMoveSinglePin.innerHTML = '<i class="icon">location_on</i>';
				controlMoveSinglePin.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					if (singleMarker.value) {
						singleMarker.value.setLatLng(mapInstance.value.getCenter());
					}
					emitValue();
				});

				singleMarker.value = L.marker([props.lat, props.lng], { draggable: true });
				singleMarker.value.addTo(mapInstance.value);
				singleMarker.value.on('moveend', () => emitValue());
			} else if (props.mode === 'pins') {
				const controlAddMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button',
					mapInstance.value.zoomControl.getContainer()
				);
				controlAddMarker.innerHTML = '<i class="icon">add_location</i>';
				controlAddMarker.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					addMarker(mapInstance.value.getCenter());
					emitValue();
				});

				const controlRemoveMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button',
					mapInstance.value.zoomControl.getContainer()
				);
				controlRemoveMarker.innerHTML = '<i class="icon">location_off</i>';
				controlRemoveMarker.style.display = 'none';
				controlRemoveMarker.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					if (selectedMarker.value) {
						const inArrayIndex = markers.value.indexOf(selectedMarker.value as L.Marker);
						if (inArrayIndex > -1) {
							markers.value.splice(inArrayIndex, 1);
						}
						selectedMarker.value.remove();
						selectedMarker.value = null;
						emitValue();
					}
				});

				watch(
					() => selectedMarker.value,
					() => {
						controlRemoveMarker.style.display = !!selectedMarker.value ? 'block' : 'none';
					}
				);
			}

			if (props.value) {
				updateMap(props.value);
			}
		}

		function addressToCodeKeyHandler(event: KeyboardEvent) {
			const element = event.target as HTMLInputElement;
			if (event.key === 'Escape') {
				showAddressToCode.value = false;
			} else if (event.key === 'Enter' && element.value && addressToCodeLatestFound.value) {
				mapInstance.value.setView(addressToCodeLatestFound.value, props.zoom);
			}
		}

		function updateMap(value: any) {
			if (!('lat' in value) || !('lng' in value)) {
				return;
			}

			mapInstance.value.setView([value.lat, value.lng], value.zoom || 10);
			markers.value.forEach((markerItem) => {
				markerItem.remove();
			});

			if (props.mode === 'pins') {
				if (value.markers) {
					value.markers.forEach(addMarker);
				}
			} else if (props.mode === 'pin' && singleMarker.value) {
				singleMarker.value.setLatLng([value.lat, value.lng]);
			}

			selectedMarker.value = null;
		}

		function addMarker(latlng: L.LatLngTuple) {
			const marker = L.marker(latlng, { draggable: true });
			marker.addTo(mapInstance.value);
			marker.on('moveend', () => emitValue());
			marker.on('click', (event: L.LeafletEvent) => {
				selectedMarker.value = event.target as L.Marker;
			});
			markers.value.push(marker);
		}

		function clearWarningMessage() {
			warningMessage.value = null;
		}

		function emitValue() {
			const value: {
				zoom: number;
				lat: number;
				lng: number;
				markers: L.LatLngLiteral[];
			} = {
				zoom: mapInstance.value.getZoom(),
				lat: mapInstance.value.getCenter().lat,
				lng: mapInstance.value.getCenter().lng,
				markers: [],
			};

			if (props.mode === 'pin' && singleMarker.value) {
				value.lat = singleMarker.value.getLatLng().lat;
				value.lng = singleMarker.value.getLatLng().lng;
			} else if (props.mode === 'pins' && markers.value) {
				value.markers = markers.value.map(
					(markerItem: L.Marker) =>
						({
							lat: markerItem.getLatLng().lat,
							lng: markerItem.getLatLng().lng,
						} as L.LatLngLiteral)
				);
			}

			emit('input', value);
		}

		function addressToCodeHandler(event: MouseEvent) {
			const element = event.target as HTMLInputElement;
			if (element.value && element.value.trim()) {
				addressToCode(element.value);
			}
		}

		function findMyLocation(onFinish: CallableFunction | null = null) {
			mapInstance.value
				.locate({ enableHighAccuracy: true })
				.on('locationfound', (event: any) => {
					const zoom = 13 + (4 - Math.round(Math.min(200, parseInt(event.accuracy || 100)) / 50));
					if (props.mode === 'pin' && singleMarker.value) {
						(singleMarker.value as L.Marker).setLatLng(event.latlng);
					}
					mapInstance.value.flyTo(event.latlng, zoom);
					if (onFinish) {
						onFinish();
					}
				})
				.on('locationerror', (error: any) => {
					if (onFinish) {
						onFinish();
					}
					if (error.code === 1) {
						warningMessage.value = i18n.t('interfaces.map.user-location-error-blocked').toString();
					} else {
						warningMessage.value = i18n.t('interfaces.map.user-location-error').toString();
					}
				});
		}

		function addressToCode(query: string) {
			const url = `https://nominatim.openstreetmap.org/search?q=${encodeURI(query)}&format=json&limit=1`;
			addressToCodeLatestFound.value = null;
			axios
				.get(url)
				.then((response) => {
					if (response.status === 200 && response.data[0]) {
						const latlng: L.LatLngTuple = [response.data[0].lat, response.data[0].lon];
						mapInstance.value.setView(latlng, mapInstance.value.getZoom());
						addressToCodeLatestFound.value = latlng;
						if (props.mode === 'pin' && singleMarker.value) {
							singleMarker.value.setLatLng(latlng);
						}
					} else {
						warningMessage.value = i18n.t('interfaces.map.address-to-code-error').toString();
					}
				})
				.catch((error) => {
					warningMessage.value = error.toString();
				});
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

.address-to-code-control {
	height: 30px;
	margin-top: 100px;
	margin-left: 50px;
	color: #000;
	line-height: 30px;
	border: 1px solid #aaa;
	outline: none;
}

.map {
	position: relative;
	z-index: 1;
}

::v-deep .directus-leaflet-custom-button {
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

		&.loading {
			cursor: wait;
			animation: spin 1.5s infinite;
			animation-timing-function: linear;
		}
	}
}
</style>
