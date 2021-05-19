<template>
	<div class="mapboxgl-ctrl-group mapboxgl-ctrl mapboxgl-ctrl-dropdown">
		<v-icon name="map" />
		<v-select
			inline
			:value="basemap.name"
			@input="handleInput"
			:items="basemaps.map((s) => ({ text: s.name, value: s.name }))"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs, watch } from '@vue/composition-api';
import type { Map } from 'maplibre-gl';
import { getBasemapSources, BasemapSource, getStyleFromBasemapSource } from '@/layouts/map/basemap';
import { useAppStore } from '@/stores';

export default defineComponent({
	props: {
		map: {
			type: Object as PropType<Map>,
			required: true,
		},
	},
	setup(props) {
		const basemaps = getBasemapSources();
		const basemap = ref<BasemapSource>();
		const appStore = useAppStore();
		const { basemap: basemapName } = toRefs(appStore.state);

		function handleInput(name: string) {
			basemapName.value = name;
		}
		function update(name: string) {
			basemap.value = basemaps.find((source) => source.name == name) ?? basemaps[0];
			props.map.fire('basemapselect');
			props.map.setStyle(getStyleFromBasemapSource(basemap.value), { diff: false });
		}
		watch(() => basemapName.value, update, { immediate: true });
		return {
			basemaps,
			basemap,
			handleInput,
		};
	},
});
</script>
