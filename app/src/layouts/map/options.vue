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
				v-model="geometryField"
				:items="geometryFields.map(({ name, field }) => ({ text: name, value: field }))"
			/>
		</div>
	</template>

	<div class="field">
		<v-checkbox
			v-model="autoLocationFilter"
			:label="t('layouts.map.auto_location_filter')"
			:disabled="geometryOptions && geometryOptions.geometryFormat !== 'native'"
		/>
	</div>

	<div class="field">
		<v-checkbox
			v-model="clusterData"
			:label="t('layouts.map.cluster')"
			:disabled="geometryOptions && geometryOptions.geometryType !== 'Point'"
		/>
	</div>

	<!-- <div class="field">
		<v-drawer
			v-model="customLayerDrawerOpen"
			:title="t('layouts.map.custom_layers')"
			@cancel="customLayerDrawerOpen = false"
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
				<interface-input-code v-model="customLayers" language="json" type="json" :line-number="false" />
			</div>
		</v-drawer>
	</div> -->
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';
import { useAppStore } from '@/stores';
import { getBasemapSources } from '@/utils/geometry/basemap';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const basemaps = getBasemapSources();
		const appStore = useAppStore();
		const { basemap } = toRefs(appStore);

		const layoutState = useLayoutState();
		const {
			props,
			geometryFields,
			geometryField,
			autoLocationFilter,
			geometryOptions,
			clusterData,
			customLayerDrawerOpen,
			resetLayers,
			updateLayers,
			customLayers,
		} = toRefs(layoutState.value);

		return {
			t,
			props,
			geometryFields,
			geometryField,
			autoLocationFilter,
			geometryOptions,
			clusterData,
			customLayerDrawerOpen,
			resetLayers,
			updateLayers,
			customLayers,
			basemaps,
			basemap,
		};
	},
});
</script>
