<template>
	<div class="field">
		<div class="type-label">{{ t('layouts.map.basemap') }}</div>
		<v-select v-model="basemap" :items="basemaps.map((s) => ({ text: s.name, value: s.name }))" />
	</div>

	<template v-if="geometryFields.length == 0">
		<div class="field">
			<v-input type="text" disabled :prefix="'No compatible fields'"></v-input>
		</div>
	</template>
	<template v-else>
		<div class="field">
			<div class="type-label">{{ t('layouts.map.field') }}</div>
			<v-select
				v-model="geometryFieldWritable"
				:items="geometryFields.map(({ name, field }) => ({ text: name, value: field }))"
			/>
		</div>
	</template>

	<div class="field">
		<div class="type-label">{{ t('display_template') }}</div>
		<v-field-template v-model="displayTemplateWritable" :collection="collection" />
	</div>

	<div class="field">
		<v-checkbox
			v-model="autoLocationFilterWritable"
			:label="t('layouts.map.auto_location_filter')"
			:disabled="geometryOptions && geometryOptions.geometryFormat !== 'native'"
		/>
	</div>

	<div class="field">
		<v-checkbox
			v-model="clusterDataWritable"
			:label="t('layouts.map.cluster')"
			:disabled="geometryOptions && geometryOptions.geometryType !== 'Point'"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, toRefs } from 'vue';

import { useAppStore } from '@/stores';
import { getBasemapSources } from '@/utils/geometry/basemap';
import { GeometryOptions, Item } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	inheritAttrs: false,
	props: {
		collection: {
			type: String,
			required: true,
		},
		geometryFields: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		geometryField: {
			type: String,
			default: undefined,
		},
		autoLocationFilter: {
			type: Boolean,
			default: undefined,
		},
		geometryOptions: {
			type: Object as PropType<GeometryOptions>,
			default: undefined,
		},
		clusterData: {
			type: Boolean,
			default: undefined,
		},
		customLayerDrawerOpen: {
			type: Boolean,
			required: true,
		},
		resetLayers: {
			type: Function as PropType<() => void>,
			required: true,
		},
		updateLayers: {
			type: Function as PropType<() => void>,
			required: true,
		},
		customLayers: {
			type: Array as PropType<any[]>,
			default: undefined,
		},
		displayTemplate: {
			type: String as string | undefined,
			default: undefined,
		},
	},
	emits: [
		'update:geometryField',
		'update:autoLocationFilter',
		'update:clusterData',
		'update:customLayerDrawerOpen',
		'update:customLayers',
	],
	setup(props, { emit }) {
		const { t } = useI18n();

		const appStore = useAppStore();

		const geometryFieldWritable = useSync(props, 'geometryField', emit);
		const autoLocationFilterWritable = useSync(props, 'autoLocationFilter', emit);
		const clusterDataWritable = useSync(props, 'clusterData', emit);
		const customLayerDrawerOpenWritable = useSync(props, 'customLayerDrawerOpen', emit);
		const customLayersWritable = useSync(props, 'customLayers', emit);
		const displayTemplateWritable = useSync(props, 'displayTemplate', emit);

		const basemaps = getBasemapSources();
		const { basemap } = toRefs(appStore);

		return {
			t,
			geometryFieldWritable,
			autoLocationFilterWritable,
			clusterDataWritable,
			customLayerDrawerOpenWritable,
			customLayersWritable,
			displayTemplateWritable,
			basemaps,
			basemap,
		};
	},
});
</script>
