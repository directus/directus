<template>
	<div class="form-grid">
		<div class="field half-left">
			<div class="type-label">{{ $t('interfaces.map.geometry_format') }}</div>
			<v-select
				v-model="geometryFormat"
				:disabled="isGeometry || geometryFormatOptions.length == 1"
				:items="geometryFormatOptions"
			/>
		</div>
		<div class="field half-right">
			<div class="type-label">{{ $t('interfaces.map.geometry_type') }}</div>
			<v-select
				v-model="geometryType"
				:placeholder="$t('any')"
				:disabled="hasGeometryType || geometryFormat == 'lnglat'"
				:items="geometryTypeOptions"
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
import { ref, defineComponent, PropType, watch, onMounted, onUnmounted } from '@vue/composition-api';
import { GeometryOptions } from '@/layouts/map/lib';
import { geometryTypes, GeometryType } from '@/types';
import { geometryFormats, GeometryFormat, compatibleFormatsForType } from '@/layouts/map/lib';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, CameraOptions } from 'maplibre-gl';
import { BasemapSelectControl } from '@/layouts/map/controls';
import i18n from '@/lang';

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
		const compatibleFormats = compatibleFormatsForType(props.fieldData.type);
		const geometryFormatOptions = compatibleFormats.map((value) => ({
			value,
			text: i18n.t(`interfaces.map.${value}`),
		}));

		const geometryTypeOptions = geometryTypes
			.map((value) => ({ value, text: value }))
			.concat({ text: i18n.t('any'), value: undefined } as any);

		const geometryFormat = ref<GeometryFormat>(props.value?.geometryFormat ?? compatibleFormats[0]!);
		const geometryType = ref<GeometryType>(geometryFormat.value == 'lnglat' ? 'Point' : props.value?.geometryType);
		const defaultView = ref<CameraOptions | undefined>(props.value?.defaultView);
		const fitBounds = ref<boolean>(props.value?.fitBounds ?? true);

		const isGeometry = props.fieldData.type == 'geometry';
		const hasGeometryType = isGeometry && !!props.fieldData?.schema?.geometry_type;

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
			map.addControl(new BasemapSelectControl(), 'top-right');
		});
		onUnmounted(() => {
			map.remove();
		});

		return {
			isGeometry,
			hasGeometryType,
			geometryFormats,
			geometryFormat,
			geometryFormatOptions,
			geometryTypeOptions,
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
