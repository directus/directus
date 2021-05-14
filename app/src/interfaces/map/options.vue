<template>
	<div class="form-grid">
		<div class="field">
			<div class="type-label">{{ $t('interfaces.map.geometry_format') }}</div>
			<v-select
				v-model="geometryFormat"
				:disabled="isNativeGeometry"
				:items="compatibleFormats.map((value) => ({ value, text: $t(`interfaces.map.${value}`) }))"
			/>
		</div>
		<div class="field half">
			<div class="type-label">{{ $t('interfaces.map.geometry_type') }}</div>
			<v-select
				v-model="geometryType"
				:disabled="isNativeGeometry"
				:items="geometryTypes.map((value) => ({ value, text: value }))"
			/>
		</div>
		<div class="field half">
			<div class="type-label">{{ $t('interfaces.map.geometry_crs') }}</div>
			<v-select
				:disabled="isNativeGeometry"
				v-model="geometryCRS"
				:allowOther="true"
				:items="[
					{ value: 'EPSG:4326', text: 'EPSG:4326 / WGS84' },
					{ value: 'EPSG:4269', text: 'EPSG:4269 / NAD83' },
					{ value: 'EPSG:3857', text: 'EPSG:3857 / Web Mercator' },
				]"
			/>
		</div>
		<div class="field">
			<div class="type-label">{{ $t('interfaces.map.default_position') }}</div>
			<div class="map" ref="mapContainer"></div>
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { ref, defineComponent, PropType, computed, watch, onMounted, onUnmounted } from '@vue/composition-api';
import { GeometryOptions } from '@/layouts/map/lib';
import {
	geometryFormats,
	geometryTypes,
	GeometryFormat,
	GeometryType,
	compatibleFormatsForType,
} from '@/layouts/map/lib';
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
			type: Object as PropType<GeometryOptions & { defaultPosition: CameraOptions }>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const isNativeGeometry = computed(() => props.fieldData.type == 'geometry');
		const compatibleFormats = computed(() => compatibleFormatsForType(props.fieldData.type));
		const geometryFormat = ref<GeometryFormat>(props.value?.geometryFormat ?? compatibleFormats.value[0]!);
		const geometryType = ref<GeometryType>(props.value?.geometryType);
		const geometryCRS = ref<string | undefined>(props.value?.geometryCRS);
		const defaultPosition = ref<CameraOptions>(props.value?.defaultPosition);
		if (isNativeGeometry) {
			const special = props.fieldData?.meta?.special as [string, GeometryFormat, GeometryType, string | undefined];
			if (special) {
				[, geometryFormat.value, geometryType.value] = special;
				geometryCRS.value = undefined;
			}
		}
		watch(
			[geometryFormat, geometryType, geometryCRS, defaultPosition],
			() => {
				emit('input', { geometryFormat, geometryType, geometryCRS, defaultPosition });
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
				...(defaultPosition.value || {}),
			});
			map.addControl(new BasemapSelectControl(), 'top-right');
			map.on('moveend', () => {
				defaultPosition.value = {
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
			isNativeGeometry,
			geometryFormats,
			geometryFormat,
			compatibleFormats,
			geometryTypes,
			geometryType,
			geometryCRS,
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
	// position: relative;
	// width: 100%;
	height: 400px;
}
</style>
