<template>
	<div class="form-grid">
		<div class="field">
			<div class="type-label">{{ t('interfaces.map.default_view') }}</div>
			<div ref="mapContainer" class="map"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, defineComponent, PropType, onMounted, onUnmounted, computed, toRefs } from 'vue';
import { GEOMETRY_TYPES } from '@directus/shared/constants';
import { GeometryOptions } from '@directus/shared/types';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';
import { useAppStore } from '@/stores';
import getSetting from '@/utils/get-setting';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<GeometryOptions & { defaultView?: CameraOptions }>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();

		const defaultView = ref<CameraOptions | undefined>(props.value?.defaultView);

		const mapContainer = ref<HTMLElement | null>(null);
		let map: Map;

		const mapboxKey = getSetting('mapbox_key');
		const basemaps = getBasemapSources();
		const appStore = useAppStore();
		const { basemap } = toRefs(appStore);
		const style = computed(() => {
			const source = basemaps.find((source) => source.name == basemap.value) ?? basemaps[0];
			return getStyleFromBasemapSource(source);
		});

		onMounted(() => {
			map = new Map({
				container: mapContainer.value!,
				style: style.value,
				attributionControl: false,
				...(defaultView.value || {}),
				...(mapboxKey ? { accessToken: mapboxKey } : {}),
			});
			map.on('moveend', () => {
				defaultView.value = {
					center: map.getCenter(),
					zoom: map.getZoom(),
					bearing: map.getBearing(),
					pitch: map.getPitch(),
				};
			});
		});

		onUnmounted(() => {
			map.remove();
		});

		return {
			t,
			GEOMETRY_TYPES,
			mapContainer,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}

.map {
	height: 400px;
	overflow: hidden;
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
}
</style>
