<template>
	<div>
		<l-map :style="{ height: height + 'px' }">
			<l-tile-layer :url="tilesUrl"></l-tile-layer>
		</l-map>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { LMap, LTileLayer, LMarker } from 'vue-leaflet';

export default defineComponent({
	components: {
		LMap,
		LTileLayer,
		LMarker,
	},
	props: {
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
	setup(props, { emit }) {
		return {
			tilesUrl: props.theme || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		};
		// function setIcon(icon: string | null) {
		// 	searchQuery.value = '';
		//
		// 	emit('input', icon);
		// }
	},
});
</script>
