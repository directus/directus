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

	<!-- <div class="field">
		<v-drawer
			v-model="customLayerDrawerOpenWritable"
			:title="t('layouts.map.custom_layers')"
			@cancel="customLayerDrawerOpenWritable = false"
		>
			<template #activator="{ on }">
				<v-button @click="on">{{ t('layouts.map.edit_custom_layers') }}</v-button>
			</template>

			<template #actions>
				<v-button v-tooltip.bottom="t('reset')" icon rounded class="delete-action" @click="resetLayers">
					<v-icon name="replay" />
				</v-button>
				<v-button v-tooltip.bottom="t('save')" icon rounded @click="updateLayers">
					<v-icon name="check" />
				</v-button>
			</template>
			<div class="custom-layers">
				<interface-input-code v-model="customLayersWritable" language="json" type="json" :line-number="false" />
			</div>
		</v-drawer>
	</div> -->
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

		const basemaps = getBasemapSources();
		const { basemap } = toRefs(appStore);

		return {
			t,
			geometryFieldWritable,
			autoLocationFilterWritable,
			clusterDataWritable,
			customLayerDrawerOpenWritable,
			customLayersWritable,
			basemaps,
			basemap,
		};
	},
});
</script>
