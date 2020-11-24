<template>
	<div>
		<div class="map" :style="{ height: height + 'px' }" ref="mapElement"></div>
		<div class="leaflet-bottom leaflet-left">
			<input type="search" >
		</div>
	</div>
</template>

<script lang="ts">
import {defineComponent, onMounted, onUnmounted, watch, ref} from '@vue/composition-api';
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
		marker: {
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
	setup(props, {emit}) {
		const mapElement = ref<HTMLElement | null>(null);
		const markers = ref<Array>([]);
		const selectedMarker = ref(null);
		const tilesUrl = props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		// console.log('input value', props.value);

		// watch(() => props.value, (a) => {
		// 	if (!mapElement.value?.map) {
		// 		return;
		// 	}
		// }, {immediate: true});

		onMounted(initMap);

		onUnmounted(() => {
			mapElement.value.map.remove();
		});

		window.xx = {
			mapElement,
			L,
			addMarker,
			markers,
		};

		return {
			mapElement,
			tilesUrl,
		};

		function initMap() {
			mapElement.value.map = L.map(mapElement.value, {
				center: [props.value?.lat || props.lat, props.value?.lng || props.lng],
				zoom: props.value?.zoom || props.zoom,
				preferCanvas: true,
				attributionControl: true,
				zoomControl: true,
				maxZoom: props.maxZoom,
			});

			const attribution = [
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

			(props.value?.markers || []).forEach((marker) => {
				addMarker([marker.lat, marker.lng]);
			});

			const controlMyLocation = L.DomUtil.create('a', 'directus-leaflet-custom-button-icon', mapElement.value.map.zoomControl.getContainer())
			controlMyLocation.innerText = 'my_location'
			controlMyLocation.addEventListener('click', function (event) {
				event.preventDefault();
				if (this.classList.contains('loading')) {
					return;
				}
				this.classList.add('loading');
				navigator.geolocation.getCurrentPosition((success) => {
					this.classList.remove('loading');
					// Set some fancy zoom level based on accuracy.
					const zoom = 13 + (4 - Math.round(Math.min(200, parseInt(success.accuracy) || 100) / 50));
					console.log([success.coords.latitude, success.coords.longitude], zoom, success.coords, success.accuracy);
					mapElement.value.map.setView([success.coords.latitude, success.coords.longitude], zoom)
				}, () => {
					this.classList.remove('loading');
				});
			});


			const controlLocationByAddress = L.DomUtil.create('a', 'directus-leaflet-custom-button-icon', mapElement.value.map.zoomControl.getContainer())
			controlLocationByAddress.innerText = 'location';
			controlLocationByAddress.addEventListener('click', (event) => {
				event.preventDefault();
			});

			const controlAddMarker = L.DomUtil.create('a', 'directus-leaflet-custom-button-icon', mapElement.value.map.zoomControl.getContainer())
			controlAddMarker.innerText = 'add_location';
			controlAddMarker.addEventListener('click', (event) => {
				event.preventDefault();
				addMarker();
				emitValue();
			});

			const controlRemoveMarker = L.DomUtil.create('a', 'directus-leaflet-custom-button-icon', mapElement.value.map.zoomControl.getContainer())
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

			watch(() => selectedMarker.value, () => {
				controlRemoveMarker.style.display = !!selectedMarker.value ? null : 'none';
			});
		}

		function updateMap(values) {
			mapElement.value.map.setCenter([value.lat, value.lng]);
			mapElement.value.map.setZoom([value.zoom]);
		}

		function addMarker(latlng) {
			const marker = L.marker(latlng || mapElement.value.map.getCenter(), {draggable: true});
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

			if (1 || props.marker === 'pins') {
				value.markers = markers.value.map((markerItem: L.MarkerType) => ({
					lat: markerItem.getLatLng().lat,
					lng: markerItem.getLatLng().lng,
				}));
			}

			console.log('value', value);

			emit('input', value);
		}

		function addressToCode(query: string) {
			const url = `https://nominatim.openstreetmap.org/search?q=${encodeURI(
				query
			)}&format=geojson&addressdetails=1&limit=1`;
			axios.get(url)
				.then(response => {
					if (response.status === 200) {
						if (!response.data.features[0]) {
							// this.$events.emit('error', {
							// 	notify: this.$t('interfaces.map.address_to_code_error'),
							// 	error: 'result'
							// });
						} else {
							// let coordArray = response.data.features[0].geometry.coordinates;
							// let coordinates = {
							// 	lat: coordArray[1],
							// 	lng: coordArray[0]
							// };
							// this.setValue(coordinates);
							// this.map.panTo(new leaflet.LatLng(coordArray[1], coordArray[0]));
							// this.$store.dispatch('loadingFinished', this.isLocating);
						}
					}
				})
				.catch(error => {
					emit('error', {
						notify: 'err',
						error: error.toString()
					})
				});
		}

	},
});
</script>

<style>
@keyframes directus-leaflet-custom-loading {
	0% {
		transform: rotate(0deg);
	}

	50% {
		transform: rotate(360deg);
	}

	100% {
		transform: rotate(1080deg);
	}
}

.directus-leaflet-custom-button-icon.loading {
	animation: directus-leaflet-custom-loading infinite linear;
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
.leaflet-container {
	z-index: 1;
}
</style>
