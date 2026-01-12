<script setup lang="ts">
import { GEOMETRY_TYPES } from '@directus/constants';
import { useAppStore } from '@directus/stores';
import { Field, GeometryOptions, GeometryType } from '@directus/types';
import { CameraOptions, Map } from 'maplibre-gl';
import type { Ref } from 'vue';
import { computed, onMounted, onUnmounted, ref, toRefs, watch } from 'vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useSettingsStore } from '@/stores/settings';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';

import 'maplibre-gl/dist/maplibre-gl.css';

const props = defineProps<{
	collection: string;
	field?: Field;
	value?: GeometryOptions & { defaultView?: CameraOptions };
}>();

const emit = defineEmits(['input']);

const nativeGeometryType = computed(() => (props.field?.type.split('.')[1] as GeometryType) ?? 'Point');
const geometryType = ref<GeometryType>(nativeGeometryType.value ?? props.value?.geometryType ?? 'Point');
const defaultView = ref<CameraOptions | undefined>(props.value?.defaultView);

const settingsStore = useSettingsStore();

watch(() => props.field?.type, watchType);
watch(nativeGeometryType, watchNativeType);
watch([geometryType, defaultView], input, { immediate: true });

function watchType(type: string | undefined) {
	if (type === 'csv') geometryType.value = 'Point';
}

function watchNativeType(type: GeometryType) {
	geometryType.value = type;
}

function input() {
	emit('input', {
		defaultView,
		geometryType: geometryType.value,
	});
}

const mapContainer: Ref<HTMLElement | null> = ref(null);
let map: Map;

const mapboxKey = settingsStore.settings?.mapbox_key;
const basemaps = getBasemapSources();
const appStore = useAppStore();
const { basemap } = toRefs(appStore);

const style = computed(() => {
	const source = basemaps.find((source) => source.name == basemap.value) ?? basemaps[0];
	if (!source) return;
	return getStyleFromBasemapSource(source);
});

onMounted(() => {
	map = new Map({
		container: mapContainer.value!,
		style: style.value,
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
</script>

<template>
	<div class="form-grid">
		<div v-if="!nativeGeometryType && field?.type !== 'csv'" class="field half-left">
			<div class="type-label">{{ $t('interfaces.map.geometry_type') }}</div>
			<VSelect
				v-model="geometryType"
				:placeholder="$t('any')"
				show-deselect
				:items="GEOMETRY_TYPES.map((value) => ({ value, text: value }))"
			/>
		</div>
		<div class="field">
			<div class="type-label">{{ $t('interfaces.map.default_view') }}</div>
			<div ref="mapContainer" class="map"></div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.form-grid {
	@include mixins.form-grid;
}

.map {
	block-size: 400px;
	overflow: hidden;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}
</style>
