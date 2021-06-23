<template>
	<div class="form-grid">
		<div class="field half-left">
			<div class="type-label">{{ t('interfaces.map.geometry_format') }}</div>
			<v-input :disabled="true" v-model="geometryFormat" :value="t(`interfaces.map.${compatibleFormat}`)" />
		</div>
		<div class="field half-right">
			<div class="type-label">{{ t('interfaces.map.geometry_type') }}</div>
			<v-select
				v-model="geometryType"
				:placeholder="t('any')"
				:showDeselect="true"
				:disabled="hasGeometryType || geometryFormat == 'lnglat'"
				:items="geometryTypes.map((value) => ({ value, text: value }))"
			/>
		</div>
		<div class="field">
			<div class="type-label">{{ t('interfaces.map.default_view') }}</div>
			<div class="map" ref="mapContainer"></div>
		</div>
		<div class="field half-left">
			<div class="type-label">{{ t('interfaces.map.fit_bounds') }}</div>
			<v-checkbox block :input-value="fitBounds" :label="t('enabled')" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field } from '@/types';
import { ref, defineComponent, PropType, watch, onMounted, onUnmounted } from 'vue';
import { geometryTypes, GeometryType, GeometryFormat } from '@/types';
import { getGeometryFormatForType, GeometryOptions } from '@/utils/geometry';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';

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
			type: Object as PropType<GeometryOptions & { defaultView?: CameraOptions; fitBounds: boolean }>,
		},
	},
	setup(props, { emit }) {
		const { t } = useI18n();

		const isGeometry = props.fieldData.type == 'geometry';
		const hasGeometryType = isGeometry && !!props.fieldData!.schema!.geometry_type;
		const compatibleFormat = isGeometry ? ('native' as const) : getGeometryFormatForType(props.fieldData.type);

		const geometryFormat = ref<GeometryFormat>(compatibleFormat!);
		const geometryType = ref<GeometryType>(geometryFormat.value == 'lnglat' ? 'Point' : props.value?.geometryType);
		const defaultView = ref<CameraOptions | undefined>(props.value?.defaultView);
		const fitBounds = ref<boolean>(props.value?.fitBounds ?? true);

		watch(
			[geometryFormat, geometryType, defaultView, fitBounds],
			() => {
				const type = geometryFormat.value == 'lnglat' ? 'Point' : geometryType;
				emit('input', { defaultView, geometryFormat, geometryType: type, fitBounds: fitBounds.value });
			},
			{ immediate: true }
		);

		const mapContainer = ref<HTMLElement | null>(null);
		let map: Map;
		onMounted(() => {
			map = new Map({
				container: mapContainer.value!,
				style: { version: 8, layers: [] },
				attributionControl: false,
				...(defaultView.value || {}),
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
			hasGeometryType,
			compatibleFormat,
			geometryFormat,
			geometryTypes,
			geometryType,
			mapContainer,
			fitBounds,
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
