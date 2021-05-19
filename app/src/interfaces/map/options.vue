<template>
	<div class="form-grid">
		<div class="field half-left">
			<div class="type-label">{{ $t('interfaces.map.geometry_format') }}</div>
			<v-select
				v-model="geometryFormat"
				:disabled="isGeometry || compatibleFormats.length == 1"
				:items="compatibleFormats.map((value) => ({ value, text: $t(`interfaces.map.${value}`) }))"
			/>
		</div>
		<div class="field half-right">
			<div class="type-label">{{ $t('interfaces.map.geometry_type') }}</div>
			<v-select
				v-model="geometryType"
				:placeholder="$t('any')"
				:disabled="hasGeometryType || geometryFormat == 'lnglat'"
				:items="geometryTypes.map((value) => ({ value, text: value })).concat({ text: $t('any'), value: undefined })"
			/>
		</div>
		<div class="field">
			<div class="type-label">{{ $t('interfaces.map.default_view') }}</div>
			<div class="map" ref="mapContainer"></div>
		</div>
		<div class="field half-left">
			<div class="type-label">{{ $t('interfaces.map.fit_bounds') }}</div>
			<v-checkbox block :input-value="fitBounds" :label="$t('enabled')" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { ref, defineComponent, PropType, computed, watch, onMounted, onUnmounted } from '@vue/composition-api';
import { GeometryOptions } from '@/layouts/map/lib';
import { geometryTypes, GeometryType } from '@/types';
import { geometryFormats, GeometryFormat, compatibleFormatsForType } from '@/layouts/map/lib';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';
import { BasemapSelectControl } from '@/layouts/map/controls';

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
			type: Object as PropType<GeometryOptions & { defaultView: CameraOptions; fitBounds: boolean }>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const compatibleFormats = computed(() => compatibleFormatsForType(props.fieldData.type));
		const geometryFormat = ref<GeometryFormat>(props.value?.geometryFormat ?? compatibleFormats.value[0]!);
		const geometryType = ref<GeometryType | undefined>(props.value?.geometryType);
		const defaultView = ref<CameraOptions>(props.value?.defaultView);
		const fitBounds = ref<boolean>(props.value?.fitBounds || true);

		const isGeometry = props.fieldData.type == 'geometry';
		let hasGeometryType = false;
		if (isGeometry) {
			geometryType.value = props.fieldData?.schema?.geometry_type;
			hasGeometryType = !!geometryType.value;
		}

		watch(
			[geometryFormat, geometryType, defaultView, fitBounds],
			() => {
				emit('input', { geometryFormat, geometryType, defaultView, fitBounds: fitBounds.value });
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
			map.addControl(new BasemapSelectControl(), 'top-right');
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
			isGeometry,
			hasGeometryType,
			geometryFormats,
			geometryFormat,
			compatibleFormats,
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
