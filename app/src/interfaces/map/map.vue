<template>
	<div class="map">
		<v-notice v-if="feedback" class="full" type="warning">
			<a @click="clearFeedback">
				{{ feedback }}
			</a>
		</v-notice>
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

import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix wrong build because of webpack.
// https://github.com/Leaflet/Leaflet/issues/4968
import leafletIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import leafletIconUrl from 'leaflet/dist/images/marker-icon.png';
import leafletIconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import i18n from "@/lang";

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
		const feedback = ref<string | null>(null);
		const mapInstance = ref<any>(null);
		const showAddressToCode = ref<boolean>(false);
		const addressToCodeLatestFound = ref<Record<string, any> | null>(null);
		const markers = ref<L.MarketType[]>([]);
		const selectedMarker = ref<L.MarketType | null>(null);
		const singleMarker = ref<L.MarketType | null>(null);
		const tilesUrl = props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

		onMounted(initMap);

		onUnmounted(() => {
			mapInstance.value.remove();
		});

		window.feedback = feedback;

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
			feedback,
			clearFeedback,
		};

		function initMap() {
			mapInstance.value = L.map(mapElement.value, {
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
				'directus-leaflet-custom-button-icon',
				mapInstance.value.zoomControl.getContainer()
			);
			controlMyLocation.innerText = 'my_location';
			controlMyLocation.addEventListener('click', (event: MouseEvent) => {
				event.preventDefault();
				if (event.target.classList.contains('loading')) {
					return;
				}
				event.target.classList.add('loading');
				navigator.geolocation.getCurrentPosition(
					(success) => {
						event.target.classList.remove('loading');
						// Set some fancy zoom level based on accuracy.
						const zoom = 13 + (4 - Math.round(Math.min(200, parseInt(success.accuracy || 100)) / 50));
						mapInstance.value.setView([success.coords.latitude, success.coords.longitude], zoom);
					},
					(error) => {
						event.target.classList.remove('loading');
						if (error.code === 1) {
							feedback.value = i18n.t('interfaces.map.user_location_error_blocked');
						} else {
							feedback.value = i18n.t('interfaces.map.user_location_error');
						}
					}
				);
			});

			if (props.addressToCode) {
				const controlLocationByAddress = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapInstance.value.zoomControl.getContainer()
				);
				controlLocationByAddress.innerText = 'search';
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
					'directus-leaflet-custom-button-icon',
					mapInstance.value.zoomControl.getContainer()
				);
				controlMoveSinglePin.innerText = 'location_on';
				controlMoveSinglePin.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					singleMarker.value.setLatLng(mapInstance.value.getCenter());
					emitValue();
				});

				singleMarker.value = L.marker([props.lat, props.lng], { draggable: true });
				singleMarker.value.addTo(mapInstance.value);
				singleMarker.value.on('moveend', () => emitValue());
			} else if (props.mode === 'pins') {
				const controlAddMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapInstance.value.zoomControl.getContainer()
				);
				controlAddMarker.innerText = 'add_location';
				controlAddMarker.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					addMarker(mapInstance.value.getCenter());
					emitValue();
				});

				const controlRemoveMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapInstance.value.zoomControl.getContainer()
				);
				controlRemoveMarker.innerText = 'location_off';
				controlRemoveMarker.style.display = 'none';
				controlRemoveMarker.addEventListener('click', (event: MouseEvent) => {
					event.preventDefault();
					if (selectedMarker.value) {
						const inArrayIndex = markers.value.indexOf(selectedMarker.value);
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
						controlRemoveMarker.style.display = !!selectedMarker.value ? null : 'none';
					}
				);
			}

			if (props.value) {
				updateMap(props.value);
			}
		}

		function addressToCodeKeyHandler(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				showAddressToCode.value = false;
			} else if (event.key === 'Enter' && event.target.value && addressToCodeLatestFound.value) {
				mapInstance.value.setView(addressToCodeLatestFound.value, 15);
			}
		}

		function updateMap(value: any) {
			mapInstance.value.setView([value.lat, value.lng], value.zoom);
			markers.value.forEach((markerItem) => {
				markerItem.value.remove();
			});

			if (props.mode === 'pins') {
				if (value.markers) {
					value.markers.forEach(addMarker);
				}
			} else if (props.mode === 'pin') {
				singleMarker.value.setLatLng([value.lat, value.lng]);
			}

			selectedMarker.value = null;
		}

		function addMarker(latlng: any[]) {
			const marker = L.marker(latlng, { draggable: true });
			marker.addTo(mapInstance.value);
			marker.on('moveend', () => emitValue());
			marker.on('click', (event: MouseEvent) => {
				selectedMarker.value = event.target;
			});
			markers.value.push(marker);
		}

		function clearFeedback() {
			feedback.value = null;
		}

		function emitValue() {
			const value = {
				zoom: mapInstance.value.getZoom(),
				lat: mapInstance.value.getCenter().lat,
				lng: mapInstance.value.getCenter().lng,
				markers: [],
			};

			if (props.mode === 'pin' && singleMarker.value) {
				value.lat = singleMarker.value.getLatLng().lat;
				value.lng = singleMarker.value.getLatLng().lng;
			} else if (props.mode === 'pins' && markers.value) {
				value.markers = markers.value.map((markerItem: L.MarkerType) => ({
					lat: markerItem.getLatLng().lat,
					lng: markerItem.getLatLng().lng,
				}));
			}

			emit('input', value);
		}

		function addressToCodeHandler(event: MouseEvent) {
			if (event.target.value && event.target.value.trim()) {
				addressToCode(event.target.value);
			}
		}

		function addressToCode(query: string) {
			const url = `https://nominatim.openstreetmap.org/search?q=${encodeURI(query)}&format=json&limit=1`;
			addressToCodeLatestFound.value = null;
			axios
				.get(url)
				.then((response) => {
					if (response.status === 200 && response.data[0]) {
						const latlng = [response.data[0].lat, response.data[0].lon];
						mapInstance.value.setView(latlng);
						addressToCodeLatestFound.value = latlng;
						if (props.mode === 'pin') {
							singleMarker.value.setLatLng(latlng);
						}
					} else {
						feedback.value = i18n.t('interfaces.map.address_to_code_error').toString();
					}
				})
				.catch((error) => {
					feedback.value = error.toString();
				});
		}
	},
});
</script>

<style>
.directus-leaflet-custom-button-icon.loading {
	cursor: wait;
}

.directus-leaflet-custom-button-icon {
	display: inline-block;
	font-size: 1.53em;
	font-family: 'Material Icons';
	cursor: pointer;
	content: 'format_bold';
	-webkit-font-feature-settings: 'liga';
	font-feature-settings: 'liga';
}
</style>

<style lang="scss" scoped>
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
</style>
