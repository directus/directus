<template>
	<div class="form-grid">
		<div v-if="!nativeGeometryType && geometryFormat !== 'lnglat'" class="field half-left">
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
import { Field, GeometryType, GeometryFormat, GeometryOptions } from '@directus/shared/types';
import { getGeometryFormatForType } from '@/utils/geometry';
import { getBasemapSources, getStyleFromBasemapSource } from '@/utils/geometry/basemap';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';
import { useAppStore } from '@/stores';
import getSetting from '@/utils/get-setting';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
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

		const isGeometry = props.fieldData.type == 'geometry';
		const nativeGeometryType = isGeometry ? (props.fieldData!.schema!.geometry_type as GeometryType) : undefined;
		const geometryFormat = isGeometry ? ('native' as const) : getGeometryFormatForType(props.fieldData.type);
		const geometryType = ref<GeometryType>(
			geometryFormat.value == 'lnglat' ? 'Point' : nativeGeometryType ?? props.value?.geometryType
		);
		const defaultView = ref<CameraOptions | undefined>(props.value?.defaultView);

		watch(
			[geometryType, defaultView],
			() => {
				const type = geometryFormat == 'lnglat' ? 'Point' : geometryType;
				emit('input', { defaultView, geometryFormat, geometryType: type });
			},
			{ immediate: true }
		);

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
			isGeometry,
			nativeGeometryType,
			geometryFormat,
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
