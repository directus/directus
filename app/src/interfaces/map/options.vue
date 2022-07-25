<template>
	<div class="form-grid">
		<div v-if="!nativeGeometryType && field.type !== 'csv'" class="field half-left">
			<div class="type-label">{{ t('interfaces.map.geometry_type') }}</div>
			<v-select
				v-model="geometryType"
				:placeholder="t('any')"
				:show-deselect="true"
				:items="GEOMETRY_TYPES.map((value) => ({ value, text: value }))"
			/>
		</div>
		<div class="field">
			<div class="type-label">{{ t('interfaces.map.default_view') }}</div>
			<div ref="mapContainer" class="map"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, defineComponent, PropType, watch, onMounted, onUnmounted, computed, toRefs } from 'vue';
import { GEOMETRY_TYPES } from '@directus/shared/constants';
import { Field, GeometryType, GeometryOptions } from '@directus/shared/types';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';
import { useAppStore } from '@/stores/app';
import { useSettingsStore } from '@/stores/settings';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: Object as PropType<Field>,
			default: null,
		},
		value: {
			type: Object as PropType<GeometryOptions & { defaultView?: CameraOptions }>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

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

		const mapContainer = ref<HTMLElement | null>(null);
		let map: Map;

		const mapboxKey = settingsStore.settings?.mapbox_key;
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
			nativeGeometryType,
			GEOMETRY_TYPES,
			geometryType,
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
