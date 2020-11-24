<template>
	<div class="map">
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
		const showAddressToCode = ref<boolean>(false);
		const addressToCodeLatestFound = ref<Record<string, any> | null>(null);
		const markers = ref<L.MarketType[]>([]);
		const selectedMarker = ref(null);
		const singleMarker = ref<L.MarketType | null>(null);
		const tilesUrl = props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

		onMounted(initMap);

		onUnmounted(() => {
			mapElement.value?.map.remove();
		});

		window.xx = {
			emit,
			mapElement,
			singleMarker,
			L,
			addMarker,
			markers,
		};

		watch(
			() => props.value,
			(newValue, oldValue) => {
				if (!oldValue && newValue && mapElement.value?.map) {
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
		};

		function initMap() {
			mapElement.value.map = L.map(mapElement.value, {
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
			}).addTo(mapElement.value.map);

			mapElement.value.map.on('zoomend', () => emitValue());
			mapElement.value.map.on('moveend', () => emitValue());

			const controlMyLocation = L.DomUtil.create(
				'a',
				'directus-leaflet-custom-button-icon',
				mapElement.value.map.zoomControl.getContainer()
			);
			controlMyLocation.innerText = 'my_location';
			controlMyLocation.addEventListener('click', function (event) {
				event.preventDefault();
				if (this.classList.contains('loading')) {
					return;
				}
				this.classList.add('loading');
				navigator.geolocation.getCurrentPosition(
					(success) => {
						this.classList.remove('loading');
						// Set some fancy zoom level based on accuracy.
						const zoom = 13 + (4 - Math.round(Math.min(200, parseInt(success.accuracy) || 100) / 50));
						console.log(
							[success.coords.latitude, success.coords.longitude],
							zoom,
							success.coords,
							success.accuracy
						);
						mapElement.value.map.setView([success.coords.latitude, success.coords.longitude], zoom);
					},
					() => {
						this.classList.remove('loading');
					}
				);
			});

			if (props.addressToCode) {
				const controlLocationByAddress = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapElement.value.map.zoomControl.getContainer()
				);
				controlLocationByAddress.innerText = 'search';
				controlLocationByAddress.addEventListener('dblclick', (event) => {
					event.preventDefault();
					event.stopPropagation();
				});
				controlLocationByAddress.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					showAddressToCode.value = !showAddressToCode.value;
				});
			}

			if (props.mode === 'pin') {
				const controlMoveSinglePin = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapElement.value.map.zoomControl.getContainer()
				);
				controlMoveSinglePin.innerText = 'location_on';
				controlMoveSinglePin.addEventListener('click', (event) => {
					event.preventDefault();
					singleMarker.value.setLatLng(mapElement.value.map.getCenter());
					emitValue();
				});

				singleMarker.value = L.marker([props.lat, props.lng], { draggable: true });
				singleMarker.value.addTo(mapElement.value.map);
				singleMarker.value.on('moveend', () => emitValue());
			} else if (props.mode === 'pins') {
				const controlAddMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapElement.value.map.zoomControl.getContainer()
				);
				controlAddMarker.innerText = 'add_location';
				controlAddMarker.addEventListener('click', (event) => {
					event.preventDefault();
					addMarker(mapElement.value.map.getCenter());
					emitValue();
				});

				const controlRemoveMarker = L.DomUtil.create(
					'a',
					'directus-leaflet-custom-button-icon',
					mapElement.value.map.zoomControl.getContainer()
				);
				controlRemoveMarker.innerText = 'location_off';
				controlRemoveMarker.style.display = 'none';
				controlRemoveMarker.addEventListener('click', (event) => {
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

		function addressToCodeKeyHandler(event) {
			if (event.key === 'Escape') {
				showAddressToCode.value = false;
			} else if (event.key === 'Enter' && event.target.value && addressToCodeLatestFound.value) {
				mapElement.value.map.setView(addressToCodeLatestFound.value, 15);
			}
		}

		function updateMap(value) {
			mapElement.value.map.setView([value.lat, value.lng], value.zoom);
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

			console.log('Update map', value);
			selectedMarker.value = null;
		}

		function addMarker(latlng) {
			const marker = L.marker(latlng, { draggable: true });
			marker.addTo(mapElement.value.map);
			marker.on('moveend', () => emitValue());
			marker.on('click', (event) => {
				selectedMarker.value = event.target;
			});
			markers.value.push(marker);
		}

		function emitValue() {
			const value = {
				zoom: mapElement.value.map.getZoom(),
				lat: mapElement.value.map.getCenter().lat,
				lng: mapElement.value.map.getCenter().lng,
			};

			if (props.mode === 'pin' && singleMarker.value) {
				value.lat = singleMarker.value.getLatLng().lat;
				value.lng = singleMarker.value.getLatLng().lng;
			}

			if (props.mode === 'pins') {
				value.markers = markers.value.map((markerItem: L.MarkerType) => ({
					lat: markerItem.getLatLng().lat,
					lng: markerItem.getLatLng().lng,
				}));
			}

			console.log('value', value);

			emit('input', value);
		}

		function addressToCodeHandler(event) {
			addressToCode(event.target.value);
		}

		function addressToCode(query: string) {
			const url = `https://nominatim.openstreetmap.org/search?q=${encodeURI(query)}&format=json&limit=1`;
			addressToCodeLatestFound.value = null;
			axios
				.get(url)
				.then((response) => {
					if (response.status === 200) {
						if (response.data[0]) {
							const latlng = [response.data[0].lat, response.data[0].lon];
							mapElement.value.map.setView(latlng);
							addressToCodeLatestFound.value = latlng;
							if (props.mode === 'pin') {
								singleMarker.value.setLatLng(latlng);
							}
						}
					}
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
	cursor: pointer;
	display: inline-block;
	font-size: 1.53em;
	font-family: 'Material Icons';
	content: 'format_bold';
	-webkit-font-feature-settings: 'liga';
	font-feature-settings: 'liga';
}
</style>

<style lang="scss" scoped>
.address-to-code-control {
	margin-left: 50px;
	margin-top: 100px;
	outline: none;
	border: 1px solid #aaa;
	height: 30px;
	line-height: 30px;
	color: #000;
}
.map {
	z-index: 1;
	position: relative;
}
</style>
